import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { sequelize } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { hashPassword } from "../../src/utils/auth-crypto.js";

const { Tenant, Doctor, AuthUser, AuthUserTenant, Package, PlatformSetting } = models;
let server; let baseUrl; let available = false;
let tenantA; let doctorUser; let doctorToken;
let patientToken; let patientId; let packageId;

async function reachable() { try { await sequelize.authenticate(); return true; } catch { return false; } }

async function request(path, options = {}) { return fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); }
function authed(token) { return { Authorization: `Bearer ${token}`, "X-Tenant-Slug": tenantA.slug }; }

before(async () => {
  available = await reachable();
  if (!available) { console.log("⏭  SKIP Phase 6D integration tests: MySQL not reachable"); return; }

  tenantA = await Tenant.findOne({ where: { slug: "dr-kareem" } });
  const doctor = await Doctor.findOne({ where: { tenant_id: tenantA.id } });
  doctorUser = await AuthUser.findOne({ where: { doctor_id: doctor.id } }) || await AuthUser.create({ phone_canonical: `+2010${Date.now().toString().slice(-9)}`, password_hash: await hashPassword("DoctorPassword123!"), user_type: "doctor", doctor_id: doctor.id, status: "enabled" });
  await AuthUserTenant.findOrCreate({ where: { user_id: doctorUser.id, tenant_id: tenantA.id }, defaults: { role: "doctor", active: true } });

  const pack = await Package.findOne({ where: { tenant_id: tenantA.id, slug: "monthly-care" } }) || await Package.findOne({ where: { tenant_id: tenantA.id } });
  packageId = String(pack.id);
  await pack.update({ price: 500 });

  await PlatformSetting.findOrCreate({ where: { tenant_id: tenantA.id, key: "payment.vodafone_cash.enabled" }, defaults: { value: "true", value_type: "boolean", description: "Vodafone Cash enabled" } });
  await PlatformSetting.findOrCreate({ where: { tenant_id: tenantA.id, key: "payment.vodafone_cash.destination" }, defaults: { value: "01000000000", value_type: "string", description: "Vodafone Cash destination number" } });

  server = createApp().listen(0); baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => { if (server) await new Promise((resolve) => server.close(resolve)); await sequelize.close(); });

async function doctorLogin() {
  const res = await request("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ identifier: doctorUser.phone_canonical, password: "DoctorPassword123!", tenantSlug: tenantA.slug }) });
  doctorToken = (await res.json()).data.accessToken;
}

function register(body) { return request("/api/v1/auth/register", { method: "POST", body: JSON.stringify(body) }); }

describe("Phase 6D patient onboarding (register → payment → activation)", () => {
  it("registers a patient account from an assessment and returns patient session tokens", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const phone = `0101${Date.now().toString().slice(-8)}`;
    const res = await register({ fullName: "6D Onboarding Patient", phone, password: "PatientPassword123!", email: `patient-${Date.now()}@example.test`, tenantSlug: tenantA.slug });
    const body = await res.json();
    assert.equal(res.status, 201); assert.equal(body.data.user.role, "patient"); assert.ok(body.data.accessToken); assert.ok(body.data.refreshToken);
    patientToken = body.data.accessToken;
    const me = await (await request("/api/v1/auth/me", { headers: authed(patientToken) })).json();
    patientId = me.data.patientId; assert.ok(patientId);
  });

  it("rejects duplicate phone accounts and invalid phone numbers", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const me = await (await request("/api/v1/auth/me", { headers: authed(patientToken) })).json();
    const user = await AuthUser.findByPk(me.data.id);
    assert.ok(user);
    const dup = await register({ fullName: "Dupe", phone: user.phone_canonical, password: "PatientPassword123!" });
    assert.equal(dup.status, 409);
    const invalid = await register({ fullName: "Bad Phone", phone: "12345", password: "PatientPassword123!" });
    assert.equal(invalid.status, 422);
  });

  it("rejects an unknown assessment reference on register", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const res = await register({ fullName: "No Session", phone: `0102${Date.now().toString().slice(-8)}`, password: "PatientPassword123!", assessmentReference: "DK-2099-999999" });
    assert.equal(res.status, 422);
  });

  it("lists the pending patient for the doctor with directory filters", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    await doctorLogin();
    const res = await request("/api/v1/patients?status=pending_payment", { headers: authed(doctorToken) });
    const body = await res.json();
    assert.equal(res.status, 200); assert.ok(body.data.pagination.total >= 1);
    const found = body.data.items.find((item) => item.id === patientId);
    assert.ok(found); assert.equal(found.status, "pending_payment"); assert.equal(found.subscriptionStatus, null);
  });

  it("forbids patients from listing the directory and viewing other patients", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    assert.equal((await request("/api/v1/patients", { headers: authed(patientToken) })).status, 403);
    const me = await (await request("/api/v1/patients/me/home", { headers: authed(patientToken) })).json();
    const stranger = me.data.patient.id === patientId ? 999999999 : patientId;
    assert.equal((await request(`/api/v1/patients/${stranger}`, { headers: authed(patientToken) })).status, 403);
  });

  it("exposes approved plan versions to the doctor and forbids other patients", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const res = await request(`/api/v1/patients/${patientId}/plan-versions`, { headers: authed(doctorToken) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.patientId, patientId);
    assert.ok(Array.isArray(body.data.nutrition) && Array.isArray(body.data.exercise));
    const stranger = String(Number(patientId) + 1);
    assert.equal((await request(`/api/v1/patients/${stranger}/plan-versions`, { headers: authed(patientToken) })).status, 403);
  });

  it("patient home reflects choose_package then awaiting_payment_review after submitting a payment", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const homeBefore = await (await request("/api/v1/patients/me/home", { headers: authed(patientToken) })).json();
    assert.equal(homeBefore.data.onboarding.state, "choose_package");
    const pay = await request("/api/v1/payments", { method: "POST", headers: authed(patientToken), body: JSON.stringify({ packageId, method: "vodafone_cash", senderPhone: "01011111111" }) });
    assert.equal(pay.status, 201);
    const homeAfter = await (await request("/api/v1/patients/me/home", { headers: authed(patientToken) })).json();
    assert.equal(homeAfter.data.onboarding.state, "awaiting_payment_review");
    assert.equal(homeAfter.data.pendingPayments.length, 1);
  });

  it("approving the payment activates the subscription and flips the patient to active", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const doctorPayments = await (await request("/api/v1/payments/doctor/payments?status=pending", { headers: authed(doctorToken) })).json();
    const pending = doctorPayments.data.find((row) => row.patient_id === patientId);
    assert.ok(pending);
    const approve = await request(`/api/v1/payments/doctor/payments/${pending.id}/approve`, { method: "POST", headers: authed(doctorToken), body: JSON.stringify({}) });
    assert.equal(approve.status, 200);
    const detail = await (await request(`/api/v1/patients/${patientId}`, { headers: authed(doctorToken) })).json();
    assert.equal(detail.data.patient.status, "active");
    assert.equal(detail.data.subscription.subscription.status, "active");
    assert.ok(detail.data.subscription.subscription.entitlements.length > 0);
    const home = await (await request("/api/v1/patients/me/home", { headers: authed(patientToken) })).json();
    assert.equal(home.data.onboarding.state, "active");
    assert.equal(home.data.onboarding.hasActiveSubscription, true);
  });
});
