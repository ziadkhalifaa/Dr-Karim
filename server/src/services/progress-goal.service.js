// Phase 6C — Progress & Measurements: numeric goal service
// (docs/progress-goals.md §7, §8, §9, §26).
//
// Goals are DOCTOR-managed numeric targets (doctors are the decision maker —
// Phase 6C §7). Every goal carries versioned target values
// (patient_progress_goal_version); the latest ACTIVATED version is the current
// contract. Goals are versioned; values are never mutated in place.

import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";
import { tenantTimezone, todayInTimeZone } from "../utils/care-time.js";
import { ENUM } from "../config/constants.js";
import { ensureDoctorCtx, resolvePatientCtxFor } from "./progress.util.js";

const {
  Tenant, PatientProgressGoal, PatientProgressGoalVersion,
} = models;

async function loadTenant(tenantId) {
  const tenant = await Tenant.findByPk(tenantId, { raw: true });
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant not found");
  return tenant;
}

function normalizeDate(value, field) {
  if (!value) return null;
  const str = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) throw new AppError(422, "PROGRESS_GOAL_DATE_INVALID", `${field} must be a YYYY-MM-DD date`);
  return str;
}

function normalizeTarget(type, value) {
  const num = Number(value);
  if (type === "weight") {
    if (!Number.isFinite(num) || num < 20 || num > 400) throw new AppError(422, "PROGRESS_GOAL_TARGET_INVALID", "target must be between 20 and 400 kg");
    return Math.round(num * 100) / 100;
  }
  throw new AppError(422, "PROGRESS_GOAL_TYPE_INVALID", `goal_type must be one of ${ENUM.PROGRESS_GOAL_TYPE.join(", ")}`);
}

async function loadGoal({ goalId, tenantId, transaction, forUpdate = false }) {
  const opts = { where: { id: goalId, tenant_id: tenantId }, transaction, raw: true };
  if (forUpdate) opts.lock = transaction.LOCK.UPDATE;
  const goal = await PatientProgressGoal.findOne(opts);
  if (!goal) throw new AppError(404, "PROGRESS_GOAL_NOT_FOUND", "Goal not found");
  return goal;
}

async function latestVersion({ goalId, tenantId, transaction }) {
  const v = await PatientProgressGoalVersion.findOne({
    where: { goal_id: goalId, tenant_id: tenantId },
    order: [["version_no", "DESC"]],
    transaction, raw: true,
  });
  return v;
}

