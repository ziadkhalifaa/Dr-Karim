import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { sequelize } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { hashPassword } from "../../src/utils/auth-crypto.js";
import env from "../../src/config/env.js";

const { Tenant, Doctor, Patient, AuthUser, AuthUserTenant } = models;
let server; let baseUrl; let available = false; let tenantA; let tenantB; let doctor; let patient; let otherPatient; let doctorUser; let patientUser; let otherPatientUser;

async function reachable() { try { await sequelize.authenticate(); return true; } catch { return false; } }
before(async () => {
  available = await reachable(); if (!available) return;
  tenantA = await Tenant.findOne({ where: { slug: "dr-kareem" } });
  tenantB = await Tenant.findOrCreate({ where: { slug: `care-tenant-${Date.now()}` }, defaults: { name: "Care Tenant B" } }).then(([row]) => row);
  doctor = await Doctor.findOne({ where: { tenant_id: tenantA.id, active: true } });
  patient = await Patient.create({ tenant_id: tenantA.id, full_name: "Care Cycle Patient", status: "active", followup_cadence_days: 7 });
  otherPatient = await Patient.create({ tenant_id: tenantA.id, full_name: "Other Care Patient", status: "active" });
  doctorUser = await AuthUser.create({ email: `care-doctor-${Date.now()}@example.test`, password_hash: await hashPassword("CareDoctor123!"), user_type: "doctor", doctor_id: doctor.id, status: "enabled" });
  patientUser = await AuthUser.create({ email: `care-patient-${Date.now()}@example.test`, password_hash: await hashPassword("CarePatient123!"), user_type: "patient", patient_id: patient.id, status: "enabled" });
  otherPatientUser = await AuthUser.create({ email: `care-other-${Date.now()}@example.test`, password_hash: await hashPassword("CareOther123!"), user_type: "patient", patient_id: otherPatient.id, status: "enabled" });
  await AuthUserTenant.bulkCreate([
    { user_id: doctorUser.id, tenant_id: tenantA.id, role: "doctor", active: true },
    { user_id: patientUser.id, tenant_id: tenantA.id, role: "patient", active: true },
    { user_id: otherPatientUser.id, tenant_id: tenantA.id, role: "patient", active: true },
  ]);
  server = createApp().listen(0); baseUrl = `http://localhost:${server.address().port}`;
});
after(async () => { if (server) await new Promise((resolve) => server.close(resolve)); await sequelize.close(); });
async function request(path, options = {}) { return fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); }
async function login(email, password, tenantSlug = tenantA.slug) { const response = await request("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ identifier: email, password, tenantSlug }) }); return (await response.json()).data.accessToken; }
function headers(token, tenant = tenantA) { return { Authorization: `Bearer ${token}`, "X-Tenant-Slug": tenant.slug }; }

describe("Phase 3D patient care cycle", { concurrency: false }, () => {
  it("creates immutable check-ins, preserves active-plan context, and enforces ownership", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const patientToken = await login(patientUser.email, "CarePatient123!"); const doctorToken = await login(doctorUser.email, "CareDoctor123!");
    const created = await request(`/api/v1/patients/${patient.id}/checkins`, { method: "POST", headers: headers(patientToken), body: JSON.stringify({ checkinOn: "2026-08-12", weightKg: 74, nutritionAdherence: 80, exerciseAdherence: 60, measurements: [{ measureCode: "waist_cm", value: 88, unit: "cm" }], adherence: [{ dimension: "nutrition", scaleValue: 80, note: "Good" }], patientNote: "Weekly update" }) });
    const createdBody = await created.json(); assert.equal(created.status, 201); assert.equal(Number(createdBody.data.weight_kg), 74); assert.equal(createdBody.data.measurements.length, 1);
    assert.equal((await request(`/api/v1/patients/${patient.id}/checkins`, { headers: headers(patientToken) })).status, 200);
    assert.equal((await request(`/api/v1/patients/${otherPatient.id}/checkins`, { headers: headers(patientToken) })).status, 403);
    assert.equal((await request(`/api/v1/patients/${patient.id}/checkins/${createdBody.data.id}`, { headers: headers(doctorToken) })).status, 200);
    assert.equal((await request(`/api/v1/patients/${patient.id}/checkins`, { headers: headers(patientToken, tenantB) })).status, 403);
  });

  it("creates and transitions appointments with tenant and ownership checks", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const patientToken = await login(patientUser.email, "CarePatient123!"); const doctorToken = await login(doctorUser.email, "CareDoctor123!");
    const created = await request("/api/v1/appointments", { method: "POST", headers: headers(patientToken), body: JSON.stringify({ doctorId: doctor.id, type: "online", scheduledStartAt: "2026-08-20T10:00:00.000Z", durationMin: 30, notes: "Follow-up" }) });
    const body = await created.json(); assert.equal(created.status, 201); assert.equal(body.data.status, "pending");
    const id = body.data.id;
    assert.equal((await request(`/api/v1/appointments/${id}/confirm`, { method: "POST", headers: headers(doctorToken) })).status, 200);
    assert.equal((await request(`/api/v1/appointments/${id}/complete`, { method: "POST", headers: headers(doctorToken) })).status, 200);
    assert.equal((await request(`/api/v1/appointments/${id}/confirm`, { method: "POST", headers: headers(doctorToken) })).status, 409);
    const cancelled = await request("/api/v1/appointments", { method: "POST", headers: headers(patientToken), body: JSON.stringify({ doctorId: doctor.id, type: "clinic", scheduledStartAt: "2026-08-21T10:00:00.000Z" }) }); const cancelledBody = await cancelled.json();
    assert.equal((await request(`/api/v1/appointments/${cancelledBody.data.id}/cancel`, { method: "POST", headers: headers(doctorToken) })).status, 200);
    assert.equal((await request(`/api/v1/appointments/${id}`, { headers: headers(doctorToken, tenantB) })).status, 403);
  });

  it("creates provider-neutral live sessions, authorizes joins, ends sessions, and filters notes", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const patientToken = await login(patientUser.email, "CarePatient123!"); const otherToken = await login(otherPatientUser.email, "CareOther123!"); const doctorToken = await login(doctorUser.email, "CareDoctor123!");
    const created = await request("/api/v1/appointments", { method: "POST", headers: headers(patientToken), body: JSON.stringify({ doctorId: doctor.id, type: "online", scheduledStartAt: "2026-08-22T10:00:00.000Z", durationMin: 30 }) }); const appointment = await created.json();
    await request(`/api/v1/appointments/${appointment.data.id}/confirm`, { method: "POST", headers: headers(doctorToken) });
    const live = await request(`/api/v1/appointments/${appointment.data.id}/live-session`, { method: "POST", headers: headers(doctorToken) }); const liveBody = await live.json(); assert.equal(live.status, 201); const liveId = liveBody.data.id;
    assert.equal((await request(`/api/v1/appointments/${appointment.data.id}/live-session`, { method: "POST", headers: headers(doctorToken) })).status, 409);
    assert.equal((await request(`/api/v1/live-sessions/${liveId}/join`, { method: "POST", headers: headers(otherToken) })).status, 403);
    const doctorJoin = await request(`/api/v1/live-sessions/${liveId}/join`, { method: "POST", headers: headers(doctorToken) }); const doctorJoinBody = await doctorJoin.json(); assert.equal(doctorJoin.status, 200); assert.match(doctorJoinBody.data.token, /^mock-/); assert.match(doctorJoinBody.data.joinUrl, /^https:\/\//); assert.equal(Object.hasOwn(doctorJoinBody.data, "roomRef"), false); assert.equal(Object.hasOwn(doctorJoinBody.data, "DAILY_API_KEY"), false);
    assert.equal((await request(`/api/v1/live-sessions/${liveId}/join`, { method: "POST", headers: headers(patientToken) })).status, 200);
    const privateNote = await request(`/api/v1/live-sessions/${liveId}/notes`, { method: "POST", headers: headers(doctorToken), body: JSON.stringify({ body: "Private clinical note" }) }); assert.equal(privateNote.status, 201);
    const visibleNote = await request(`/api/v1/live-sessions/${liveId}/notes`, { method: "POST", headers: headers(doctorToken), body: JSON.stringify({ body: "Follow-up summary", visibility: "patient_visible" }) }); assert.equal(visibleNote.status, 201);
    const patientNotes = await request(`/api/v1/live-sessions/${liveId}/notes`, { headers: headers(patientToken) }); const patientNotesBody = await patientNotes.json(); assert.equal(patientNotesBody.data.length, 1); assert.equal(patientNotesBody.data[0].visibility, "patient_visible");
    const ended = await request(`/api/v1/live-sessions/${liveId}/end`, { method: "POST", headers: headers(doctorToken) }); const endedBody = await ended.json(); assert.equal(ended.status, 200); assert.equal(endedBody.data.status, "ended"); assert.ok(endedBody.data.nextFollowupSuggestedAt);
  });

  it("records a Daily provider failure without cancelling the appointment", async (t) => {
    if (!available) return t.skip("MySQL unavailable");
    const patientToken = await login(patientUser.email, "CarePatient123!"); const doctorToken = await login(doctorUser.email, "CareDoctor123!");
    const created = await request("/api/v1/appointments", { method: "POST", headers: headers(patientToken), body: JSON.stringify({ doctorId: doctor.id, type: "online", scheduledStartAt: "2026-08-23T10:00:00.000Z", durationMin: 30 }) }); const appointment = await created.json();
    await request(`/api/v1/appointments/${appointment.data.id}/confirm`, { method: "POST", headers: headers(doctorToken) });
    const previousMode = env.DAILY_PROVIDER_MODE; const previousKey = env.DAILY_API_KEY;
    env.DAILY_PROVIDER_MODE = "daily"; env.DAILY_API_KEY = null;
    try {
      const failed = await request(`/api/v1/appointments/${appointment.data.id}/live-session`, { method: "POST", headers: headers(doctorToken) }); const failedBody = await failed.json();
      assert.equal(failed.status, 503); assert.equal(failedBody.error.code, "LIVE_PROVIDER_FAILURE");
      const appointmentState = await (await request(`/api/v1/appointments/${appointment.data.id}`, { headers: headers(doctorToken) })).json(); assert.equal(appointmentState.data.status, "confirmed");
    } finally { env.DAILY_PROVIDER_MODE = previousMode; env.DAILY_API_KEY = previousKey; }
  });
});
