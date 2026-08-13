// Phase 6C — Progress & Measurements: read-side orchestration
// (docs/progress-measurements.md §26 dashboard, docs/progress-goals.md §7).
//
// The patient/doctor progress dashboard is a pure READ aggregation of the
// immutable measurement timeline + versioned goals + cadence context. Nothing
// here mutates state; all current/derived values come from progress-analytics.

import { models } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { tenantTimezone, todayInTimeZone } from "../utils/care-time.js";
import { ENUM } from "../config/constants.js";
import { progressMeasurementService } from "./progress-measurement.service.js";
import {
  measurementsOfType, startingValue, currentValue, measurementDelta,
  goalProgressPercent, projectedReachDate, ratePerDay,
} from "./progress-analytics.js";

const { Tenant, Patient, ProgressMeasurement, PatientProgressGoal, PatientProgressGoalVersion } = models;

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

async function resolvePatient({ tenantId, auth, requestedPatientId }) {
  const current = actor(auth);
  if (current.role === "doctor") {
    if (!requestedPatientId) throw new AppError(422, "PROGRESS_PATIENT_REQUIRED", "patientId is required");
    const patient = await Patient.findOne({ where: { id: requestedPatientId, tenant_id: tenantId, deleted_at: null }, raw: true });
    if (!patient) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
    return String(patient.id);
  }
  if (current.role === "patient") {
    if (requestedPatientId && String(requestedPatientId) !== String(current.patientId)) {
      throw new AppError(403, "PROGRESS_FORBIDDEN", "Patients may only view their own progress");
    }
    if (!current.patientId) throw new AppError(403, "PROGRESS_FORBIDDEN", "No patient profile bound to this account");
    return String(current.patientId);
  }
  throw new AppError(403, "PROGRESS_FORBIDDEN", "Only a patient or doctor may view progress");
}

async function activeGoal(patientId, tenantId) {
  const goal = await PatientProgressGoal.findOne({
    where: { tenant_id: tenantId, patient_id: patientId, status: "active" },
    order: [["id", "DESC"]],
    raw: true,
  });
  if (!goal) return null;
  const version = await PatientProgressGoalVersion.findOne({
    where: { goal_id: goal.id, tenant_id: tenantId, status: "active" },
    order: [["version_no", "DESC"]],
    raw: true,
  });
  return {
    id: String(goal.id),
    goalType: goal.goal_type,
    unit: goal.unit,
    startDate: goal.start_date,
    targetDate: goal.target_date,
    targetValue: version ? Number(version.target_value) : null,
  };
}

export const progressService = {
  // Patient progress dashboard (or doctor-scoped view of one patient).
  async dashboard({ tenantId, auth, patientId: requestedPatientId }) {
    const patientId = await resolvePatient({ tenantId, auth, requestedPatientId });
    const tenant = await loadTenant(tenantId);
    const today = todayInTimeZone(tenantTimezone(tenant));

    const rows = await ProgressMeasurement.findAll({ where: { tenant_id: tenantId, patient_id: patientId }, order: [["measured_on", "ASC"], ["id", "ASC"]], raw: true });

    const byType = {};
    for (const type of ENUM.PROGRESS_MEASUREMENT_TYPE) {
      const series = measurementsOfType(rows, type);
      const start = startingValue(rows, type);
      const currentV = currentValue(rows, type);
      const delta = measurementDelta(start?.value ?? null, currentV?.value ?? null);
      const rate = start && currentV && currentV.measuredOn > start.measuredOn
        ? ratePerDay(start.measuredOn, start.value, currentV.measuredOn, currentV.value)
        : null;
      byType[type] = {
        count: series.length,
        starting: start,
        current: currentV,
        delta,
        ratePerDay: rate,
        unit: ENUM.PROGRESS_UNIT_BY_TYPE[type],
      };
    }

    const goal = await activeGoal(patientId, tenantId);
    let goalProgress = null;
    if (goal && goal.targetValue != null && byType.weight?.starting) {
      const currentV = byType.weight.current?.value;
      const startV = byType.weight.starting?.value;
      goalProgress = {
        percent: goalProgressPercent(startV, currentV, goal.targetValue),
        projectedReachDate: projectedReachDate(startV, currentV, goal.targetValue, byType.weight.ratePerDay, today),
      };
    }

    const ctx = await progressMeasurementService.getContext({ tenantId, auth, patientId });
    const due = ctx.nextDueDate
      ? { nextDueDate: ctx.nextDueDate, isDue: ctx.nextDueDate <= today }
      : { nextDueDate: null, isDue: null };

    const recent = rows.slice(-10).reverse().map((m) => ({
      id: String(m.id),
      type: m.measurement_type,
      value: Number(m.value),
      unit: m.unit,
      measuredOn: m.measured_on,
      source: m.source,
      kind: m.kind,
    }));

    return { patientId, today, cadence: ctx.cadence, cadenceDays: ctx.cadenceDays, due, byType, goal, goalProgress, recent };
  },
};

export default progressService;