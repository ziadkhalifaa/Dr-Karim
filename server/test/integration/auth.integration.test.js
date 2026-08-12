import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { sequelize } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { hashPassword, signAccessToken } from "../../src/utils/auth-crypto.js";
import env from "../../src/config/env.js";

const { Tenant, Doctor, Patient, AuthUser, AuthUserTenant } = models;
let server; let baseUrl; let available = false;
let doctorUser; let patientUser; let tenantA; let tenantB;

async function reachable() { try { await sequelize.authenticate(); return true; } catch { return false; } }

before(async () => {
  available = await reachable();
  if (!available) { console.log("⏭  SKIP auth integration tests: MySQL not reachable"); return; }
  tenantA = await Tenant.findOne({ where: { slug: "dr-kareem" } });
  tenantB = await Tenant.findOrCreate({ where: { slug: "auth-tenant-b" }, defaults: { name: "Auth Tenant B", is_default: false } }).then(([row]) => row);
  const doctor = await Doctor.findOne({ where: { tenant_id: tenantA.id } });
  const patient = await Patient.create({ tenant_id: tenantA.id, full_name: "Auth Test Patient", status: "active" });
  doctorUser = await AuthUser.create({ email: `doctor-${Date.now()}@example.test`, password_hash: await hashPassword("DoctorPassword123!"), user_type: "doctor", doctor_id: doctor.id, status: "enabled" });
  patientUser = await AuthUser.create({ email: `patient-${Date.now()}@example.test`, password_hash: await hashPassword("PatientPassword123!"), user_type: "patient", patient_id: patient.id, status: "enabled" });
  await AuthUserTenant.bulkCreate([
    { user_id: doctorUser.id, tenant_id: tenantA.id, role: "doctor", active: true },
    { user_id: patientUser.id, tenant_id: tenantA.id, role: "patient", active: true },
  ]);
  server = createApp().listen(0); baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => { if (server) await new Promise((resolve) => server.close(resolve)); await sequelize.close(); });

async function request(path, options = {}) { return fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); }
function login(identifier, password, tenantSlug) { return request("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ identifier, password, tenantSlug }) }); }

describe("Phase 3A authentication foundation", () => {
  it("valid doctor and patient login returns role + tenant-scoped tokens", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const doctor = await login(doctorUser.email, "DoctorPassword123!", tenantA.slug); const doctorBody = await doctor.json();
    assert.equal(doctor.status, 200); assert.equal(doctorBody.data.user.role, "doctor"); assert.ok(doctorBody.data.accessToken); assert.ok(doctorBody.data.refreshToken);
    const patient = await login(patientUser.email, "PatientPassword123!", tenantA.slug); const patientBody = await patient.json();
    assert.equal(patient.status, 200); assert.equal(patientBody.data.user.role, "patient");
  });

  it("invalid and disabled credentials are rejected", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    assert.equal((await login(doctorUser.email, "wrong-password")).status, 401);
    await doctorUser.update({ status: "disabled" });
    assert.equal((await login(doctorUser.email, "DoctorPassword123!")).status, 401);
    await doctorUser.update({ status: "enabled" });
  });

  it("refresh rotates and revokes the previous refresh token", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const body = await (await login(doctorUser.email, "DoctorPassword123!")).json();
    const rotated = await request("/api/v1/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: body.data.refreshToken }) });
    const rotatedBody = await rotated.json(); assert.equal(rotated.status, 200); assert.notEqual(rotatedBody.data.refreshToken, body.data.refreshToken);
    assert.equal((await request("/api/v1/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: body.data.refreshToken }) })).status, 401);
  });

  it("logout invalidates the access session and invalid refresh token is rejected", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const body = await (await login(doctorUser.email, "DoctorPassword123!")).json();
    const logout = await request("/api/v1/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${body.data.accessToken}` }, body: JSON.stringify({ refreshToken: body.data.refreshToken }) });
    assert.equal(logout.status, 200);
    assert.equal((await request("/api/v1/auth/me", { headers: { Authorization: `Bearer ${body.data.accessToken}` } })).status, 401);
    assert.equal((await request("/api/v1/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: body.data.refreshToken }) })).status, 401);
  });

  it("expired access tokens and unauthorized tenant membership are rejected", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const body = await (await login(doctorUser.email, "DoctorPassword123!")).json();
    const expired = signAccessToken({ sub: String(doctorUser.id), tid: String(tenantA.id), role: "doctor", familyId: "none", exp: Math.floor(Date.now() / 1000) - 1 }, env.AUTH_TOKEN_SECRET);
    assert.equal((await request("/api/v1/auth/me", { headers: { Authorization: `Bearer ${expired}` } })).status, 401);
    assert.equal((await login(doctorUser.email, "DoctorPassword123!", tenantB.slug)).status, 403);
    assert.equal((await request("/api/v1/auth/me", { headers: { Authorization: `Bearer ${body.data.accessToken}`, "X-Tenant-Slug": tenantB.slug } })).status, 403);
  });
});
