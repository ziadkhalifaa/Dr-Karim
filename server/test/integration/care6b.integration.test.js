import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { sequelize } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { careProgramService } from "../../src/services/care-program.service.js";
import { careExecutionService } from "../../src/services/care-execution.service.js";
import { careService } from "../../src/services/care.service.js";
import { todayInTimeZone, addDays } from "../../src/utils/care-time.js";

const { Tenant, Patient, Doctor, CareActivityExecution, CareDay } = models;

let available = false;
let ctx = null;
before(async () => {
  try { await sequelize.authenticate(); } catch { return; }
  available = true;
  const tenant = await Tenant.create({ slug: `care6b-${Date.now()}`, name: "Phase 6B Tenant", is_default: false });
  const patient = await Patient.create({ tenant_id: tenant.id, full_name: "Care Test Patient", status: "active" });
  const doctor = await Doctor.create({ tenant_id: tenant.id, name: "Care Test Doctor", active: true });
  const tenantId = tenant.id;
  const today = todayInTimeZone("Africa/Cairo");
  const doctorAuth = { membership: { role: "doctor" }, user: { id: "care-doctor-user", doctor_id: String(doctor.id) } };
  const patientAuth = { membership: { role: "patient" }, user: { id: "care-patient-user", patient_id: String(patient.id) } };
  ctx = { tenantId, doctor: String(doctor.id), patient: String(patient.id), today, doctorAuth, patientAuth };
});
after(async () => { if (available) await sequelize.close(); });

describe("Phase 6B daily care program", { concurrency: false, timeout: 30000 }, () => {
  it("A) doctor creates a program bound to the patient", async (t) => {
    if (!available) return t.skip();
    const created = await careProgramService.create({ tenantId: ctx.tenantId, auth: ctx.doctorAuth, body: {
      patientId: ctx.patient, startDate: ctx.today, endDate: addDays(ctx.today, 6), status: "draft",
    } });
    ctx.programId = String(created.program.id);
    ctx.programVersion = created.versions[0];
    assert.equal(created.program.status, "draft");
    assert.equal(created.versions.length, 1);
  });

  it("B) doctor adds definitions to the latest draft version", async (t) => {
    if (!available) return t.skip();
    const out = await careProgramService.addDefinitions({ tenantId: ctx.tenantId, programId: ctx.programId, auth: ctx.doctorAuth, body: [
      { activityType: "nutrition", measure: "boolean", code: "water", nameAr: "شرب الماء", nameEn: "Drink water", plannedTarget: {} },
      { activityType: "exercise", measure: "sessions", code: "walk", nameAr: "مشي", nameEn: "Walk", plannedTarget: { value: 2 } },
    ] });
    assert.equal(out.definitions.length, 2);
  });

  it("C) activation materializes care days up to today", async (t) => {
    if (!available) return t.skip();
    const out = await careProgramService.activate({ tenantId: ctx.tenantId, programId: ctx.programId, auth: ctx.doctorAuth });
    assert.equal(out.program.status, "active");
    const days = await CareDay.findAll({ where: { care_program_id: ctx.programId, tenant_id: ctx.tenantId }, raw: true });
    assert.equal(days.filter((d) => d.date === ctx.today).length, 1);
  });

  it("D) patient dashboard is available with today's activities", async (t) => {
    if (!available) return t.skip();
    const dash = await careService.dashboard({ tenantId: ctx.tenantId, auth: ctx.patientAuth });
    assert.equal(dash.available, true);
    assert.equal(dash.todayInstances.length, 2);
    assert.equal(dash.adherence.available, false);
  });

  it("E) patient records an execution (idempotent retry returns the same row)", async (t) => {
    if (!available) return t.skip();
    const dash = await careService.dashboard({ tenantId: ctx.tenantId, auth: ctx.patientAuth });
    const instanceId = dash.todayInstances.find((i) => i.measure === "boolean").id;
    const first = await careExecutionService.record({ tenantId: ctx.tenantId, instanceId, auth: ctx.patientAuth, body: { done: true, idempotencyKey: "care-idempotent-key" } });
    const second = await careExecutionService.record({ tenantId: ctx.tenantId, instanceId, auth: ctx.patientAuth, body: { done: true, idempotencyKey: "care-idempotent-key" } });
    assert.ok(first.execution.idempotent === undefined || first.execution.idempotent === false);
    assert.equal(second.execution.idempotent, true);
    assert.equal(String(second.execution.id), String(first.execution.id));
    const count = await CareActivityExecution.count({ where: { tenant_id: ctx.tenantId, activity_instance_id: instanceId } });
    assert.equal(count, 1);
  });

  it("F) a correction appends a new row and supersedes the original status", async (t) => {
    if (!available) return t.skip();
    const dash = await careService.dashboard({ tenantId: ctx.tenantId, auth: ctx.patientAuth });
    const instance = dash.todayInstances.find((i) => i.measure === "boolean");
    assert.equal(instance.status, "completed");
    await careExecutionService.correct({ tenantId: ctx.tenantId, executionId: instance.effectiveExecution.id, auth: ctx.patientAuth, body: { done: false, reason: "Actually skipped it" } });
    const after = await careService.dashboard({ tenantId: ctx.tenantId, auth: ctx.patientAuth });
    const updated = after.todayInstances.find((i) => i.measure === "boolean");
    assert.equal(updated.status, "skipped");
    const count = await CareActivityExecution.count({ where: { tenant_id: ctx.tenantId, activity_instance_id: instance.id } });
    assert.equal(count, 2); // original + correction, both immutable
  });

  it("G) period summary derives adherence from recorded executions only", async (t) => {
    if (!available) return t.skip();
    const dash = await careService.dashboard({ tenantId: ctx.tenantId, auth: ctx.patientAuth });
    const walk = dash.todayInstances.find((i) => i.measure === "sessions");
    await careExecutionService.record({ tenantId: ctx.tenantId, instanceId: walk.id, auth: ctx.patientAuth, body: { sessions: 1 } });
    const summary = await careService.programSummary({ tenantId: ctx.tenantId, programId: ctx.programId, auth: ctx.patientAuth });
    assert.equal(summary.available, true);
    assert.ok(summary.summary.skipped >= 1);
    assert.ok(summary.summary.partial >= 1);
  });

  it("H) future program versions cannot rewrite history", async (t) => {
    if (!available) return t.skip();
    await assert.rejects(
      careProgramService.createVersion({ tenantId: ctx.tenantId, programId: ctx.programId, auth: ctx.doctorAuth, body: { effectiveFrom: ctx.today } }),
      /past/u
    );
  });

  it("I) a non-owner patient cannot read another patient's program", async (t) => {
    if (!available) return t.skip();
    const stranger = await Patient.create({ tenant_id: ctx.tenantId, full_name: "Stranger", status: "active" });
    const strangerAuth = { membership: { role: "patient" }, user: { id: "care-stranger", patient_id: String(stranger.id) } };
    await assert.rejects(careProgramService.get({ tenantId: ctx.tenantId, programId: ctx.programId, auth: strangerAuth }), /own care program/u);
  });
});