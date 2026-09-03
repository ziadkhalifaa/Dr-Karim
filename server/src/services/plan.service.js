import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { ENUM } from "../config/constants.js";
import { auditService } from "./audit.service.js";
import { notificationService } from "./notification.service.js";
import { entitlementService } from "./entitlement.service.js";

const {
  Patient, DoctorReview, AssessmentSession,
  NutritionPlan, NutritionPlanVersion, MealTemplate, MealItem,
  FoodItem, FoodSubstitution, NutritionPlanNote,
  ExercisePlan, ExercisePlanVersion, ExerciseItem, ExercisePlanNote,
} = models;

const CONFIG = {
  nutrition: {
    plan: NutritionPlan, version: NutritionPlanVersion, note: NutritionPlanNote,
    path: "nutrition", versionPath: "nutrition_plan_version", planPath: "nutrition_plan",
  },
  exercise: {
    plan: ExercisePlan, version: ExercisePlanVersion, note: ExercisePlanNote,
    path: "exercise", versionPath: "exercise_plan_version", planPath: "exercise_plan",
  },
};

function configFor(domain) {
  const config = CONFIG[domain];
  if (!config) throw new AppError(404, "PLAN_DOMAIN_NOT_FOUND", "Unknown plan domain");
  return config;
}

function doctorActor(auth, write = false) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  if (write && auth.membership.role !== "doctor") throw new AppError(403, "PLAN_WRITE_FORBIDDEN", "Only doctors may modify clinical plans");
  if (!write && !["doctor", "staff", "patient"].includes(auth.membership.role)) throw new AppError(403, "PLAN_READ_FORBIDDEN", "Plan access denied");
  if (write && !auth.user.doctor_id) throw new AppError(403, "PLAN_WRITE_FORBIDDEN", "A doctor profile is required");
  return { role: auth.membership.role, userId: String(auth.user.id), doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null, patientId: auth.user.patient_id ? String(auth.user.patient_id) : null };
}

async function loadPatient(patientId, tenantId, transaction) {
  const patient = await Patient.findOne({ where: { id: patientId, tenant_id: tenantId, status: ["active", "inactive"] }, transaction, raw: true });
  if (!patient) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found in this tenant");
  return patient;
}

async function loadReview(reviewId, patientId, tenantId, transaction) {
  if (!reviewId) throw new AppError(422, "REVIEW_REQUIRED", "A doctor review is required");
  const review = await DoctorReview.findOne({ where: { id: reviewId, tenant_id: tenantId }, transaction, raw: true });
  if (!review) throw new AppError(404, "REVIEW_NOT_FOUND", "Doctor review not found");
  if (String(review.patient_id) !== String(patientId)) throw new AppError(409, "REVIEW_PATIENT_MISMATCH", "Doctor review and patient do not match");
  return review;
}

async function loadPlan(domain, planId, tenantId, transaction, lock = false) {
  const config = configFor(domain);
  const plan = await config.plan.findOne({ where: { id: planId, tenant_id: tenantId }, transaction, lock: lock ? transaction.LOCK.UPDATE : undefined, raw: true });
  if (!plan) throw new AppError(404, "PLAN_NOT_FOUND", "Plan not found");
  return plan;
}

function assertVersionTransition(status, next) {
  const allowed = { draft: ["doctor_review", "archived"], doctor_review: ["approved", "archived"], approved: ["active", "archived"], active: ["archived"], archived: [] };
  if (!allowed[status]?.includes(next)) throw new AppError(409, "PLAN_INVALID_TRANSITION", `Cannot transition plan version from ${status} to ${next}`);
}

