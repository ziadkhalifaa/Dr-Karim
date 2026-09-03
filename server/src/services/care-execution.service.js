// Phase 6B — Daily Care execution recording (docs/daily-care-workflow.md §8, §10, §11, §28).
//
// Executions are IMMUTABLE append-only rows. Recording a value is an INSERT; a
// correction inserts ANOTHER row (kind=correction, correction_of_id) instead of
// mutating the original. The "effective" state of an activity instance is the
// tip of its append-only chain (the latest row not itself corrected).
// Idempotency: a client-supplied idempotencyKey yields the same row on retry.

import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";
import { notificationService } from "./notification.service.js";
import { entitlementService } from "./entitlement.service.js";
import { awardCompletionPoints } from "./care-points.service.js";
import { tenantTimezone, todayInTimeZone } from "../utils/care-time.js";

const {
  Tenant, CareProgram, CareDay, CareActivityInstance, CareActivityExecution, CareDailyCheckin,
} = models;

function actor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  return {
    role: auth.membership.role,
    userId: String(auth.user.id),
    doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null,
    patientId: auth.user.patient_id ? String(auth.user.patient_id) : null,
  };
}

async function loadTenant(tenantId) {
  const tenant = await Tenant.findByPk(tenantId, { raw: true });
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant not found");
  return tenant;
}

// Resolve the tip of each append-only chain for an activity instance.
// Returns the latest execution row that is not itself corrected by another row.
export function tipExecutions(rows) {
  if (!rows || !rows.length) return [];
  const corrected = new Set(rows.map((r) => (r.correction_of_id == null ? null : String(r.correction_of_id))));
  corrected.delete(null);
  const tips = rows.filter((r) => !corrected.has(String(r.id)));
  tips.sort((a, b) => Number(a.id) - Number(b.id));
  return tips;
}

function plannedContext(instance) {
  return {
    measure: instance.measure,
    code: instance.code,
    nameAr: instance.name_ar,
    nameEn: instance.name_en,
    activityType: instance.activity_type,
    target: instance.planned_target_json || null,
  };
}

function validateActual(measure, instance, body) {
  if (measure === "boolean") {
    return { done: Boolean(body.done) };
  }
  if (measure === "sessions") {
    const value = Number(body.sessions);
    if (!Number.isFinite(value) || value < 0) throw new AppError(422, "CARE_EXECUTION_VALIDATION_ERROR", "sessions must be a non-negative number");
    return { value, unit: null };
  }
  if (measure === "quantity") {
    if (body.value == null) return null; // recorded skip
    const value = Number(body.value);
    if (!Number.isFinite(value) || value < 0) throw new AppError(422, "CARE_EXECUTION_VALIDATION_ERROR", "value must be a non-negative number");
    const unit = typeof body.unit === "string" ? body.unit.trim().slice(0, 10) : (instance.planned_target_json?.unit || null);
    return { value, unit };
  }
  if (measure === "duration") {
    if (body.durationMin == null) return null;
    const value = Number(body.durationMin);
    if (!Number.isFinite(value) || value < 0) throw new AppError(422, "CARE_EXECUTION_VALIDATION_ERROR", "durationMin must be a non-negative number");
    return { value, unit: "min" };
  }
  return null;
}

function deriveStatus(measure, actual) {
  if (measure === "boolean") {
    return actual?.done ? "completed" : "skipped";
  }
  if (!actual) return "skipped";
  const target = actual.target;
  const planned = target?.value;
  if (planned == null) return "completed";
  return actual.value >= planned ? "completed" : "partial";
}

async function loadDay(dayId, tenantId) {
  const day = await CareDay.findOne({ where: { id: dayId, tenant_id: tenantId }, raw: true });
  if (!day) throw new AppError(404, "CARE_DAY_NOT_FOUND", "Care day not found");
  return day;
}

async function loadInstance(instanceId, tenantId) {
  const instance = await CareActivityInstance.findOne({ where: { id: instanceId, tenant_id: tenantId }, raw: true });
  if (!instance) throw new AppError(404, "CARE_ACTIVITY_NOT_FOUND", "Care activity not found");
  const day = await CareDay.findByPk(instance.care_day_id, { raw: true });
  const program = await CareProgram.findOne({ where: { id: day.care_program_id, tenant_id: tenantId, deleted_at: null }, raw: true });
  if (!program) throw new AppError(404, "CARE_PROGRAM_NOT_FOUND", "Care program not found");
  return { instance, day, program };
}

