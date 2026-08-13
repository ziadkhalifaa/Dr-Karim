// Phase 6C — Progress & Measurements: measurement timeline service
// (docs/progress-measurements.md §5, §12, §23, §25, §26, §30).
//
// progress_measurement rows are IMMUTABLE and append-only. record() INSERTS a
// new row; correct() inserts ANOTHER row (kind=correction, correction_of_id)
// that supersedes the original — the original row is preserved. Current and
// starting values are ALWAYS derived (progress-analytics.js), never stored.

import { Op } from "sequelize";
import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";
import { notificationService } from "./notification.service.js";
import { tenantTimezone, todayInTimeZone } from "../utils/care-time.js";
import { ENUM, PROGRESS_BOUNDS } from "../config/constants.js";
import {
  resolveEffective, measurementsOfType, startingValue, currentValue,
  measurementDelta, nextDueDate, isMeasurementDue, windowAverageSeries, diffDays,
} from "./progress-analytics.js";

const {
  Tenant, Patient, ProgressMeasurement, PatientProgress,
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

function parseType(type) {
  if (!ENUM.PROGRESS_MEASUREMENT_TYPE.includes(type)) {
    throw new AppError(422, "PROGRESS_MEASUREMENT_TYPE_INVALID", `measurement_type must be one of ${ENUM.PROGRESS_MEASUREMENT_TYPE.join(", ")}`);
  }
  return type;
}

function parseSource(source, fallback) {
  return ENUM.PROGRESS_SOURCE.includes(source) ? source : fallback;
}

function validateValue(type, value) {
  const num = Number(value);
  const [min, max] = PROGRESS_BOUNDS[type] || PROGRESS_BOUNDS.weight;
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new AppError(422, "PROGRESS_MEASUREMENT_VALUE_INVALID", `${type} must be within ${min}..${max} (${ENUM.PROGRESS_UNIT_BY_TYPE[type]})`);
  }
  return Math.round(num * 100) / 100;
}

function normalizeMeasuredOn(measuredOn, today) {
  if (!measuredOn) return today;
  const str = String(measuredOn).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) throw new AppError(422, "PROGRESS_MEASUREMENT_DATE_INVALID", "measuredOn must be a YYYY-MM-DD date");
  if (str > today) throw new AppError(422, "PROGRESS_MEASUREMENT_FUTURE", "Measurement cannot be for a future date");
  return str;
}

async function resolvePatientScope({ tenantId, auth, requestedPatientId }) {
  const current = actor(auth);
  if (current.role === "doctor") {
    const pid = requestedPatientId;
    if (!pid) throw new AppError(422, "PROGRESS_PATIENT_REQUIRED", "patientId is required");
    const patient = await Patient.findOne({ where: { id: pid, tenant_id: tenantId, deleted_at: null }, raw: true });
    if (!patient) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
    return { patientId: String(patient.id), byType: "doctor", byId: current.userId };
  }
  if (current.role === "patient") {
    if (requestedPatientId && String(requestedPatientId) !== String(current.patientId)) {
      throw new AppError(403, "PROGRESS_FORBIDDEN", "Patients may only access their own measurements");
    }
    if (!current.patientId) throw new AppError(403, "PROGRESS_FORBIDDEN", "No patient profile bound to this account");
    return { patientId: String(current.patientId), byType: "patient", byId: current.userId };
  }
  throw new AppError(403, "PROGRESS_FORBIDDEN", "Only a patient or doctor may record measurements");
}

function actorSource(current, body) {
  const requested = typeof body.source === "string" ? body.source : null;
  if (current.role === "doctor") return parseSource(requested, "doctor");
  // Patients may only mark a measurement as a self-entry or from a check-in.
  const allowed = new Set(["patient", "checkin", "assessment", "system"]);
  return allowed.has(requested) ? requested : "patient";
}

async function ensureProgressContext({ tenantId, patientId, transaction }) {
  let ctx = await PatientProgress.findOne({ where: { tenant_id: tenantId, patient_id: patientId }, transaction, raw: true });
  if (!ctx) {
    ctx = await PatientProgress.create({
      tenant_id: tenantId, patient_id: patientId, cadence: "weekly", cadence_days: null, next_due_date: null,
    }, { transaction });
  }
  return ctx;
}

