import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { sequelize } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { hashPassword } from "../../src/utils/auth-crypto.js";

const {
  Tenant, Doctor, Patient, AuthUser, AuthUserTenant, AssessmentDefinition,
  AssessmentSession, DoctorReview, FoodItem,
} = models;

let server; let baseUrl; let available = false;
let tenantA; let tenantB; let doctorA; let patientA; let doctorUser; let patientUser; let approvedReview; let rejectedReview;

async function reachable() { try { await sequelize.authenticate(); return true; } catch { return false; } }

before(async () => {
  available = await reachable();
  if (!available) return;
  tenantA = await Tenant.findOne({ where: { slug: "dr-kareem" } });
  tenantB = await Tenant.findOrCreate({ where: { slug: `plan-tenant-${Date.now()}` }, defaults: { name: "Plan Tenant B" } }).then(([row]) => row);
  doctorA = await Doctor.findOne({ where: { tenant_id: tenantA.id, active: true } });
  patientA = await Patient.create({ tenant_id: tenantA.id, full_name: "Plan Patient", status: "active" });
  doctorUser = await AuthUser.create({ email: `plan-doctor-${Date.now()}@example.test`, password_hash: await hashPassword("PlanDoctor123!"), user_type: "doctor", doctor_id: doctorA.id, status: "enabled" });
  patientUser = await AuthUser.create({ email: `plan-patient-${Date.now()}@example.test`, password_hash: await hashPassword("PlanPatient123!"), user_type: "patient", patient_id: patientA.id, status: "enabled" });
  await AuthUserTenant.bulkCreate([
    { user_id: doctorUser.id, tenant_id: tenantA.id, role: "doctor", active: true },
    { user_id: patientUser.id, tenant_id: tenantA.id, role: "patient", active: true },
  ]);
  approvedReview = await createReview("approved");
  rejectedReview = await createReview("rejected");
  server = createApp().listen(0);
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => { if (server) await new Promise((resolve) => server.close(resolve)); await sequelize.close(); });

async function createReview(status) {
  const definition = await AssessmentDefinition.findOne({ where: { version: "1.0" }, raw: true });
  const token = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const session = await AssessmentSession.create({ tenant_id: tenantA.id, session_token: token, assessment_definition_id: definition.id, subject: "self", language: "ar", status: "submitted", submitted_at: new Date(), patient_name: patientA.full_name, patient_age_years: 30, patient_sex: "male" });
  return DoctorReview.create({ tenant_id: tenantA.id, assessment_session_id: session.id, patient_id: patientA.id, status, decision: status === "approved" ? "approved" : "rejected", decided_at: new Date() });
}

async function request(path, options = {}) { return fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); }
async function login(email, password, tenantSlug = tenantA.slug) { const response = await request("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ identifier: email, password, tenantSlug }) }); return (await response.json()).data.accessToken; }
function headers(token, tenant = tenantA) { return { Authorization: `Bearer ${token}`, "X-Tenant-Slug": tenant.slug }; }
async function createPlan(domain, token, reviewId = approvedReview.id) {
  const food = await FoodItem.findOne({ where: { active: true }, raw: true });
  const body = { patientId: patientA.id, doctorReviewId: reviewId, version: domain === "nutrition" ? { targets: { calories: 2000 }, meals: [{ code: "breakfast", nameEn: "Breakfast", dayNumber: 1, items: [{ foodItemId: food.id, quantity: 1, unit: food.unit || "portion" }] }] } : { sets: "3", reps: "10", duration: "30 min", frequency: "3/week", rest: "60 sec", notes: "Doctor-authored" } };
  const response = await request(`/api/v1/${domain}-plans`, { method: "POST", headers: headers(token), body: JSON.stringify(body) });
  return { response, body: await response.json() };
}

describe("Phase 3C nutrition and exercise plans", () => {
  it("creates doctor-authored nutrition and exercise drafts", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const token = await login(doctorUser.email, "PlanDoctor123!");
    const nutrition = await createPlan("nutrition", token); const exercise = await createPlan("exercise", token);
    assert.equal(nutrition.response.status, 201); assert.equal(exercise.response.status, 201);
    assert.equal(nutrition.body.data.plan.status, "draft"); assert.equal(exercise.body.data.plan.status, "draft");
    assert.equal((await request(`/api/v1/nutrition-plans/${nutrition.body.data.plan.id}`, { headers: headers(token) })).status, 200);
    assert.equal((await request(`/api/v1/nutrition-plans/${nutrition.body.data.plan.id}`, { headers: headers(token, tenantB) })).status, 403);
    assert.equal((await request(`/api/v1/nutrition-plans/${nutrition.body.data.plan.id}`, { headers: headers(await login(patientUser.email, "PlanPatient123!")) })).status, 403);
  });

  it("rejects wrong-patient and unapproved-review plan creation/approval", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const token = await login(doctorUser.email, "PlanDoctor123!");
    const wrongPatient = await Patient.create({ tenant_id: tenantA.id, full_name: "Other Patient", status: "active" });
    const wrong = await request("/api/v1/nutrition-plans", { method: "POST", headers: headers(token), body: JSON.stringify({ patientId: wrongPatient.id, doctorReviewId: approvedReview.id }) });
    assert.equal(wrong.status, 409);
    const draft = await createPlan("nutrition", token, rejectedReview.id);
    assert.equal(draft.response.status, 201);
    const versionId = draft.body.data.version.id;
    assert.equal((await request(`/api/v1/nutrition-plan-versions/${versionId}/submit-review`, { method: "POST", headers: headers(token) })).status, 200);
    const approval = await request(`/api/v1/nutrition-plan-versions/${versionId}/approve`, { method: "POST", headers: headers(token) });
    assert.equal(approval.status, 409);
  });

  it("approves, activates, versions, and atomically replaces a nutrition plan", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const token = await login(doctorUser.email, "PlanDoctor123!");
    const created = await createPlan("nutrition", token); const planId = created.body.data.plan.id; const version1 = created.body.data.version.id;
    assert.equal((await request(`/api/v1/nutrition-plan-versions/${version1}/submit-review`, { method: "POST", headers: headers(token) })).status, 200);
    assert.equal((await request(`/api/v1/nutrition-plan-versions/${version1}/approve`, { method: "POST", headers: headers(token) })).status, 200);
    assert.equal((await request(`/api/v1/nutrition-plan-versions/${version1}/activate`, { method: "POST", headers: headers(token) })).status, 200);
    const version2 = await request(`/api/v1/nutrition-plans/${planId}/versions`, { method: "POST", headers: headers(token), body: JSON.stringify({ doctorReviewId: approvedReview.id, targets: { calories: 1900 }, notes: "Follow-up version" }) });
    const version2Body = await version2.json(); assert.equal(version2.status, 201);
    assert.equal((await request(`/api/v1/nutrition-plan-versions/${version2Body.data.id}/submit-review`, { method: "POST", headers: headers(token) })).status, 200);
    assert.equal((await request(`/api/v1/nutrition-plan-versions/${version2Body.data.id}/approve`, { method: "POST", headers: headers(token) })).status, 200);
    assert.equal((await request(`/api/v1/nutrition-plan-versions/${version2Body.data.id}/activate`, { method: "POST", headers: headers(token) })).status, 200);
    const detail = await (await request(`/api/v1/nutrition-plans/${planId}`, { headers: headers(token) })).json();
    const versions = detail.data.versions;
    assert.equal(versions.filter((version) => version.status === "active").length, 1);
    assert.equal(versions.some((version) => String(version.id) === String(version1) && version.status === "archived"), true);
    assert.equal(versions.length, 2);
    assert.equal((await request(`/api/v1/patients/${patientA.id}/nutrition-plan`, { headers: headers(await login(patientUser.email, "PlanPatient123!")) })).status, 200);
  });

  it("keeps nutrition and exercise active plans independent and hides private notes", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const token = await login(doctorUser.email, "PlanDoctor123!");
    const exercise = await createPlan("exercise", token); const versionId = exercise.body.data.version.id; const planId = exercise.body.data.plan.id;
    for (const action of ["submit-review", "approve", "activate"]) assert.equal((await request(`/api/v1/exercise-plan-versions/${versionId}/${action}`, { method: "POST", headers: headers(token) })).status, 200);
    const note = await request(`/api/v1/exercise-plans/${planId}/notes`, { method: "POST", headers: headers(token), body: JSON.stringify({ body: "Internal note" }) });
    assert.equal(note.status, 201);
    const visible = await request(`/api/v1/exercise-plans/${planId}/notes`, { method: "POST", headers: headers(token), body: JSON.stringify({ body: "Visible note", visibility: "patient_visible" }) });
    assert.equal(visible.status, 201);
    const patient = await (await request(`/api/v1/patients/${patientA.id}/exercise-plan`, { headers: headers(await login(patientUser.email, "PlanPatient123!")) })).json();
    assert.equal(patient.data.notes.length, 1); assert.equal(patient.data.notes[0].visibility, "patient_visible");
    assert.equal((await request(`/api/v1/exercise-plans/${planId}/notes`, { method: "POST", headers: headers(await login(patientUser.email, "PlanPatient123!")), body: JSON.stringify({ body: "No" }) })).status, 403);
    assert.equal(patient.data.plan.status, "active");
  });
});
