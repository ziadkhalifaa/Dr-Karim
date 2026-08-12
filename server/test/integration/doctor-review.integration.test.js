import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { sequelize } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { hashPassword } from "../../src/utils/auth-crypto.js";
import { sha256Hex } from "../../src/utils/hash.js";

const {
  Tenant, Doctor, Patient, AuthUser, AuthUserTenant, AssessmentDefinition,
  AssessmentSession, AssessmentAnswer, AssessmentSnapshot, DoctorReview,
  DoctorReviewEvent, AssessmentFlag, FlagRuleVersion, PatientCondition,
  NutritionPlan, ExercisePlanVersion,
} = models;

let server; let baseUrl; let available = false;
let tenantA; let tenantB; let doctorA; let doctorUser; let patientUser; let reviewId; let rejectedReviewId;

async function reachable() { try { await sequelize.authenticate(); return true; } catch { return false; } }

before(async () => {
  available = await reachable();
  if (!available) return;
  tenantA = await Tenant.findOne({ where: { slug: "dr-kareem" } });
  tenantB = await Tenant.findOrCreate({ where: { slug: `review-tenant-${Date.now()}` }, defaults: { name: "Review Tenant B" } }).then(([row]) => row);
  doctorA = await Doctor.findOne({ where: { tenant_id: tenantA.id, active: true } });
  doctorUser = await AuthUser.create({ email: `review-doctor-${Date.now()}@example.test`, password_hash: await hashPassword("ReviewDoctor123!"), user_type: "doctor", doctor_id: doctorA.id, status: "enabled" });
  const patient = await Patient.create({ tenant_id: tenantA.id, full_name: "Review Patient", status: "active" });
  patientUser = await AuthUser.create({ email: `review-patient-${Date.now()}@example.test`, password_hash: await hashPassword("ReviewPatient123!"), user_type: "patient", patient_id: patient.id, status: "enabled" });
  await AuthUserTenant.bulkCreate([
    { user_id: doctorUser.id, tenant_id: tenantA.id, role: "doctor", active: true },
    { user_id: patientUser.id, tenant_id: tenantA.id, role: "patient", active: true },
  ]);
  const urgent = await createReview(tenantA, "urgent");
  const standard = await createReview(tenantA, "standard");
  reviewId = urgent.id;
  rejectedReviewId = standard.id;
  server = createApp().listen(0);
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => { if (server) await new Promise((resolve) => server.close(resolve)); await sequelize.close(); });

async function createReview(tenant, tier) {
  const definition = await AssessmentDefinition.findOne({ where: { version: "1.0" }, raw: true });
  const token = `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const session = await AssessmentSession.create({ tenant_id: tenant.id, session_token: token, assessment_definition_id: definition.id, subject: "self", language: "ar", status: "submitted", submitted_at: new Date(), patient_name: `${tier} Patient`, patient_age_years: 30, patient_sex: "male", derived_bmi: 22.86, overall_tier: tier });
  await AssessmentAnswer.create({ session_id: session.id, question_code: "Q01_03", stored_value: session.patient_name });
  const snapshotPayload = { source: "review-fixture", tier, token };
  await AssessmentSnapshot.create({ session_id: session.id, full_payload_json: JSON.stringify(snapshotPayload), payload_hash: sha256Hex(JSON.stringify(snapshotPayload)) });
  if (tier === "urgent") {
    const ruleVersion = await FlagRuleVersion.findOne({ raw: true });
    if (ruleVersion) await AssessmentFlag.create({ tenant_id: tenant.id, session_id: session.id, flag_rule_id: ruleVersion.flag_rule_id, flag_rule_version_id: ruleVersion.id, tier: "urgent", message_ar: "urgent", message_en: "urgent", question_refs_json: [], trigger_context_json: {}, status: "pending" });
  }
  const review = await DoctorReview.create({ tenant_id: tenant.id, assessment_session_id: session.id, status: "queued" });
  await DoctorReviewEvent.create({ tenant_id: tenant.id, review_id: review.id, from_status: null, to_status: "queued", actor_type: "system", actor_id: "fixture", note: "fixture" });
  return review;
}

async function request(path, options = {}) { return fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); }
async function token(email, password) { const response = await request("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ identifier: email, password, tenantSlug: tenantA.slug }) }); return (await response.json()).data.accessToken; }
function authHeader(accessToken, tenant = tenantA) { return { Authorization: `Bearer ${accessToken}`, "X-Tenant-Slug": tenant.slug }; }

describe("Phase 3B doctor review workflow", { concurrency: false }, () => {
  it("authorizes the queue and prioritizes urgent reviews", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const doctorToken = await token(doctorUser.email, "ReviewDoctor123!");
    const response = await request("/api/v1/doctor/reviews", { headers: authHeader(doctorToken) });
    const body = await response.json();
    assert.equal(response.status, 200);
    const urgentIndex = body.data.findIndex((item) => item.id === String(reviewId));
    const standardIndex = body.data.findIndex((item) => item.id === String(rejectedReviewId));
    assert.ok(urgentIndex >= 0);
    if (standardIndex >= 0) assert.ok(urgentIndex < standardIndex);
    assert.equal(body.data[urgentIndex].priority, "urgent");
    const patientToken = await token(patientUser.email, "ReviewPatient123!");
    assert.equal((await request("/api/v1/doctor/reviews", { headers: authHeader(patientToken) })).status, 403);
  });

  it("denies cross-tenant review access", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const crossTenantReview = await createReview(tenantB, "standard");
    const doctorToken = await token(doctorUser.email, "ReviewDoctor123!");
    assert.equal((await request(`/api/v1/doctor/reviews/${crossTenantReview.id}`, { headers: authHeader(doctorToken) })).status, 404);
    assert.equal((await request("/api/v1/doctor/reviews", { headers: authHeader(doctorToken, tenantB) })).status, 403);
  });

  it("rejects invalid transitions and records the complete workflow", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const doctorToken = await token(doctorUser.email, "ReviewDoctor123!");
    const headers = authHeader(doctorToken);
    assert.equal((await request(`/api/v1/doctor/reviews/${reviewId}/open`, { method: "POST", headers })).status, 409);
    assert.equal((await request(`/api/v1/doctor/reviews/${reviewId}/assign`, { method: "POST", headers, body: JSON.stringify({}) })).status, 200);
    assert.equal((await request(`/api/v1/doctor/reviews/${reviewId}/open`, { method: "POST", headers })).status, 200);
    assert.equal((await request(`/api/v1/doctor/reviews/${reviewId}/clarification`, { method: "POST", headers, body: JSON.stringify({ note: "Need medication dose" }) })).status, 200);
    assert.equal((await request(`/api/v1/doctor/reviews/${reviewId}/open`, { method: "POST", headers })).status, 200);
    const before = await request(`/api/v1/doctor/reviews/${reviewId}` , { headers });
    const beforeBody = await before.json();
    const sessionId = beforeBody.data.assessment.session.id;
    assert.equal(beforeBody.data.profile.conditions.length, 0);
    const note = await request(`/api/v1/doctor/reviews/${reviewId}/notes`, { method: "POST", headers, body: JSON.stringify({ body: "Private review note" }) });
    assert.equal(note.status, 201);
    const correction = await request(`/api/v1/doctor/reviews/${reviewId}/notes`, { method: "POST", headers, body: JSON.stringify({ body: "Corrected note", parentNoteId: (await note.json()).data.id, correctionReason: "Clarified wording" }) });
    assert.equal(correction.status, 201);
    const approved = await request(`/api/v1/doctor/reviews/${reviewId}/approve`, { method: "POST", headers, body: JSON.stringify({ profile: { conditions: [{ conditionCode: "hypertension", notes: "Confirmed by doctor" }], measurements: [{ measureCode: "weight_kg", value: 70, unit: "kg", measuredBy: "doctor" }] } }) });
    assert.equal(approved.status, 200);
    const afterBody = await (await request(`/api/v1/doctor/reviews/${reviewId}`, { headers })).json();
    assert.equal(afterBody.data.review.status, "approved");
    assert.equal(afterBody.data.profile.conditions.length, 1);
    assert.equal(afterBody.data.profile.conditions[0].basis, "doctor_confirmed");
    assert.equal(afterBody.data.assessment.snapshot.payload_hash, beforeBody.data.assessment.snapshot.payload_hash);
    assert.equal(afterBody.data.assessment.answers[0].stored_value, beforeBody.data.assessment.answers[0].stored_value);
    assert.ok(afterBody.data.events.length >= 7);
    assert.equal(await AssessmentSession.count({ where: { id: sessionId } }), 1);
    assert.equal(await PatientCondition.count({ where: { source_session_id: sessionId, basis: "doctor_confirmed" } }), 1);
  });

  it("requires a reason for rejection and prevents reopening or approving a rejected review", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const doctorToken = await token(doctorUser.email, "ReviewDoctor123!");
    const headers = authHeader(doctorToken);
    assert.equal((await request(`/api/v1/doctor/reviews/${rejectedReviewId}/assign`, { method: "POST", headers, body: "{}" })).status, 200);
    assert.equal((await request(`/api/v1/doctor/reviews/${rejectedReviewId}/open`, { method: "POST", headers })).status, 200);
    assert.equal((await request(`/api/v1/doctor/reviews/${rejectedReviewId}/reject`, { method: "POST", headers, body: JSON.stringify({}) })).status, 422);
    assert.equal((await request(`/api/v1/doctor/reviews/${rejectedReviewId}/reject`, { method: "POST", headers, body: JSON.stringify({ reason: "Insufficient information" }) })).status, 200);
    assert.equal((await request(`/api/v1/doctor/reviews/${rejectedReviewId}/open`, { method: "POST", headers })).status, 409);
    assert.equal((await request(`/api/v1/doctor/reviews/${rejectedReviewId}/approve`, { method: "POST", headers, body: JSON.stringify({ profile: {} }) })).status, 409);
  });

  it("gates future plan activation on an approved review", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    await assert.rejects(
      NutritionPlan.create({ tenant_id: tenantA.id, patient_id: patientUser.patient_id, status: "active" }),
      (error) => error.code === "PLAN_REVIEW_REQUIRED",
    );
    await assert.rejects(
      ExercisePlanVersion.create({ tenant_id: tenantA.id, plan_id: 1, version_no: 1, status: "approved", source_review_id: rejectedReviewId }),
      (error) => error.code === "PLAN_REVIEW_NOT_APPROVED",
    );
  });
});