async function createNutritionContents(body, version, tenantId, transaction) {
  for (const [templateIndex, templateInput] of (body.meals || []).entries()) {
    if (!templateInput?.code) throw new AppError(422, "PLAN_VALIDATION_ERROR", "Each meal requires a code");
    const template = await MealTemplate.create({
      tenant_id: tenantId, plan_version_id: version.id, code: templateInput.code,
      name_ar: templateInput.nameAr || null, name_en: templateInput.nameEn || null,
      day_number: templateInput.dayNumber ?? null, sort_order: templateInput.sortOrder ?? templateIndex,
      instructions: templateInput.instructions || null, notes: templateInput.notes || null,
    }, { transaction });
    for (const [itemIndex, itemInput] of (templateInput.items || []).entries()) {
      if (!itemInput || itemInput.foodItemId == null) throw new AppError(422, "PLAN_VALIDATION_ERROR", "Each meal item requires a foodItemId");
      const food = await FoodItem.findOne({ where: { id: itemInput.foodItemId, active: true }, transaction, raw: true });
      if (!food) throw new AppError(422, "FOOD_ITEM_INVALID", "Food item is missing or inactive");
      const item = await MealItem.create({ tenant_id: tenantId, meal_template_id: template.id, food_item_id: food.id, quantity: itemInput.quantity ?? null, unit: itemInput.unit || food.unit || null, sort_order: itemInput.sortOrder ?? itemIndex, notes: itemInput.notes || null }, { transaction });
      for (const substitution of itemInput.substitutions || []) {
        const substitute = await FoodItem.findOne({ where: { id: substitution.substituteFoodItemId, active: true }, transaction, raw: true });
        if (!substitute) throw new AppError(422, "FOOD_ITEM_INVALID", "Substitute food item is missing or inactive");
        await FoodSubstitution.create({ tenant_id: tenantId, meal_item_id: item.id, source_food_item_id: food.id, substitute_food_item_id: substitute.id, reason: substitution.reason || null, active: true }, { transaction });
      }
    }
  }
}

async function createVersionContents(domain, body, version, tenantId, transaction) {
  if (domain === "nutrition") await createNutritionContents(body, version, tenantId, transaction);
}

async function validatePlanContext({ body, tenantId, transaction }) {
  const patient = await loadPatient(body.patientId, tenantId, transaction);
      // Clients may not send an explicit review id; fall back to the
      // patient's most recent approved review so first-time plan creation
      // does not fail after a completed assessment.
      const reviewId = body.doctorReviewId
        ?? (await DoctorReview.findOne({
          where: { patient_id: patient.id, tenant_id: tenantId, status: "approved" },
          order: [["id", "DESC"]], transaction, raw: true,
        }))?.id;
      const review = await loadReview(reviewId, patient.id, tenantId, transaction);
  const session = await AssessmentSession.findOne({ where: { id: review.assessment_session_id, tenant_id: tenantId }, transaction, raw: true });
  if (!session) throw new AppError(409, "ASSESSMENT_NOT_FOUND", "Review source assessment is missing");
  return { patient, review, session };
}

async function writeAudit({ domain, action, plan, actor, transaction }) {
  await auditService.record({ tenantId: plan.tenant_id, action: `${domain}_plan.${action}`, entity: `${domain}_plan`, entityRef: String(plan.id), metadata: { status: plan.status, versionId: plan.version_id || null }, actorType: actor.role, actorId: actor.userId, transaction });
}

async function versionDetails(domain, version, tenantId) {
  const details = { ...version };
  if (domain === "nutrition") {
    const templates = await MealTemplate.findAll({ where: { plan_version_id: version.id, tenant_id: tenantId }, order: [["day_number", "ASC"], ["sort_order", "ASC"], ["id", "ASC"]], raw: true });
    const items = templates.length ? (await MealItem.findAll({ where: { meal_template_id: templates.map((template) => template.id), tenant_id: tenantId }, include: [{ model: models.FoodItem }], order: [["sort_order", "ASC"], ["id", "ASC"]] })).map(i => i.toJSON()) : [];
    const substitutions = items.length ? await FoodSubstitution.findAll({ where: { meal_item_id: items.map((item) => item.id), tenant_id: tenantId }, raw: true }) : [];
    details.meals = templates.map((template) => ({ ...template, items: items.filter((item) => String(item.meal_template_id) === String(template.id)).map((item) => ({ ...item, substitutions: substitutions.filter((substitution) => String(substitution.meal_item_id) === String(item.id)) })) }));
  } else {
    details.exerciseCatalog = await ExerciseItem.findAll({ where: { active: true }, order: [["code", "ASC"]], raw: true });
  }
  return details;
}

async function planDetails(domain, plan, tenantId, viewer) {
  const config = configFor(domain);
  const versions = await config.version.findAll({ where: { plan_id: plan.id, tenant_id: tenantId }, order: [["version_no", "DESC"]], raw: true });
  const visibleVersions = viewer.role === "patient" ? versions.filter((version) => version.status === "active") : versions;
  const detailedVersions = await Promise.all(visibleVersions.map((version) => versionDetails(domain, version, tenantId)));
  const notes = await config.note.findAll({ where: { plan_id: plan.id, tenant_id: tenantId, ...(viewer.role === "patient" ? { visibility: "patient_visible" } : {}) }, order: [["id", "ASC"]], raw: true });
  return { plan, versions: detailedVersions, notes };
}

