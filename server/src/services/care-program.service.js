// Doctor-authored care program lifecycle (docs/daily-care-workflow.md §2, §22).
//
// The doctor is the clinical decision maker: they explicitly assign the active
// care program (plan versions + date range + doctor-authored activity
// definitions) and activate it. Nothing is auto-chosen from payment approval.
// Care days are materialized LAZILY up to the requested date in the tenant
// timezone, so a future program/plan change (new care_program_version) never
// rewrites historical days (§20) — days already bound to an older version stay.

import { Op } from "sequelize";
import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { ENUM } from "../config/constants.js";
import { auditService } from "./audit.service.js";
import { notificationService } from "./notification.service.js";
import { dateRange, tenantTimezone, todayInTimeZone, addDays } from "../utils/care-time.js";

const {
  Tenant, Patient,
  NutritionPlan, NutritionPlanVersion, ExercisePlan, ExercisePlanVersion,
  CareProgram, CareProgramVersion, CareDay,
  CareActivityDefinition, CareActivityInstance,
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

function needDoctor(auth) {
  const current = actor(auth);
  if (current.role !== "doctor" || !current.doctorId) {
    throw new AppError(403, "CARE_PROGRAM_WRITE_FORBIDDEN", "Only a doctor may author a care program");
  }
  return current;
}

async function loadTenant(tenantId) {
  const tenant = await Tenant.findOne({ where: { id: tenantId }, raw: true });
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant not found");
  return tenant;
}

async function loadPatient(patientId, tenantId, transaction) {
  const patient = await Patient.findOne({
    where: { id: patientId, tenant_id: tenantId, status: { [Op.in]: ["active", "inactive"] } },
    transaction, raw: true,
  });
  if (!patient) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found in this tenant");
  return patient;
}

async function loadProgram(id, tenantId, transaction, lock = false) {
  const program = await CareProgram.findOne({
    where: { id, tenant_id: tenantId, deleted_at: null },
    transaction, lock: lock ? transaction.LOCK.UPDATE : undefined, raw: true,
  });
  if (!program) throw new AppError(404, "CARE_PROGRAM_NOT_FOUND", "Care program not found");
  return program;
}

function assertOwner(program, doctorId) {
  if (program.doctor_id && String(program.doctor_id) !== String(doctorId)) {
    throw new AppError(403, "CARE_PROGRAM_FORBIDDEN", "Only the program's doctor may modify it");
  }
}

function validDate(value, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new AppError(422, "CARE_PROGRAM_VALIDATION_ERROR", `${label} must be a YYYY-MM-DD date`);
  }
  return value;
}

async function loadPlanVersion(domain, versionId, patientId, tenantId, transaction) {
  if (!versionId) return null;
  const [Plan, PlanVersion] = domain === "nutrition"
    ? [NutritionPlan, NutritionPlanVersion, "NutritionPlan"]
    : [ExercisePlan, ExercisePlanVersion, "ExercisePlan"];
  const version = await PlanVersion.findOne({ where: { id: versionId, tenant_id: tenantId }, transaction, raw: true });
  if (!version) throw new AppError(422, "CARE_PLAN_VERSION_INVALID", `${domain} plan version not found`);
  const plan = await Plan.findOne({ where: { id: version.plan_id, tenant_id: tenantId }, transaction, raw: true });
  if (!plan || String(plan.patient_id) !== String(patientId)) {
    throw new AppError(422, "CARE_PLAN_VERSION_INVALID", `The ${domain} plan version does not belong to this patient`);
  }
  if (!["approved", "active"].includes(version.status)) {
    throw new AppError(422, "CARE_PLAN_VERSION_INVALID", `The ${domain} plan version must be approved or active`);
  }
  return { versionId: version.id, planId: plan.id };
}