async function recomputeNextDue(patientId, tenantId, transaction) {
  const rows = await ProgressMeasurement.findAll({ where: { tenant_id: tenantId, patient_id: patientId }, raw: true, transaction });
  const effective = resolveEffective(rows);
  const lastByType = new Map();
  for (const m of effective) {
    const prev = lastByType.get(m.measurement_type);
    if (!prev || m.measured_on > prev.measured_on) lastByType.set(m.measurement_type, m.measured_on);
  }
  const ctx = await ensureProgressContext({ tenantId, patientId, transaction });
  const latest = lastByType.get("weight") || lastByType.get("waist") || lastByType.get("neck") || lastByType.get("hip") || null;
  const next = latest ? nextDueDate(latest, ctx.cadence, ctx.cadence_days) : null;
  await PatientProgress.update({ next_due_date: next }, { where: { id: ctx.id }, transaction });
  return next;
}

export const progressMeasurementService = {
  // GET list with filters (type, source, from/to). Immutable history view.
  async list({ tenantId, auth, patientId, query }) {
    const current = actor(auth);
    if (current.role === "doctor") {
      if (!patientId) throw new AppError(422, "PROGRESS_PATIENT_REQUIRED", "patientId is required");
      await Patient.findOne({ where: { id: patientId, tenant_id: tenantId, deleted_at: null } });
    } else if (current.role === "patient") {
      if (patientId && String(patientId) !== String(current.patientId)) throw new AppError(403, "PROGRESS_FORBIDDEN", "Patients may only read their own measurements");
      patientId = current.patientId;
    } else {
      throw new AppError(403, "PROGRESS_FORBIDDEN", "Only a patient or doctor may read measurements");
    }
    const where = { tenant_id: tenantId, patient_id: patientId };
    if (query.type) where.measurement_type = parseType(query.type);
    if (query.source && ENUM.PROGRESS_SOURCE.includes(query.source)) where.source = query.source;
    if (query.from || query.to) {
      where.measured_on = {};
      if (query.from) where.measured_on[Op.gte] = String(query.from).slice(0, 10);
      if (query.to) where.measured_on[Op.lte] = String(query.to).slice(0, 10);
    }
    const rows = await ProgressMeasurement.findAll({ where, order: [["measured_on", "DESC"], ["id", "DESC"]], raw: true });
    return { items: rows.map((m) => ({ ...m, value: Number(m.value), id: String(m.id), patient_id: undefined })) };
  },

  // POST record a measurement (patient or doctor). §26.
  async record({ tenantId, auth, body, ip }) {
    const current = actor(auth);
    const tenant = await loadTenant(tenantId);
    const today = todayInTimeZone(tenantTimezone(tenant));
    const scope = await resolvePatientScope({ tenantId, auth, requestedPatientId: body.patientId });
    const type = parseType(body.measurementType);
    const value = validateValue(type, body.value);
    const measuredOn = normalizeMeasuredOn(body.measuredOn, today);
    const unit = typeof body.unit === "string" && body.unit.trim()
      ? body.unit.trim().slice(0, 10)
      : ENUM.PROGRESS_UNIT_BY_TYPE[type];
    const source = actorSource(current, body);
    if (source !== "patient" && source !== "checkin" && current.role !== "doctor") {
      throw new AppError(403, "PROGRESS_FORBIDDEN", "Only a doctor may tag a measurement with a clinic source");
    }
    if (source === "checkin") {
      throw new AppError(422, "PROGRESS_CHECKIN_SOURCE_DIRECT", "Check-in sourced weights are recorded through the weekly check-in, not this endpoint");
    }

    const created = await sequelize.transaction(async (transaction) => {
      const row = await ProgressMeasurement.create({
        tenant_id: tenantId,
        patient_id: scope.patientId,
        measurement_type: type,
        value,
        unit,
        measured_on: measuredOn,
        measured_at: body.measuredAt ? new Date(body.measuredAt) : null,
        recorded_at: new Date(),
        recorded_by_type: scope.byType,
        recorded_by: scope.byId,
        source,
        kind: "initial",
        correction_of_id: null,
        care_program_id: body.careProgramId || null,
        checkin_id: null,
        appointment_id: body.appointmentId || null,
        notes: body.notes ? String(body.notes).trim().slice(0, 1000) : null,
      }, { transaction });
      const nextDue = await recomputeNextDue(scope.patientId, tenantId, transaction);
      await auditService.record({ tenantId, action: "progress_measurement.created", entity: "progress_measurement", entityRef: String(row.id), metadata: { patientId: scope.patientId, type, value, source }, actorType: current.role, actorId: current.userId, ip, transaction });
      await notificationService.emitForPatient({ tenantId, patientId: scope.patientId, type: "progress_measurement_recorded", relatedEntity: "progress_measurement", relatedRef: String(row.id), transaction });
      return { row, nextDue };
    });
    return { measurement: created.row.toJSON(), nextDueDate: created.nextDue };
  },

  // POST correction (append-only) — supersedes the original, preserves it. §30.
  async correct({ tenantId, auth, measurementId, body, ip }) {
    const current = actor(auth);
    const reason = typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 400)
      : null;
    if (!reason) throw new AppError(422, "PROGRESS_REASON_REQUIRED", "A correction reason is required");
    const created = await sequelize.transaction(async (transaction) => {
      const original = await ProgressMeasurement.findOne({ where: { id: measurementId, tenant_id: tenantId }, transaction, raw: true });
      if (!original) throw new AppError(404, "PROGRESS_MEASUREMENT_NOT_FOUND", "Measurement not found");
      if (current.role === "patient" && String(original.patient_id) !== String(current.patientId)) {
        throw new AppError(403, "PROGRESS_FORBIDDEN", "Patients may only correct their own measurements");
      }
      if (original.source === "checkin") {
        throw new AppError(422, "PROGRESS_CHECKIN_CORRECTION", "Check-in sourced measurements are corrected by updating the check-in");
      }
      const value = validateValue(original.measurement_type, body.value);
      const row = await ProgressMeasurement.create({
        tenant_id: tenantId,
        patient_id: original.patient_id,
        measurement_type: original.measurement_type,
        value,
        unit: original.unit,
        measured_on: original.measured_on,
        measured_at: original.measured_at,
        recorded_at: new Date(),
        recorded_by_type: current.role === "patient" ? "patient" : "doctor",
        recorded_by: current.userId,
        source: original.source,
        kind: "correction",
        correction_of_id: original.id,
        reason,
        care_program_id: original.care_program_id,
        checkin_id: null,
        appointment_id: original.appointment_id,
        notes: body.notes ? String(body.notes).trim().slice(0, 1000) : null,
      }, { transaction });
      const nextDue = await recomputeNextDue(original.patient_id, tenantId, transaction);
      await auditService.record({ tenantId, action: "progress_measurement.corrected", entity: "progress_measurement", entityRef: String(row.id), metadata: { correctionOf: String(original.id), patientId: String(original.patient_id), type: original.measurement_type, value }, actorType: current.role, actorId: current.userId, ip, transaction });
      return { row, nextDue };
    });
    return { measurement: created.row.toJSON(), nextDueDate: created.nextDue };
  },

  // Derived summary for a measurement type (§26 GET /measurements/:type/summary).
  async summaryForType({ tenantId, auth, patientId, type, today }) {
    const current = actor(auth);
    if (current.role === "doctor") {
      if (!patientId) throw new AppError(422, "PROGRESS_PATIENT_REQUIRED", "patientId is required");
      await Patient.findOne({ where: { id: patientId, tenant_id: tenantId, deleted_at: null } });
    } else if (current.role === "patient") {
      if (patientId && String(patientId) !== String(current.patientId)) throw new AppError(403, "PROGRESS_FORBIDDEN", "Patients may only read their own measurements");
      patientId = current.patientId;
    } else {
      throw new AppError(403, "PROGRESS_FORBIDDEN", "Only a patient or doctor may read measurements");
    }
    parseType(type);
    const rows = await ProgressMeasurement.findAll({ where: { tenant_id: tenantId, patient_id: patientId }, raw: true });
    const series = measurementsOfType(rows, type);
    const start = startingValue(rows, type);
    const currentV = currentValue(rows, type);
    const delta = measurementDelta(start?.value ?? null, currentV?.value ?? null);
    const trend = windowAverageSeries(rows, type, today);
    const rate = start && currentV && currentV.measuredOn > start.measuredOn
      ? { perDay: ((currentV.value - start.value) / Math.max(1, diffDays(start.measuredOn, currentV.measuredOn))) }
      : null;
    const ctx = await PatientProgress.findOne({ where: { tenant_id: tenantId, patient_id: patientId }, raw: true });
    return {
      type,
      unit: ENUM.PROGRESS_UNIT_BY_TYPE[type],
      count: series.length,
      starting: start,
      current: currentV,
      delta,
      ratePerDay: rate ? Math.round(rate.perDay * 1000) / 1000 : null,
      trend,
      due: ctx ? { nextDueDate: ctx.next_due_date, isDue: isMeasurementDue(ctx.next_due_date, ctx.cadence, today, ctx.cadence_days) } : null,
    };
  },

  // GET /progress/context — cadence configuration (default weekly, §11).
  async getContext({ tenantId, auth, patientId }) {
    const resolved = await resolvePatientScope({ tenantId, auth, requestedPatientId: patientId });
    const ctx = await ensureProgressContext({ tenantId, patientId: resolved.patientId, transaction: null });
    return { patientId: resolved.patientId, cadence: ctx.cadence, cadenceDays: ctx.cadence_days, nextDueDate: ctx.next_due_date };
  },

  // PUT /progress/context — configure cadence (doctor; patient may only read).
  async updateContext({ tenantId, auth, patientId, body, ip }) {
    const current = actor(auth);
    if (current.role !== "doctor") throw new AppError(403, "PROGRESS_CONTEXT_FORBIDDEN", "Only a doctor may configure the measurement cadence");
    if (!patientId) throw new AppError(422, "PROGRESS_PATIENT_REQUIRED", "patientId is required");
    await Patient.findOne({ where: { id: patientId, tenant_id: tenantId, deleted_at: null } });
    const cadence = body.cadence;
    if (!ENUM.PROGRESS_CADENCE.includes(cadence)) {
      throw new AppError(422, "PROGRESS_CADENCE_INVALID", `cadence must be one of ${ENUM.PROGRESS_CADENCE.join(", ")}`);
    }
    let cadenceDays = null;
    if (cadence === "custom") {
      const days = Number(body.cadenceDays);
      if (!Number.isFinite(days) || days < 1 || days > 365) throw new AppError(422, "PROGRESS_CADENCE_DAYS_INVALID", "cadenceDays must be 1..365");
      cadenceDays = Math.round(days);
    }
    const updated = await sequelize.transaction(async (transaction) => {
      const ctx = await ensureProgressContext({ tenantId, patientId, transaction });
      await PatientProgress.update({ cadence, cadence_days: cadenceDays }, { where: { id: ctx.id }, transaction });
      const nextDue = await recomputeNextDue(patientId, tenantId, transaction);
      await auditService.record({ tenantId, action: "progress_context.updated", entity: "patient_progress", entityRef: String(ctx.id), metadata: { patientId, cadence, cadenceDays }, actorType: "doctor", actorId: current.userId, ip, transaction });
      return { nextDue };
    });
    return { cadence, cadenceDays, nextDueDate: updated.nextDue };
  },

  // Hooked from weekly patient check-ins (§23/§30): weight captured during a
  // check-in appends a source=checkin measurement (single canonical truth).
  async recordFromCheckin({ tenantId, patientId, checkinId, weightKg, measuredOn, recordedBy, transaction }) {
    if (weightKg == null) return null;
    const value = validateValue("weight", weightKg);
    const existing = await ProgressMeasurement.findOne({
      where: { patient_id: patientId, source: "checkin", checkin_id: checkinId, measurement_type: "weight" },
      transaction, raw: true,
    });
    if (existing) return null; // idempotent re-submission of the same check-in
    const row = await ProgressMeasurement.create({
      tenant_id: tenantId,
      patient_id: patientId,
      measurement_type: "weight",
      value,
      unit: "kg",
      measured_on: measuredOn,
      measured_at: new Date(),
      recorded_at: new Date(),
      recorded_by_type: "patient",
      recorded_by: recordedBy,
      source: "checkin",
      kind: "initial",
      correction_of_id: null,
      care_program_id: null,
      checkin_id: checkinId,
      appointment_id: null,
      notes: "Captured during weekly patient check-in",
    }, { transaction });
    await recomputeNextDue(patientId, tenantId, transaction);
    return row;
  },

  async listByPatient(patientId) {
    return ProgressMeasurement.findAll({ where: { patient_id: patientId }, raw: true });
  },
};

export default progressMeasurementService;