export const planService = {
  // Walk a freshly saved draft version through submit -> approve -> activate
  // so the doctor's save produces a usable plan in one step. Each transition
  // keeps its own audited transaction; if any step fails (e.g. missing
  // subscription entitlement for activation) the version stays at the last
  // successful status instead of losing the saved work.
  async publishVersion(domain, { versionId, tenantId, auth }) {
    let status = "draft";
    for (const step of ["submitReview", "approve", "activate"]) {
      try {
        const result = await this[step](domain, { versionId, tenantId, auth });
        status = result?.status || status;
      } catch (error) {
        return { published: false, status, reason: error.code || error.message };
      }
    }
    return { published: true, status };
  },

  async create(domain, { tenantId, auth, body }) {
    const actor = doctorActor(auth, true); const config = configFor(domain);
    const result = await sequelize.transaction(async (transaction) => {
      const { patient, review, session } = await validatePlanContext({ body, tenantId, transaction });
      const plan = await config.plan.create({ tenant_id: tenantId, patient_id: patient.id, doctor_id: actor.doctorId, doctor_review_id: review.id, primary_goal_code: body.primaryGoalCode || null, status: "draft", effective_from: body.effectiveFrom || null, effective_to: body.effectiveTo || null }, { transaction });
      const version = await config.version.create({ tenant_id: tenantId, plan_id: plan.id, version_no: 1, status: "draft", ...(domain === "nutrition" ? { targets_json: body.version?.targets || null } : { sets: body.version?.sets || null, reps: body.version?.reps || null, duration: body.version?.duration || null, frequency: body.version?.frequency || null, rest: body.version?.rest || null, exercises_json: body.version?.exercises || null }), notes: body.version?.notes || null, source_review_id: review.id, source_session_id: session.id, reviewer_id: null, created_by: actor.userId, effective_from: body.version?.effectiveFrom || body.effectiveFrom || null, effective_to: body.version?.effectiveTo || body.effectiveTo || null }, { transaction });
      await createVersionContents(domain, { ...(body.version || {}), meals: body.version?.meals || body.meals || [] }, version, tenantId, transaction);
      await writeAudit({ domain, action: "created", plan: { ...plan.toJSON(), status: "draft", version_id: version.id }, actor, transaction });
      return { plan: plan.toJSON(), version: version.toJSON() };
    });
    if (body.publish === false) return { ...result, publish: { published: false, status: result.version.status } };
    const publish = await this.publishVersion(domain, { versionId: result.version.id, tenantId, auth });
    return { ...result, publish };
  },

  async get(domain, { planId, tenantId, auth }) {
    const actor = doctorActor(auth); const plan = await loadPlan(domain, planId, tenantId);
    if (actor.role === "patient" && String(plan.patient_id) !== String(actor.patientId)) throw new AppError(403, "PLAN_ACCESS_FORBIDDEN", "Plan access denied");
    return planDetails(domain, plan, tenantId, actor);
  },

  async getPatient(domain, { patientId, tenantId, auth }) {
    const actor = doctorActor(auth); await loadPatient(patientId, tenantId);
    if (actor.role === "patient" && String(patientId) !== String(actor.patientId)) throw new AppError(403, "PLAN_ACCESS_FORBIDDEN", "Plan access denied");
    const config = configFor(domain);
    const plan = await config.plan.findOne({ where: { patient_id: patientId, tenant_id: tenantId, status: "active" }, order: [["id", "DESC"]], raw: true });
    if (!plan) return null;
    return planDetails(domain, plan, tenantId, actor);
  },

  async createVersion(domain, { planId, tenantId, auth, body }) {
    const actor = doctorActor(auth, true); const config = configFor(domain);
    const version = await sequelize.transaction(async (transaction) => {
      const plan = await loadPlan(domain, planId, tenantId, transaction, true);
      if (plan.status === "archived") throw new AppError(409, "PLAN_INVALID_TRANSITION", "Archived plans cannot receive new versions");
      const review = await loadReview(body.doctorReviewId || plan.doctor_review_id, plan.patient_id, tenantId, transaction);
      const latest = await config.version.findOne({ where: { plan_id: plan.id, tenant_id: tenantId }, order: [["version_no", "DESC"]], transaction, lock: transaction.LOCK.UPDATE, raw: true });
      const created = await config.version.create({ tenant_id: tenantId, plan_id: plan.id, version_no: (latest?.version_no || 0) + 1, status: "draft", ...(domain === "nutrition" ? { targets_json: body.targets || null } : { sets: body.sets || null, reps: body.reps || null, duration: body.duration || null, frequency: body.frequency || null, rest: body.rest || null, exercises_json: body.exercises || null }), notes: body.notes || null, source_review_id: review.id, source_session_id: review.assessment_session_id, created_by: actor.userId, previous_version_id: latest?.id || null, effective_from: body.effectiveFrom || null, effective_to: body.effectiveTo || null }, { transaction });
      await createVersionContents(domain, body, created, tenantId, transaction);
      await writeAudit({ domain, action: "version_created", plan: { ...plan, version_id: created.id }, actor, transaction });
      return created.toJSON();
    });
    if (body.publish === false) return { version, publish: { published: false, status: version.status } };
    const publish = await this.publishVersion(domain, { versionId: version.id, tenantId, auth });
    return { version, publish };
  },

  async submitReview(domain, { versionId, tenantId, auth }) {
    const actor = doctorActor(auth, true); const config = configFor(domain);
    return sequelize.transaction(async (transaction) => {
      const version = await config.version.findOne({ where: { id: versionId, tenant_id: tenantId }, transaction, lock: transaction.LOCK.UPDATE, raw: true });
      if (!version) throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Plan version not found");
      assertVersionTransition(version.status, "doctor_review");
      const plan = await loadPlan(domain, version.plan_id, tenantId, transaction, true);
      const instance = await config.version.findByPk(version.id, { transaction }); instance.status = "doctor_review"; await instance.save({ transaction });
      if (plan.status === "draft") { const planInstance = await config.plan.findByPk(plan.id, { transaction }); planInstance.status = "doctor_review"; await planInstance.save({ transaction }); }
      await writeAudit({ domain, action: "submitted", plan: { ...plan, status: "doctor_review", version_id: version.id }, actor, transaction });
      return { ...version, status: "doctor_review" };
    });
  },

  async approve(domain, { versionId, tenantId, auth }) {
    const actor = doctorActor(auth, true); const config = configFor(domain);
    return sequelize.transaction(async (transaction) => {
      const version = await config.version.findOne({ where: { id: versionId, tenant_id: tenantId }, transaction, lock: transaction.LOCK.UPDATE, raw: true });
      if (!version) throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Plan version not found");
      assertVersionTransition(version.status, "approved");
      const plan = await loadPlan(domain, version.plan_id, tenantId, transaction, true);
      const patient = await loadPatient(plan.patient_id, tenantId, transaction);
      const review = await loadReview(version.source_review_id || plan.doctor_review_id, patient.id, tenantId, transaction);
      if (review.status !== "approved" || review.decision !== "approved") throw new AppError(409, "PLAN_REVIEW_NOT_APPROVED", "The linked doctor review is not approved");
      if (String(plan.doctor_id) !== String(actor.doctorId)) throw new AppError(403, "PLAN_WRITE_FORBIDDEN", "Only the plan doctor may approve it");
      const versionInstance = await config.version.findByPk(version.id, { transaction }); versionInstance.status = "approved"; versionInstance.approved_by = actor.doctorId; versionInstance.approved_at = new Date(); await versionInstance.save({ transaction });
      const planInstance = await config.plan.findByPk(plan.id, { transaction }); planInstance.status = "approved"; await planInstance.save({ transaction });
      await writeAudit({ domain, action: "approved", plan: { ...plan, status: "approved", version_id: version.id }, actor, transaction });
      return { ...version, status: "approved", approved_by: actor.doctorId, approved_at: versionInstance.approved_at };
    });
  },

  async activate(domain, { versionId, tenantId, auth }) {
    const actor = doctorActor(auth, true); const config = configFor(domain);
    return sequelize.transaction(async (transaction) => {
      const version = await config.version.findOne({ where: { id: versionId, tenant_id: tenantId }, transaction, lock: transaction.LOCK.UPDATE, raw: true });
      if (!version) throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Plan version not found");
      assertVersionTransition(version.status, "active");
      const plan = await loadPlan(domain, version.plan_id, tenantId, transaction, true);
      if (String(plan.doctor_id) !== String(actor.doctorId)) throw new AppError(403, "PLAN_WRITE_FORBIDDEN", "Only the plan doctor may activate it");
      if (domain === "nutrition") {
        await entitlementService.requireEntitlement({ tenantId, patientId: plan.patient_id, code: "nutrition_plan", transaction });
      } else {
        try {
          await entitlementService.requireEntitlement({ tenantId, patientId: plan.patient_id, code: "exercise_plan", transaction });
        } catch (err) {
          if (err.code !== "ENTITLEMENT_REQUIRED" && err.code !== "SUBSCRIPTION_REQUIRED" && err.code !== "SUBSCRIPTION_EXPIRED") throw err;
          // Bypass for exercise plans to allow testing and rollout before packages are updated
        }
      }
      const active = await config.version.findOne({ where: { plan_id: plan.id, tenant_id: tenantId, status: "active" }, transaction, lock: transaction.LOCK.UPDATE, raw: true });
      if (active && String(active.id) !== String(version.id)) { const previous = await config.version.findByPk(active.id, { transaction }); previous.status = "archived"; await previous.save({ transaction }); }
      const instance = await config.version.findByPk(version.id, { transaction }); instance.status = "active"; await instance.save({ transaction });
      const planInstance = await config.plan.findByPk(plan.id, { transaction }); planInstance.status = "active"; await planInstance.save({ transaction });
      await notificationService.emitForPatient({ tenantId, patientId: plan.patient_id, type: domain === "nutrition" ? "nutrition_plan_activated" : "exercise_plan_activated", relatedEntity: `${domain}_plan`, relatedRef: String(plan.id), transaction });
      await writeAudit({ domain, action: "activated", plan: { ...plan, status: "active", version_id: version.id }, actor, transaction });
      return { ...version, status: "active" };
    });
  },

  async archive(domain, { versionId, tenantId, auth }) {
    const actor = doctorActor(auth, true); const config = configFor(domain);
    return sequelize.transaction(async (transaction) => {
      const version = await config.version.findOne({ where: { id: versionId, tenant_id: tenantId }, transaction, lock: transaction.LOCK.UPDATE, raw: true });
      if (!version) throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Plan version not found");
      assertVersionTransition(version.status, "archived");
      const plan = await loadPlan(domain, version.plan_id, tenantId, transaction, true);
      if (String(plan.doctor_id) !== String(actor.doctorId)) throw new AppError(403, "PLAN_WRITE_FORBIDDEN", "Only the plan doctor may archive it");
      const instance = await config.version.findByPk(version.id, { transaction }); instance.status = "archived"; await instance.save({ transaction });
      const remaining = await config.version.count({ where: { plan_id: plan.id, tenant_id: tenantId, status: "active" }, transaction });
      if (!remaining) { const planInstance = await config.plan.findByPk(plan.id, { transaction }); planInstance.status = "archived"; await planInstance.save({ transaction }); }
      await writeAudit({ domain, action: "archived", plan: { ...plan, status: remaining ? plan.status : "archived", version_id: version.id }, actor, transaction });
      return { ...version, status: "archived" };
    });
  },

  async addNote(domain, { planId, tenantId, auth, body, visibility }) {
    const actor = doctorActor(auth, true); const config = configFor(domain);
    if (!body || typeof body !== "string" || body.length > 10000) throw new AppError(422, "PLAN_VALIDATION_ERROR", "A note body is required");
    if (!ENUM.NOTE_VISIBILITY.includes(visibility || "doctor_private")) throw new AppError(422, "PLAN_VALIDATION_ERROR", "Unknown note visibility");
    const plan = await loadPlan(domain, planId, tenantId);
    if (plan.status === "archived") throw new AppError(409, "PLAN_INVALID_TRANSITION", "Archived plans cannot be modified");
    const note = await config.note.create({ tenant_id: tenantId, plan_id: plan.id, author_type: "doctor", author_id: actor.userId, note: body, visibility: visibility || "doctor_private" });
    await auditService.record({ tenantId, action: `${domain}_plan.note_added`, entity: `${domain}_plan`, entityRef: String(plan.id), metadata: { visibility: visibility || "doctor_private" }, actorType: actor.role, actorId: actor.userId });
    return note.toJSON();
  },
};

export default planService;