function normalizeDefinition(input) {
  if (!input || typeof input !== "object") {
    throw new AppError(422, "CARE_DEFINITION_INVALID", "An activity definition is required");
  }
  if (!ENUM.CARE_ACTIVITY_TYPE.includes(input.activityType)) {
    throw new AppError(422, "CARE_DEFINITION_INVALID", "activityType must be nutrition, exercise, or medication");
  }
  if (!ENUM.CARE_ACTIVITY_MEASURE.includes(input.measure)) {
    throw new AppError(422, "CARE_DEFINITION_INVALID", "measure must be boolean, sessions, quantity, or duration");
  }
  if (!input.code || !/^[a-z0-9_-]{1,40}$/iu.test(String(input.code))) {
    throw new AppError(422, "CARE_DEFINITION_INVALID", "code is required (letters, digits, - or _)");
  }
  const nameAr = typeof input.nameAr === "string" && input.nameAr.trim() ? input.nameAr.trim() : null;
  const nameEn = typeof input.nameEn === "string" && input.nameEn.trim() ? input.nameEn.trim() : null;
  if (input.nameAr && !nameAr) throw new AppError(422, "CARE_DEFINITION_INVALID", "nameAr is required");
  if (input.nameEn && !nameEn) throw new AppError(422, "CARE_DEFINITION_INVALID", "nameEn is required");
  if (!nameAr && !nameEn) throw new AppError(422, "CARE_DEFINITION_INVALID", "At least one activity name is required");

  let target = null;
  const raw = input.plannedTarget || {};
  if (input.measure === "boolean") {
    target = { value: null };
  } else if (input.measure === "sessions") {
    const value = Number(raw.value ?? raw.sessions ?? raw);
    if (!Number.isFinite(value) || value < 1) throw new AppError(422, "CARE_DEFINITION_INVALID", "sessions target must be >= 1");
    target = { value, unit: null, measure: "sessions" };
  } else if (input.measure === "quantity") {
    const value = Number(raw.value ?? raw.quantity ?? raw);
    if (!Number.isFinite(value) || value <= 0) throw new AppError(422, "CARE_DEFINITION_INVALID", "quantity target must be > 0");
    const unit = typeof raw.unit === "string" ? raw.unit.trim().slice(0, 10) : null;
    if (!unit) throw new AppError(422, "CARE_DEFINITION_INVALID", "quantity target requires a unit");
    target = { value, unit, measure: "quantity" };
  } else if (input.measure === "duration") {
    const value = Number(raw.value ?? raw.durationMin ?? raw);
    if (!Number.isFinite(value) || value <= 0) throw new AppError(422, "CARE_DEFINITION_INVALID", "duration target must be > 0 minutes");
    target = { value, unit: "min", measure: "duration" };
  }
  return {
    activityType: input.activityType,
    code: String(input.code),
    nameAr: nameAr || nameEn,
    nameEn: nameEn || nameAr,
    measure: input.measure,
    plannedTarget: target,
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
  };
}

// The care_program_version active for a date: highest effective_from <= date
// whose effective_to still covers the date (or is open).
function versionEffectiveFor(versions, date) {
  let chosen = null;
  for (const v of versions) {
    if (v.effective_from <= date && (v.effective_to === null || v.effective_to >= date)) {
      if (!chosen || v.effective_from > chosen.effective_from) chosen = v;
    }
  }
  return chosen;
}

function programStatusMessage(program) {
  return { programId: String(program.id), status: program.status, startDate: program.start_date, endDate: program.end_date };
}

