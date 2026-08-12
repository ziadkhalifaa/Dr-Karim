import { Op } from "sequelize";
import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";

const { Patient, PatientCheckin, PatientCheckinMeasurement, PatientCheckinAdherence, NutritionPlan, NutritionPlanVersion, ExercisePlan, ExercisePlanVersion } = models;

function actor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  return { role: auth.membership.role, userId: String(auth.user.id), doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null, patientId: auth.user.patient_id ? String(auth.user.patient_id) : null };
}

async function patientInTenant(patientId, tenantId, transaction) {
  const patient = await Patient.findOne({ where: { id: patientId, tenant_id: tenantId, status: { [Op.in]: ["active", "inactive"] } }, transaction, raw: true });
  if (!patient) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
  return patient;
}

function canRead(patientId, current) {
  if (["doctor", "staff"].includes(current.role)) return;
  if (current.role === "patient" && String(patientId) === String(current.patientId)) return;
  throw new AppError(403, "CHECKIN_ACCESS_FORBIDDEN", "Check-in access denied");
}

function numberInRange(value, min, max, code) {
  if (value == null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) throw new AppError(422, "CHECKIN_VALIDATION_ERROR", `${code} is outside the allowed numeric range`);
  return numeric;
}

async function activeContext(patientId, tenantId, transaction) {
  const nutrition = await NutritionPlan.findOne({ where: { patient_id: patientId, tenant_id: tenantId, status: "active" }, order: [["id", "DESC"]], transaction, raw: true });
  const exercise = await ExercisePlan.findOne({ where: { patient_id: patientId, tenant_id: tenantId, status: "active" }, order: [["id", "DESC"]], transaction, raw: true });
  const nutritionVersion = nutrition ? await NutritionPlanVersion.findOne({ where: { plan_id: nutrition.id, tenant_id: tenantId, status: "active" }, order: [["version_no", "DESC"]], transaction, raw: true }) : null;
  const exerciseVersion = exercise ? await ExercisePlanVersion.findOne({ where: { plan_id: exercise.id, tenant_id: tenantId, status: "active" }, order: [["version_no", "DESC"]], transaction, raw: true }) : null;
  return { nutritionVersion, exerciseVersion };
}

async function detail(checkin, tenantId, current) {
  canRead(checkin.patient_id, current);
  const [measurements, adherence] = await Promise.all([
    PatientCheckinMeasurement.findAll({ where: { checkin_id: checkin.id, tenant_id: tenantId }, order: [["id", "ASC"]], raw: true }),
    PatientCheckinAdherence.findAll({ where: { checkin_id: checkin.id, tenant_id: tenantId }, order: [["id", "ASC"]], raw: true }),
  ]);
  return { ...checkin, measurements, adherence };
}

export const checkinService = {
  async create({ tenantId, patientId, auth, body, ip }) {
    const current = actor(auth); if (current.role === "patient" && String(current.patientId) !== String(patientId)) throw new AppError(403, "CHECKIN_ACCESS_FORBIDDEN", "Patients may only create their own check-ins");
    if (!(["patient", "doctor"].includes(current.role))) throw new AppError(403, "CHECKIN_WRITE_FORBIDDEN", "Only the patient or doctor may create a check-in");
    const created = await sequelize.transaction(async (transaction) => {
      await patientInTenant(patientId, tenantId, transaction);
      const context = await activeContext(patientId, tenantId, transaction);
      const checkin = await PatientCheckin.create({
        tenant_id: tenantId, patient_id: patientId, checkin_on: body.checkinOn || new Date().toISOString().slice(0, 10),
        weight_kg: numberInRange(body.weightKg, 0.1, 500, "weightKg"),
        nutrition_adherence: numberInRange(body.nutritionAdherence, 0, 100, "nutritionAdherence"), exercise_adherence: numberInRange(body.exerciseAdherence, 0, 100, "exerciseAdherence"),
        patient_note: body.patientNote || null, status: "submitted", submitted_at: new Date(),
        context_assessment_session_id: context.nutritionVersion?.source_session_id || context.exerciseVersion?.source_session_id || null,
        context_nutrition_plan_version_id: context.nutritionVersion?.id || null, context_exercise_plan_version_id: context.exerciseVersion?.id || null,
      }, { transaction });
      for (const measurement of body.measurements || []) {
        await PatientCheckinMeasurement.create({ tenant_id: tenantId, checkin_id: checkin.id, measure_code: measurement.measureCode, value: numberInRange(measurement.value, 0.01, 1000, "measurement"), unit: measurement.unit || null, taken_by: measurement.takenBy || "patient" }, { transaction });
      }
      for (const item of body.adherence || []) {
        if (!item.dimension || !["nutrition", "exercise", "sleep", "stress"].includes(item.dimension)) throw new AppError(422, "CHECKIN_VALIDATION_ERROR", "Invalid adherence dimension");
        await PatientCheckinAdherence.create({ tenant_id: tenantId, checkin_id: checkin.id, dimension: item.dimension, scale_value: numberInRange(item.scaleValue, 0, 100, "adherence"), note: item.note || null }, { transaction });
      }
      await auditService.record({ tenantId, action: "checkin.created", entity: "patient_checkin", entityRef: String(checkin.id), metadata: { patientId: String(patientId), measurementCount: (body.measurements || []).length, adherenceCount: (body.adherence || []).length }, actorType: current.role, actorId: current.userId, ip, transaction });
      return checkin.toJSON();
    });
    return detail(created, tenantId, current);
  },
  async list({ tenantId, patientId, auth }) { const current = actor(auth); await patientInTenant(patientId, tenantId); canRead(patientId, current); const rows = await PatientCheckin.findAll({ where: { tenant_id: tenantId, patient_id: patientId }, order: [["checkin_on", "DESC"], ["id", "DESC"]], raw: true }); return Promise.all(rows.map((row) => detail(row, tenantId, current))); },
  async get({ tenantId, patientId, checkinId, auth }) { const current = actor(auth); await patientInTenant(patientId, tenantId); const checkin = await PatientCheckin.findOne({ where: { id: checkinId, patient_id: patientId, tenant_id: tenantId }, raw: true }); if (!checkin) throw new AppError(404, "CHECKIN_NOT_FOUND", "Check-in not found"); return detail(checkin, tenantId, current); },
  async review({ tenantId, checkinId, auth, doctorNote }) {
    const current = actor(auth); if (current.role !== "doctor" || !current.doctorId) throw new AppError(403, "CHECKIN_REVIEW_FORBIDDEN", "Only the assigned doctor role may review check-ins");
    const checkin = await PatientCheckin.findOne({ where: { id: checkinId, tenant_id: tenantId }, raw: true }); if (!checkin) throw new AppError(404, "CHECKIN_NOT_FOUND", "Check-in not found");
    await PatientCheckin.update({ status: "reviewed", reviewed_by: current.doctorId, reviewed_at: new Date(), doctor_note: doctorNote || null }, { where: { id: checkin.id, tenant_id: tenantId, status: "submitted" } });
    await auditService.record({ tenantId, action: "checkin.reviewed", entity: "patient_checkin", entityRef: String(checkin.id), metadata: { status: "reviewed" }, actorType: current.role, actorId: current.userId });
    return this.get({ tenantId, patientId: checkin.patient_id, checkinId, auth });
  },
};

export default checkinService;
