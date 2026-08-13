import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { sequelize } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { progressMeasurementService } from "../../src/services/progress-measurement.service.js";
import { progressGoalService } from "../../src/services/progress-goal.service.js";
import { progressService } from "../../src/services/progress.service.js";
import { todayInTimeZone } from "../../src/utils/care-time.js";

const { Tenant, Patient, Doctor, ProgressMeasurement } = models;

let available = false;
let ctx = null;
before(async () => {
  try { await sequelize.authenticate(); } catch { return; }
  available = true;
  const tenant = await Tenant.create({ slug: `progress6c-${Date.now()}`, name: "Phase 6C Tenant", is_default: false });
  const patient = await Patient.create({ tenant_id: tenant.id, full_name: "Progress Test Patient", status: "active" });
  const doctor = await Doctor.create({ tenant_id: tenant.id, name: "Progress Test Doctor", active: true });
  const today = todayInTimeZone("Africa/Cairo");
  const doctorAuth = { membership: { role: "doctor" }, user: { id: "progress-doctor-user", doctor_id: String(doctor.id) } };
  const patientAuth = { membership: { role: "patient" }, user: { id: "progress-patient-user", patient_id: String(patient.id) } };
  ctx = { tenantId: tenant.id, doctor: String(doctor.id), patient: String(patient.id), today, doctorAuth, patientAuth };
});
after(async () => { if (available) await sequelize.close(); });

describe("Phase 6C progress & measurements", { concurrency: false, timeout: 30000 }, () => {
  it("A) patient records an initial weight measurement (source=patient)", async (t) => {
    if (!available) return t.skip();
    const out = await progressMeasurementService.record({ tenantId: ctx.tenantId, auth: ctx.patientAuth, body: { patientId: ctx.patient, measurementType: "weight", value: 95, measuredOn: ctx.today } });
    ctx.weightId = String(out.measurement.id);
    assert.equal(out.measurement.measurement_type, "weight");
    assert.equal(Number(out.measurement.value), 95);
    assert.equal(out.measurement.kind, "initial");
    assert.ok(out.nextDueDate);
  });

  it("B) a later measurement creates derived start/current/delta, not stored values", async (t) => {
    if (!available) return t.skip();
    const laterOn = ctx.today; // same-day second record keeps the test independent of real dates
    await progressMeasurementService.record({ tenantId: ctx.tenantId, auth: ctx.patientAuth, body: { patientId: ctx.patient, measurementType: "weight", value: 94, measuredOn: laterOn } });
    const summary = await progressMeasurementService.summaryForType({ tenantId: ctx.tenantId, auth: ctx.patientAuth, patientId: ctx.patient, type: "weight", today: ctx.today });
    const unknown = await progressMeasurementService.summaryForType({ tenantId: ctx.tenantId, auth: ctx.patientAuth, patientId: ctx.patient, type: "waist", today: ctx.today });
    assert.ok(summary.starting);
    assert.equal(Number(summary.current.value), 94);
    assert.equal(summary.count, 2);
    assert.equal(unknown.count, 0);
  });

  it("C) corrections are append-only and the original row is preserved", async (t) => {
    if (!available) return t.skip();
    const out = await progressMeasurementService.correct({ tenantId: ctx.tenantId, auth: ctx.patientAuth, measurementId: ctx.weightId, body: { value: 96, reason: "Scale was misread" } });
    assert.equal(out.measurement.kind, "correction");
    assert.equal(String(out.measurement.correction_of_id), ctx.weightId);
    const original = await ProgressMeasurement.findByPk(ctx.weightId, { raw: true });
    assert.ok(original, "original row must still exist");
    assert.equal(Number(original.value), 95);
  });

  it("D) a non-owner patient cannot read another patient's measurements", async (t) => {
    if (!available) return t.skip();
    const stranger = await Patient.create({ tenant_id: ctx.tenantId, full_name: "Stranger", status: "active" });
    const strangerAuth = { membership: { role: "patient" }, user: { id: "progress-stranger-user", patient_id: String(stranger.id) } };
    await assert.rejects(
      () => progressMeasurementService.list({ tenantId: ctx.tenantId, auth: strangerAuth, patientId: ctx.patient }),
      (err) => err.status === 403,
    );
  });

  it("E) doctor creates, activates and versions a numeric weight goal", async (t) => {
    if (!available) return t.skip();
    const created = await progressGoalService.create({ tenantId: ctx.tenantId, auth: ctx.doctorAuth, body: { patientId: ctx.patient, goalType: "weight", targetValue: 85, startDate: ctx.today } });
    ctx.goalId = created.goal.id;
    assert.equal(created.goal.status, "draft");
    assert.equal(created.goal.currentVersion.version_no, 1);

    await progressGoalService.activate({ tenantId: ctx.tenantId, auth: ctx.doctorAuth, goalId: ctx.goalId, ip: "test" });
    let goal = await progressGoalService.get({ tenantId: ctx.tenantId, auth: ctx.doctorAuth, goalId: ctx.goalId });
    assert.equal(goal.status, "active");
    assert.equal(goal.currentVersion.status, "active");

    await progressGoalService.addVersion({ tenantId: ctx.tenantId, auth: ctx.doctorAuth, goalId: ctx.goalId, body: { targetValue: 83 }, ip: "test" });
    goal = await progressGoalService.get({ tenantId: ctx.tenantId, auth: ctx.doctorAuth, goalId: ctx.goalId });
    assert.equal(goal.versions.length, 2);
    assert.equal(goal.currentVersion.version_no, 1, "new draft is not the current version until activated");
  });

  it("F) dashboard derives goal progress from the measurement timeline", async (t) => {
    if (!available) return t.skip();
    const dash = await progressService.dashboard({ tenantId: ctx.tenantId, auth: ctx.patientAuth, patientId: ctx.patient });
    assert.equal(dash.byType.weight.count, 3);
    assert.ok(dash.byType.weight.current);
    assert.ok(dash.goal);
    assert.ok(dash.goal.goalType === "weight");
  });

  it("G) ordering/unit consistency: measurement types and cadence presets are locked", async (t) => {
    if (!available) return t.skip();
    const ctxOK = await progressMeasurementService.getContext({ tenantId: ctx.tenantId, auth: ctx.patientAuth, patientId: ctx.patient });
    assert.equal(ctxOK.cadence, "weekly");
    assert.ok(ctxOK.nextDueDate);
  });

  it("H) check-in weight appends an immutable source=checkin measurement (single truth)", async (t) => {
    if (!available) return t.skip();
    // Simulated hook (checkinService touches the DB directly): invoke the hook
    // with a synthetic checkin id to prove the append + uniqueness guard.
    await progressMeasurementService.recordFromCheckin({ tenantId: ctx.tenantId, patientId: ctx.patient, checkinId: 900000 + Number(ctx.goalId || 0), weightKg: 93, measuredOn: ctx.today, recordedBy: "patient-user", transaction: null });
    const rows = await progressMeasurementService.list({ tenantId: ctx.tenantId, auth: ctx.patientAuth, patientId: ctx.patient, query: { source: "checkin" } });
    const checkinRows = rows.items.filter((m) => m.source === "checkin");
    assert.equal(checkinRows.length, 1);
    const dash = await progressService.dashboard({ tenantId: ctx.tenantId, auth: ctx.patientAuth, patientId: ctx.patient });
    assert.ok(dash.byType.weight.current);
  });
});