export const progressGoalService = {
  // Doctor creates a goal (status=draft) with version 1 (draft). §7/§26.
  async create({ tenantId, auth, body, ip }) {
    const current = ensureDoctorCtx(auth);
    const tenant = await loadTenant(tenantId);
    const today = todayInTimeZone(tenantTimezone(tenant));
    const { patientId } = await resolvePatientCtxFor({ tenantId, requestedPatientId: body.patientId });
    const type = body.goalType || "weight";
    if (!ENUM.PROGRESS_GOAL_TYPE.includes(type)) throw new AppError(422, "PROGRESS_GOAL_TYPE_INVALID", `goal_type must be one of ${ENUM.PROGRESS_GOAL_TYPE.join(", ")}`);
    const target = normalizeTarget(type, body.targetValue);
    const startDate = normalizeDate(body.startDate, "startDate") || today;
    const targetDate = normalizeDate(body.targetDate, "targetDate");

    const created = await sequelize.transaction(async (transaction) => {
      const goal = await PatientProgressGoal.create({
        tenant_id: tenantId,
        patient_id: patientId,
        doctor_id: current.doctorId ? Number(current.doctorId) : null,
        goal_type: type,
        unit: body.unit && body.unit.trim() ? body.unit.trim().slice(0, 10) : (type === "weight" ? "kg" : null),
        status: "draft",
        start_date: startDate,
        target_date: targetDate,
        created_by_type: "doctor",
        created_by: current.userId,
      }, { transaction });
      await PatientProgressGoalVersion.create({
        tenant_id: tenantId,
        goal_id: goal.id,
        version_no: 1,
        target_value: target,
        unit: goal.unit,
        start_date: startDate,
        target_date: targetDate,
        status: "draft",
        previous_version_id: null,
        created_by_type: "doctor",
        created_by: current.userId,
      }, { transaction });
      await auditService.record({ tenantId, action: "progress_goal.created", entity: "patient_progress_goal", entityRef: String(goal.id), metadata: { patientId, type, target, version: 1 }, actorType: "doctor", actorId: current.userId, ip, transaction });
      return goal;
    });
    return { goal: await this.get({ tenantId, auth, goalId: created.id }) };
  },

  // Doctor approves/activates the LATEST draft version (or the goal itself if
  // still draft). Activates goal.status=active; sets approved_by/at. §8/§9.
  async activate({ tenantId, auth, goalId, ip }) {
    const current = ensureDoctorCtx(auth);
    const activated = await sequelize.transaction(async (transaction) => {
      const goal = await loadGoal({ goalId, tenantId, transaction, forUpdate: true });
      if (goal.status === "closed" || goal.status === "cancelled") {
        throw new AppError(409, "PROGRESS_GOAL_CLOSED", "Closed or cancelled goals cannot be activated");
      }
      const version = await latestVersion({ goalId, tenantId, transaction });
      if (!version) throw new AppError(409, "PROGRESS_GOAL_VERSION_MISSING", "Goal has no versions");
      // Supersede any previously active version of this goal.
      await PatientProgressGoalVersion.update(
        { status: "superseded" },
        { where: { goal_id: goal.id, tenant_id: tenantId, status: "active" }, transaction },
      );
      await PatientProgressGoalVersion.update(
        { status: "active", activated_by: current.userId, activated_at: new Date() },
        { where: { id: version.id, tenant_id: tenantId }, transaction },
      );
      await PatientProgressGoal.update(
        { status: "active", approved_by: current.userId, approved_at: new Date(), closed_at: null },
        { where: { id: goal.id, tenant_id: tenantId }, transaction },
      );
      await auditService.record({ tenantId, action: "progress_goal.activated", entity: "patient_progress_goal_version", entityRef: String(version.id), metadata: { goalId: String(goal.id), patientId: String(goal.patient_id), type: goal.goal_type, target: version.target_value, versionNo: version.version_no }, actorType: "doctor", actorId: current.userId, ip, transaction });
      return { goal, version };
    });
    return { goal: await this.get({ tenantId, auth, goalId: activated.goal.id }) };
  },

  // Doctor drafts a NEW version of an existing goal. Values are never edited in
  // place — a new immutable version row is appended (§8).
  async addVersion({ tenantId, auth, goalId, body, ip }) {
    const current = ensureDoctorCtx(auth);
    const created = await sequelize.transaction(async (transaction) => {
      const goal = await loadGoal({ goalId, tenantId, transaction, forUpdate: true });
      if (!["draft", "active"].includes(goal.status)) {
        throw new AppError(409, "PROGRESS_GOAL_CLOSED", "Closed or cancelled goals cannot be versioned");
      }
      const prev = await latestVersion({ goalId, tenantId, transaction });
      const target = normalizeTarget(goal.goal_type, body.targetValue);
      const startDate = normalizeDate(body.startDate, "startDate") || goal.start_date;
      const targetDate = body.targetDate == null ? goal.target_date : normalizeDate(body.targetDate, "targetDate");
      const row = await PatientProgressGoalVersion.create({
        tenant_id: tenantId,
        goal_id: goal.id,
        version_no: (prev ? prev.version_no : 0) + 1,
        target_value: target,
        unit: body.unit && body.unit.trim() ? body.unit.trim().slice(0, 10) : goal.unit,
        start_date: startDate,
        target_date: targetDate,
        status: "draft",
        previous_version_id: prev ? prev.id : null,
        created_by_type: "doctor",
        created_by: current.userId,
      }, { transaction });
      await auditService.record({ tenantId, action: "progress_goal.version_created", entity: "patient_progress_goal_version", entityRef: String(row.id), metadata: { goalId: String(goal.id), versionNo: row.version_no, target }, actorType: "doctor", actorId: current.userId, ip, transaction });
      return row;
    });
    return { version: created.toJSON() };
  },

  // Doctor closes an active goal once reached/stopped, or cancels a draft. §9.
  async close({ tenantId, auth, goalId, body, ip }) {
    const current = ensureDoctorCtx(auth);
    const finalStatus = await sequelize.transaction(async (transaction) => {
      const goal = await loadGoal({ goalId, tenantId, transaction, forUpdate: true });
      if (goal.status === "closed" || goal.status === "cancelled") {
        throw new AppError(409, "PROGRESS_GOAL_ALREADY_CLOSED", "Goal is already closed/cancelled");
      }
      const applyStatus = goal.status === "draft"
        ? "cancelled"
        : (body.status === "cancelled" ? "cancelled" : "closed");
      await PatientProgressGoal.update(
        { status: applyStatus, closed_at: new Date() },
        { where: { id: goal.id, tenant_id: tenantId }, transaction },
      );
      await auditService.record({ tenantId, action: `progress_goal.${applyStatus}`, entity: "patient_progress_goal", entityRef: String(goal.id), metadata: { patientId: String(goal.patient_id), reason: body.reason ? String(body.reason).slice(0, 400) : null }, actorType: "doctor", actorId: current.userId, ip, transaction });
      return applyStatus;
    });
    return { id: String(goalId), status: finalStatus };
  },

  async list({ tenantId, auth, patientId, status }) {
    ensureDoctorCtx(auth);
    const { patientId: pid } = await resolvePatientCtxFor({ tenantId, requestedPatientId: patientId });
    const where = { tenant_id: tenantId, patient_id: pid };
    if (status && ENUM.PROGRESS_GOAL_STATUS.includes(status)) where.status = status;
    const goals = await PatientProgressGoal.findAll({ where, order: [["id", "DESC"]], raw: true });
    const out = [];
    for (const goal of goals) {
      const versions = await PatientProgressGoalVersion.findAll({ where: { goal_id: goal.id, tenant_id: tenantId }, order: [["version_no", "ASC"]], raw: true });
      out.push({ ...goal, id: String(goal.id), doctor_id: undefined, versions });
    }
    return { items: out };
  },

  async get({ tenantId, auth, goalId }) {
    ensureDoctorCtx(auth);
    const goal = await loadGoal({ goalId, tenantId });
    const versions = await PatientProgressGoalVersion.findAll({ where: { goal_id: goal.id, tenant_id: tenantId }, order: [["version_no", "ASC"]], raw: true });
    const activeVersion = versions.find((v) => v.status === "active") || versions[versions.length - 1] || null;
    return {
      id: String(goal.id),
      patientId: String(goal.patient_id),
      goalType: goal.goal_type,
      unit: goal.unit,
      status: goal.status,
      startDate: goal.start_date,
      targetDate: goal.target_date,
      approvedAt: goal.approved_at,
      closedAt: goal.closed_at,
      currentVersion: activeVersion,
      versions,
    };
  },
};

export default progressGoalService;