function canAct(program, current) {
  if (current.role === "doctor") return;
  const pid = program.patient_id == null ? null : String(program.patient_id);
  if (current.role === "patient" && pid === String(current.patientId)) return;
  throw new AppError(403, "CARE_EXECUTION_FORBIDDEN", "Access denied to this care program");
}

function assertRecordable(program, day, today) {
  if (!["active", "paused"].includes(program.status)) {
    throw new AppError(409, "CARE_PROGRAM_NOT_RECORDABLE", "Recording is only available while the care program is active or paused");
  }
  if (day.date > today) {
    throw new AppError(422, "CARE_EXECUTION_FUTURE", "Records cannot be created for a future day");
  }
}

function normalizeIdempotencyKey(body) {
  const key = typeof body.idempotencyKey === "string" && body.idempotencyKey.trim()
    ? body.idempotencyKey.trim().slice(0, 120) : null;
  return key;
}

export const careExecutionService = {
  // Effective current status of every instance for a care day (tip-aware).
  async daySummary({ tenantId, dayId, auth }) {
    const current = actor(auth);
    const day = await loadDay(dayId, tenantId);
    const program = await CareProgram.findOne({ where: { id: day.care_program_id, tenant_id: tenantId, deleted_at: null }, raw: true });
    if (!program) throw new AppError(404, "CARE_PROGRAM_NOT_FOUND", "Care program not found");
    canAct(program, current);
    const tenant = await loadTenant(tenantId);
    const today = todayInTimeZone(tenantTimezone(tenant));

    const instances = await CareActivityInstance.findAll({
      where: { care_day_id: day.id, tenant_id: tenantId }, order: [["sort_order", "ASC"], ["id", "ASC"]], raw: true,
    });
    const executions = await CareActivityExecution.findAll({
      where: { care_day_id: day.id, tenant_id: tenantId }, order: [["id", "ASC"]], raw: true,
    });
    const byInstance = new Map();
    for (const exec of executions) {
      const list = byInstance.get(String(exec.activity_instance_id)) || [];
      list.push(exec);
      byInstance.set(String(exec.activity_instance_id), list);
    }

    const derived = instances.map((instance) => {
      const tips = tipExecutions(byInstance.get(String(instance.id)) || []);
      const effective = tips.length ? tips[tips.length - 1] : null;
      const status = effective
        ? effective.status
        : (day.date < today ? "not_recorded" : "planned");
      return {
        id: String(instance.id),
        code: instance.code,
        nameAr: instance.name_ar,
        nameEn: instance.name_en,
        activityType: instance.activity_type,
        measure: instance.measure,
        sortOrder: instance.sort_order,
        status,
        effectiveExecution: effective
          ? { id: String(effective.id), kind: effective.kind, status: effective.status, actualValue: effective.actual_value_json, recordedAt: effective.recorded_at, source: effective.source, reason: effective.reason }
          : null,
      };
    });
    const summary = { planned: 0, completed: 0, partial: 0, skipped: 0, not_recorded: 0, total: derived.length };
    for (const item of derived) summary[item.status] += 1;
    return { day: { id: String(day.id), date: day.date, dayIndex: day.day_index }, program: { id: String(program.id), status: program.status, startDate: program.start_date, endDate: program.end_date }, instances: derived, summary };
  },

  async record({ tenantId, auth, instanceId, body, ip }) {
    const current = actor(auth);
    const tenant = await loadTenant(tenantId);
    const today = todayInTimeZone(tenantTimezone(tenant));
    const created = await sequelize.transaction(async (transaction) => {
      const { instance, day, program } = await loadInstance(instanceId, tenantId);
      canAct(program, current);
      if (current.role === "patient") await entitlementService.requireActivePeriod({ tenantId, patientId: program.patient_id, transaction });
      assertRecordable(program, day, today);
      const byType = current.role === "patient" ? "patient" : "doctor";
      const key = normalizeIdempotencyKey(body);

      if (key) {
        const existing = await CareActivityExecution.findOne({
          where: { activity_instance_id: instance.id, tenant_id: tenantId, idempotency_key: key }, transaction, raw: true,
        });
        if (existing) return { ...existing, idempotent: true };
      }

      const actual = validateActual(instance.measure, instance, body);
      const actualWithTarget = actual ? { ...actual, target: instance.planned_target_json || null } : actual;
      const status = deriveStatus(instance.measure, actualWithTarget);
      const row = await CareActivityExecution.create({
        tenant_id: tenantId,
        patient_id: program.patient_id,
        care_day_id: day.id,
        activity_instance_id: instance.id,
        kind: "initial",
        correction_of_id: null,
        reason: body.reason ? String(body.reason).trim().slice(0, 400) : null,
        planned_snapshot_json: plannedContext(instance),
        actual_value_json: actualWithTarget,
        status,
        recorded_at: new Date(),
        recorded_by_type: byType,
        recorded_by: current.userId,
        source: byType === "patient" ? "patient" : "doctor",
        idempotency_key: key,
        metadata_json: body.metadata || null,
      }, { transaction });
      if (status === "completed") {
        await awardCompletionPoints({
          tenantId, programId: program.id, patientId: program.patient_id,
          activityType: instance.activity_type, careDayId: day.id,
          activityInstanceId: instance.id, transaction,
        });
      }
      await auditService.record({ tenantId, action: "care_execution.created", entity: "care_activity_execution", entityRef: String(row.id), metadata: { dayId: String(day.id), instanceId: String(instance.id), status, kind: "initial" }, actorType: current.role, actorId: current.userId, ip, transaction });
      await notificationService.emitForPatient({ tenantId, patientId: program.patient_id, type: "care_progress_recorded", relatedEntity: "care_activity_execution", relatedRef: String(row.id), transaction });
      return row.toJSON();
    });
    const summary = await this.daySummary({ tenantId, dayId: created.care_day_id, auth });
    return { execution: created, ...summary };
  },

  async correct({ tenantId, auth, executionId, body, ip }) {
    const current = actor(auth);
    const tenant = await loadTenant(tenantId);
    const today = todayInTimeZone(tenantTimezone(tenant));
    const created = await sequelize.transaction(async (transaction) => {
      const original = await CareActivityExecution.findOne({ where: { id: executionId, tenant_id: tenantId }, transaction, raw: true });
      if (!original) throw new AppError(404, "CARE_EXECUTION_NOT_FOUND", "Execution not found");
      const { instance, day, program } = await loadInstance(original.activity_instance_id, tenantId);
      canAct(program, current);
      if (current.role === "patient" && String(original.patient_id) !== String(current.patientId)) {
        throw new AppError(403, "CARE_EXECUTION_FORBIDDEN", "Patients may only correct their own records");
      }
      assertRecordable(program, day, today);
      const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 400) : null;
      if (!reason) throw new AppError(422, "CARE_EXECUTION_REASON_REQUIRED", "A correction reason is required");

      const actual = validateActual(instance.measure, instance, body);
      const actualWithTarget = actual ? { ...actual, target: instance.planned_target_json || null } : actual;
      const status = deriveStatus(instance.measure, actualWithTarget);
      const row = await CareActivityExecution.create({
        tenant_id: tenantId,
        patient_id: original.patient_id,
        care_day_id: day.id,
        activity_instance_id: instance.id,
        kind: "correction",
        correction_of_id: original.id,
        reason,
        planned_snapshot_json: plannedContext(instance),
        actual_value_json: actualWithTarget,
        status,
        recorded_at: new Date(),
        recorded_by_type: current.role === "patient" ? "patient" : "doctor",
        recorded_by: current.userId,
        source: current.role === "patient" ? "patient" : "doctor",
        metadata_json: body.metadata || null,
      }, { transaction });
      await auditService.record({ tenantId, action: "care_execution.corrected", entity: "care_activity_execution", entityRef: String(row.id), metadata: { correctionOf: String(original.id), dayId: String(day.id), status }, actorType: current.role, actorId: current.userId, ip, transaction });
      return row.toJSON();
    });
    const summary = await this.daySummary({ tenantId, dayId: created.care_day_id, auth });
    return { execution: created, ...summary };
  },

  async checkin({ tenantId, auth, dayId, body, ip }) {
    const current = actor(auth);
    if (current.role !== "patient") throw new AppError(403, "CARE_CHECKIN_FORBIDDEN", "Only the patient completes a daily check-in");
    const tenant = await loadTenant(tenantId);
    const today = todayInTimeZone(tenantTimezone(tenant));
    const created = await sequelize.transaction(async (transaction) => {
      const day = await loadDay(dayId, tenantId);
      const program = await CareProgram.findOne({ where: { id: day.care_program_id, tenant_id: tenantId, deleted_at: null }, transaction, raw: true });
      if (!program) throw new AppError(404, "CARE_PROGRAM_NOT_FOUND", "Care program not found");
      canAct(program, current);
      assertRecordable(program, day, today);
      if (day.date > today) throw new AppError(422, "CARE_CHECKIN_FUTURE", "A check-in cannot be created for a future day");

      const fields = {
        energy: body.energy == null ? null : Number(body.energy),
        hunger: body.hunger == null ? null : Number(body.hunger),
        adherenceSelfReport: body.adherenceSelfReport == null ? null : Number(body.adherenceSelfReport),
        weightKg: body.weightKg == null ? null : Number(body.weightKg),
        notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null,
      };
      for (const key of ["energy", "hunger"]) {
        if (fields[key] !== null && (!Number.isFinite(fields[key]) || fields[key] < 0 || fields[key] > 10)) {
          throw new AppError(422, "CARE_CHECKIN_VALIDATION_ERROR", `${key} must be 0..10`);
        }
      }
      if (fields.adherenceSelfReport !== null && (!Number.isFinite(fields.adherenceSelfReport) || fields.adherenceSelfReport < 0 || fields.adherenceSelfReport > 100)) {
        throw new AppError(422, "CARE_CHECKIN_VALIDATION_ERROR", "adherenceSelfReport must be 0..100");
      }
      if (fields.weightKg !== null && (!Number.isFinite(fields.weightKg) || fields.weightKg <= 0 || fields.weightKg > 500)) {
        throw new AppError(422, "CARE_CHECKIN_VALIDATION_ERROR", "weightKg is invalid");
      }

      let checkin = await CareDailyCheckin.findOne({ where: { care_day_id: day.id, tenant_id: tenantId }, transaction, lock: transaction.LOCK.UPDATE, raw: true });
      if (checkin) {
        await CareDailyCheckin.update({ ...fields, submitted_at: new Date() }, { where: { id: checkin.id, tenant_id: tenantId }, transaction });
        checkin = await CareDailyCheckin.findByPk(checkin.id, { transaction, raw: true });
        await auditService.record({ tenantId, action: "care_checkin.updated", entity: "care_daily_checkin", entityRef: String(checkin.id), metadata: { dayId: String(day.id) }, actorType: "patient", actorId: current.userId, ip, transaction });
      } else {
        checkin = await CareDailyCheckin.create({
          tenant_id: tenantId,
          care_program_id: program.id,
          care_day_id: day.id,
          patient_id: program.patient_id,
          checkin_on: day.date,
          ...fields,
          submitted_at: new Date(),
        }, { transaction });
        await auditService.record({ tenantId, action: "care_checkin.created", entity: "care_daily_checkin", entityRef: String(checkin.id), metadata: { dayId: String(day.id) }, actorType: "patient", actorId: current.userId, ip, transaction });
        await awardCompletionPoints({
          tenantId, programId: program.id, patientId: program.patient_id,
          activityType: "checkin", careDayId: day.id, activityInstanceId: null, transaction,
        });
      }
      return checkin.toJSON();
    });
    return created;
  },

  // Doctor finalizes a daily check-in value on the patient's behalf (read-mostly; kept for parity).
  async checkinsForDay({ tenantId, dayId, auth }) {
    const current = actor(auth);
    if (!["doctor", "staff"].includes(current.role)) throw new AppError(403, "CARE_READ_FORBIDDEN", "Only doctor or staff may read other patients' check-ins");
    const day = await loadDay(dayId, tenantId);
    const rows = await CareDailyCheckin.findAll({ where: { care_day_id: day.id, tenant_id: tenantId }, raw: true });
    return rows;
  },
};

export default careExecutionService;