export const careProgramService = {
  // ---- Materialization (lazy, up to the requested date) ----
  async ensureMaterializedUpTo(program, tenant, upToDate, transaction) {
    const activeVersions = await CareProgramVersion.findAll({
      where: { care_program_id: program.id, tenant_id: program.tenant_id, status: "active" },
      order: [["effective_from", "ASC"]], transaction, raw: true,
    });
    if (!activeVersions.length) return;

    const end = upToDate <= program.end_date ? upToDate : program.end_date;
    const start = program.start_date;
    const existing = await CareDay.findAll({
      where: { care_program_id: program.id, tenant_id: program.tenant_id },
      attributes: ["date", "care_program_version_id", "day_index"], transaction, raw: true,
    });
    const bound = new Map(existing.map((d) => [d.date, d]));

    const daysNeeded = dateRange(start, end);
    let dayIndex = existing.reduce((m, d) => Math.max(m, Number(d.day_index)), 0);
    for (const date of daysNeeded) {
      if (bound.has(date)) continue;
      const version = versionEffectiveFor(activeVersions, date);
      if (!version) continue;
      dayIndex += 1;
      const day = await CareDay.create({
        tenant_id: program.tenant_id, care_program_id: program.id,
        care_program_version_id: version.id, date, day_index: dayIndex,
      }, { transaction });
      const definitions = await CareActivityDefinition.findAll({
        where: { care_program_version_id: version.id, tenant_id: program.tenant_id, active: true },
        order: [["sort_order", "ASC"], ["id", "ASC"]], transaction, raw: true,
      });
      for (const def of definitions) {
        await CareActivityInstance.create({
          tenant_id: program.tenant_id, care_day_id: day.id, care_activity_definition_id: def.id,
          activity_type: def.activity_type, code: def.code, name_ar: def.name_ar, name_en: def.name_en,
          measure: def.measure, planned_target_json: def.planned_target_json, sort_order: def.sort_order,
        }, { transaction });
      }
    }
  },

  async programForPatient(patientId, tenantId, transaction) {
    const program = await CareProgram.findOne({
      where: {
        patient_id: patientId, tenant_id: tenantId, deleted_at: null,
        status: { [Op.in]: ["active", "scheduled", "paused", "draft"] },
      },
      order: [["id", "DESC"]], transaction, raw: true,
    });
    return program || null;
  },

  async effectiveVersion(program, date, transaction) {
    const versions = await CareProgramVersion.findAll({
      where: { care_program_id: program.id, tenant_id: program.tenant_id, status: "active" },
      transaction, raw: true,
    });
    return versionEffectiveFor(versions, date) || null;
  },

  // ---- Doctor authoring API ----
  async create({ tenantId, auth, body }) {
    const current = needDoctor(auth);
    // Read-back happens AFTER commit: get() uses its own connection and cannot
    // see rows created inside this transaction.
    const programId = await sequelize.transaction(async (transaction) => {
      const patient = await loadPatient(body.patientId, tenantId, transaction);
      const startDate = validDate(body.startDate, "startDate");
      const endDate = validDate(body.endDate, "endDate");
      if (startDate > endDate) throw new AppError(422, "CARE_PROGRAM_VALIDATION_ERROR", "startDate must be on or before endDate");
      const status = body.status === "scheduled" ? "scheduled" : "draft";
      const nutrition = await loadPlanVersion("nutrition", body.nutritionPlanVersionId, patient.id, tenantId, transaction);
      const exercise = await loadPlanVersion("exercise", body.exercisePlanVersionId, patient.id, tenantId, transaction);
      const subscription = body.subscriptionId ? await models.Subscription.findOne({ where: { id: body.subscriptionId, tenant_id: tenantId }, transaction, raw: true }) : null;
      if (body.subscriptionId && (!subscription || String(subscription.patient_id) !== String(patient.id))) {
        throw new AppError(422, "CARE_PROGRAM_VALIDATION_ERROR", "subscriptionId does not match this patient");
      }
      const program = await CareProgram.create({
        tenant_id: tenantId, patient_id: patient.id, doctor_id: current.doctorId,
        package_id: body.packageId || null, subscription_id: subscription?.id || null,
        nutrition_plan_version_id: nutrition?.versionId || null,
        exercise_plan_version_id: exercise?.versionId || null,
        start_date: startDate, end_date: endDate, status,
        program_instructions: body.programInstructions || null,
        created_by_type: "doctor", created_by: current.userId,
      }, { transaction });
      await CareProgramVersion.create({
        tenant_id: tenantId, care_program_id: program.id, version_no: 1, status: "draft",
        nutrition_plan_version_id: nutrition?.versionId || null,
        exercise_plan_version_id: exercise?.versionId || null,
        program_instructions: body.programInstructions || null,
        effective_from: startDate, effective_to: endDate || null,
        created_by_type: "doctor", created_by: current.userId, previous_version_id: null,
      }, { transaction });
      await auditService.record({ tenantId, action: "care_program.created", entity: "care_program", entityRef: String(program.id), metadata: programStatusMessage(program), actorType: "doctor", actorId: current.userId, transaction });
      return String(program.id);
    });
    return this.get({ tenantId, programId, auth });
  },

  async list({ tenantId, auth, query = {} }) {
    const current = actor(auth);
    if (!["doctor", "staff"].includes(current.role)) throw new AppError(403, "CARE_PROGRAM_LIST_FORBIDDEN", "Only doctor or staff may list care programs");
    const where = { tenant_id: tenantId, deleted_at: null };
    if (query.patientId) where.patient_id = query.patientId;
    if (query.status && ["active", "scheduled", "draft", "paused", "completed", "cancelled", "expired"].includes(query.status)) where.status = query.status;
    const limit = Math.min(Number(query.limit || 100), 200);
    const programs = await CareProgram.findAll({ where, order: [["id", "DESC"]], limit, raw: true });
    return programs;
  },

  async get({ tenantId, programId, auth }) {
    const current = actor(auth);
    if (!["doctor", "staff", "patient"].includes(current.role)) throw new AppError(403, "CARE_PROGRAM_READ_FORBIDDEN", "Not allowed to read care programs");
    const program = await loadProgram(programId, tenantId);
    if (current.role === "patient" && String(program.patient_id) !== String(current.patientId)) {
      throw new AppError(403, "CARE_PROGRAM_READ_FORBIDDEN", "Patients may only view their own care program");
    }
    const versions = await CareProgramVersion.findAll({
      where: { care_program_id: program.id, tenant_id: tenantId }, order: [["version_no", "ASC"]], raw: true,
    });
    const withDefinitions = await Promise.all(versions.map(async (version) => {
      const definitions = await CareActivityDefinition.findAll({
        where: { care_program_version_id: version.id, tenant_id: tenantId }, order: [["sort_order", "ASC"], ["id", "ASC"]], raw: true,
      });
      return { ...version, definitions };
    }));
    return { program, versions: withDefinitions };
  },

  async createVersion({ tenantId, programId, auth, body }) {
    const current = needDoctor(auth);
    const tenant = await loadTenant(tenantId);
    await sequelize.transaction(async (transaction) => {
      const program = await loadProgram(programId, tenantId, transaction, true);
      assertOwner(program, current.doctorId);
      if (["completed", "cancelled", "expired"].includes(program.status)) {
        throw new AppError(409, "CARE_PROGRAM_FROZEN", "Completed/cancelled/expired programs cannot receive new versions");
      }
      const effectiveFrom = validDate(body.effectiveFrom, "effectiveFrom");
      if (effectiveFrom < program.start_date || effectiveFrom > program.end_date) {
        throw new AppError(422, "CARE_PROGRAM_VALIDATION_ERROR", "effectiveFrom must fall inside the program date range");
      }
      const today = todayInTimeZone(tenantTimezone(tenant));
      if (effectiveFrom < today) {
        throw new AppError(422, "CARE_PROGRAM_VALIDATION_ERROR", "effectiveFrom must not be in the past (plan versions cannot rewrite history)");
      }
      const latest = await CareProgramVersion.findOne({
        where: { care_program_id: program.id, tenant_id: tenantId }, order: [["version_no", "DESC"]],
        transaction, lock: transaction.LOCK.UPDATE, raw: true,
      });
      if (latest && effectiveFrom <= latest.effective_from) {
        throw new AppError(422, "CARE_PROGRAM_VALIDATION_ERROR", "effectiveFrom must be after the current version's effective_from");
      }
      const nutrition = await loadPlanVersion("nutrition", body.nutritionPlanVersionId ?? program.nutrition_plan_version_id, program.patient_id, tenantId, transaction);
      const exercise = await loadPlanVersion("exercise", body.exercisePlanVersionId ?? program.exercise_plan_version_id, program.patient_id, tenantId, transaction);
      const version = await CareProgramVersion.create({
        tenant_id: tenantId, care_program_id: program.id, version_no: (latest?.version_no || 0) + 1, status: "draft",
        nutrition_plan_version_id: nutrition?.versionId || null,
        exercise_plan_version_id: exercise?.versionId || null,
        program_instructions: body.programInstructions ?? program.program_instructions,
        effective_from: effectiveFrom, effective_to: latest?.effective_to || program.end_date || null,
        created_by_type: "doctor", created_by: current.userId, previous_version_id: latest?.id || null,
      }, { transaction });
      await auditService.record({ tenantId, action: "care_program.version_created", entity: "care_program_version", entityRef: String(version.id), metadata: { programId, versionNo: version.version_no, effectiveFrom }, actorType: "doctor", actorId: current.userId, transaction });
    });
    return this.get({ tenantId, programId, auth });
  },

  async addDefinitions({ tenantId, programId, auth, body }) {
    const current = needDoctor(auth);
    return sequelize.transaction(async (transaction) => {
      const program = await loadProgram(programId, tenantId, transaction, true);
      assertOwner(program, current.doctorId);
      const latest = await CareProgramVersion.findOne({
        where: { care_program_id: program.id, tenant_id: tenantId }, order: [["version_no", "DESC"]],
        transaction, lock: transaction.LOCK.UPDATE, raw: true,
      });
      if (!latest) throw new AppError(409, "CARE_PROGRAM_NO_VERSION", "Program has no version");
      if (latest.status !== "draft") {
        throw new AppError(409, "CARE_DEFINITION_LOCKED", "Definitions may only be added to a not-yet-activated program version (create a new future version to change the future)");
      }
      const items = Array.isArray(body) ? body : [body];
      const created = [];
      for (const item of items) {
        const def = normalizeDefinition(item);
        const existing = await CareActivityDefinition.findOne({ where: { care_program_version_id: latest.id, tenant_id: tenantId, code: def.code }, transaction, raw: true });
        if (existing) {
          const update = {
            activity_type: def.activityType,
            code: def.code,
            name_ar: def.nameAr,
            name_en: def.nameEn,
            measure: def.measure,
            planned_target_json: def.plannedTarget,
            sort_order: def.sortOrder,
            active: true,
          };
          await CareActivityDefinition.update(update, { where: { id: existing.id, tenant_id: tenantId }, transaction });
          created.push({ ...existing, ...update });
        } else {
          const row = await CareActivityDefinition.create({
            tenant_id: tenantId, care_program_version_id: latest.id, activity_type: def.activityType,
            code: def.code, name_ar: def.nameAr, name_en: def.nameEn, measure: def.measure,
            planned_target_json: def.plannedTarget, sort_order: def.sortOrder, active: true,
          }, { transaction });
          created.push(row.toJSON());
        }
      }
      await auditService.record({ tenantId, action: "care_program.definitions_added", entity: "care_activity_definition", entityRef: String(latest.id), metadata: { programId, count: created.length, codes: created.map((c) => c.code) }, actorType: "doctor", actorId: current.userId, transaction });
      return { programId: String(programId), definitions: created };
    });
  },

  async activate({ tenantId, programId, auth, versionNo }) {
    const current = needDoctor(auth);
    const tenant = await loadTenant(tenantId);
    await sequelize.transaction(async (transaction) => {
      const program = await loadProgram(programId, tenantId, transaction, true);
      assertOwner(program, current.doctorId);
      if (["completed", "cancelled", "expired"].includes(program.status)) {
        throw new AppError(409, "CARE_PROGRAM_FROZEN", "Completed/cancelled/expired programs cannot be activated");
      }
      const version = versionNo
        ? await CareProgramVersion.findOne({ where: { care_program_id: program.id, tenant_id: tenantId, version_no: Number(versionNo) }, transaction, lock: transaction.LOCK.UPDATE, raw: true })
        : await CareProgramVersion.findOne({ where: { care_program_id: program.id, tenant_id: tenantId }, order: [["version_no", "DESC"]], transaction, lock: transaction.LOCK.UPDATE, raw: true });
      if (!version) throw new AppError(404, "CARE_PROGRAM_VERSION_NOT_FOUND", "Care program version not found");
      if (version.status !== "draft") {
        throw new AppError(409, "CARE_VERSION_ALREADY_ACTIVE", "This program version is already active");
      }
      const today = todayInTimeZone(tenantTimezone(tenant));

      const supersede = await CareProgramVersion.findOne({
        where: { care_program_id: program.id, tenant_id: tenantId, status: "active" },
        transaction, lock: transaction.LOCK.UPDATE, raw: true,
      });
      if (supersede && String(supersede.id) !== String(version.id)) {
        if (version.effective_from <= supersede.effective_from) {
          throw new AppError(422, "CARE_PROGRAM_VALIDATION_ERROR", "New version effective_from must be after the active version's effective_from");
        }
        const prev = await CareProgramVersion.findByPk(supersede.id, { transaction });
        prev.status = "superseded";
        prev.effective_to = addDays(version.effective_from, -1);
        await prev.save({ transaction });
      }

      const v = await CareProgramVersion.findByPk(version.id, { transaction });
      v.status = "active";
      v.activated_by_type = "doctor";
      v.activated_by = current.userId;
      v.activated_at = new Date();
      await v.save({ transaction });

      const p = await CareProgram.findByPk(program.id, { transaction });
      p.status = "active";
      p.nutrition_plan_version_id = v.nutrition_plan_version_id;
      p.exercise_plan_version_id = v.exercise_plan_version_id;
      p.program_instructions = v.program_instructions;
      p.activated_by_type = "doctor";
      p.activated_by = current.userId;
      p.activated_at = new Date();
      await p.save({ transaction });

      // Lazy materialization: days up to and including today become real.
      await this.ensureMaterializedUpTo(p.toJSON(), tenant, today, transaction);

      await auditService.record({ tenantId, action: "care_program.activated", entity: "care_program", entityRef: String(program.id), metadata: programStatusMessage(p), actorType: "doctor", actorId: current.userId, transaction });
      await notificationService.emitForPatient({ tenantId, patientId: program.patient_id, type: "care_program_activated", relatedEntity: "care_program", relatedRef: String(program.id), transaction });
    });
    // Read-back after commit so the response reflects the activated version.
    return this.get({ tenantId, programId, auth });
  },
};

export default careProgramService;