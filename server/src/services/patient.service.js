// Phase 6D patient directory + aggregates.
// Backs the doctor patient list (search/filter/sort/paginate), the patient
// profile aggregate, and the state-driven patient dashboard. Internal DB ids
// are only ever returned to the consuming UI; they are never typed by a user.

import { Op } from "sequelize";
import { models } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";

const {
  Patient, DoctorReview, PatientSession,
  PatientCondition, PatientAllergy, PatientMedication, PatientMeasurement,
  PatientLabValue, PatientPregnancyRecord, PatientGoalHistory,
  Subscription, SubscriptionEntitlement, Payment, Package,
  CareProgram, NutritionPlan, ExercisePlan, Appointment,
  NutritionPlanVersion, ExercisePlanVersion,
  PatientProgress, ProgressMeasurement,
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

async function requirePatientInTenant(patientId, tenantId) {
  const patient = await Patient.findOne({ where: { id: patientId, tenant_id: tenantId }, raw: true });
  if (!patient) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found in this tenant");
  return patient;
}

function escapeLike(value) {
  return String(value || "").replace(/[\\%_]/gu, (m) => `\\${m}`);
}

async function loadProfile(patientId, tenantId) {
  const where = { patient_id: patientId, tenant_id: tenantId, is_current: true };
  const [conditions, allergies, medications, measurements, labValues, pregnancyRecords, goals] = await Promise.all([
    PatientCondition.findAll({ where, raw: true }), PatientAllergy.findAll({ where, raw: true }),
    PatientMedication.findAll({ where, raw: true }), PatientMeasurement.findAll({ where, raw: true }),
    PatientLabValue.findAll({ where, raw: true }), PatientPregnancyRecord.findAll({ where, raw: true }),
    PatientGoalHistory.findAll({ where, raw: true }),
  ]);
  return { conditions, allergies, medications, measurements, labValues, pregnancyRecords, goals };
}

async function activeSubscription(patientId, tenantId) {
  return Subscription.findOne({
    where: {
      patient_id: patientId, tenant_id: tenantId, status: "active",
      [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gt]: new Date() } }],
    },
    order: [["id", "DESC"]], raw: true,
  });
}

async function subscriptionWith(tierId, patientId, tenantId) {
  const sub = await activeSubscription(patientId, tenantId);
  if (!sub) return null;
  const pack = await Package.findByPk(sub.package_id, { raw: true });
  const entitlements = await SubscriptionEntitlement.findAll({ where: { subscription_id: sub.id, tenant_id: tenantId }, raw: true });
  return { subscription: { id: String(sub.id), status: sub.status, startsAt: sub.starts_at, endsAt: sub.ends_at, package: pack ? { id: String(pack.id), name: pack.name, slug: pack.slug } : null, entitlements: entitlements.map((e) => ({ code: e.code, allowed: e.allowed, limit: e.limit_value, used: e.used_value })) } };
}

async function recentPayments(patientId, tenantId, limit = 5) {
  const rows = await Payment.findAll({ where: { patient_id: patientId, tenant_id: tenantId }, order: [["id", "DESC"]], limit, raw: true });
  return rows.map((row) => ({ id: String(row.id), status: row.status, method: row.method, amount: String(row.amount), currency: row.currency, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at }));
}

async function activeProgramSummary(patientId, tenantId) {
  const program = await CareProgram.findOne({
    where: { patient_id: patientId, tenant_id: tenantId, deleted_at: null, status: { [Op.in]: ["draft", "scheduled", "active", "paused"] } },
    order: [["id", "DESC"]], raw: true,
  });
  if (!program) return null;
  return { id: String(program.id), status: program.status, startDate: program.start_date, endDate: program.end_date };
}

async function activePlansSummary(patientId, tenantId) {
  const [nutrition, exercise] = await Promise.all([
    NutritionPlan.findOne({ where: { patient_id: patientId, tenant_id: tenantId, status: "active" }, order: [["id", "DESC"]], raw: true }),
    ExercisePlan.findOne({ where: { patient_id: patientId, tenant_id: tenantId, status: "active" }, order: [["id", "DESC"]], raw: true }),
  ]);
  return {
    nutrition: nutrition ? { id: String(nutrition.id), status: nutrition.status, primaryGoalCode: nutrition.primary_goal_code } : null,
    exercise: exercise ? { id: String(exercise.id), status: exercise.status, primaryGoalCode: exercise.primary_goal_code } : null,
  };
}

async function upcomingAppointments(patientId, tenantId, limit = 3) {
  const rows = await Appointment.findAll({
    where: { patient_id: patientId, tenant_id: tenantId, deleted_at: null, scheduled_start_at: { [Op.gte]: new Date() }, status: { [Op.in]: ["pending", "confirmed"] } },
    order: [["scheduled_start_at", "ASC"]], limit, raw: true,
  });
  return rows.map((row) => ({ id: String(row.id), type: row.type, status: row.status, scheduledStartAt: row.scheduled_start_at }));
}

async function progressSummary(patientId, tenantId) {
  const ctx = await PatientProgress.findOne({ where: { patient_id: patientId, tenant_id: tenantId }, raw: true });
  const measurements = await ProgressMeasurement.findAll({
    where: { patient_id: patientId, tenant_id: tenantId },
    order: [["recorded_at", "DESC"]], raw: true,
  });
  const latestByType = new Map();
  for (const m of measurements) if (!latestByType.has(m.measurement_type)) latestByType.set(m.measurement_type, m);
  const items = [...latestByType.values()].map((m) => ({ type: m.measurement_type, value: Number(m.value), unit: m.unit, measuredOn: m.measured_on }));
  return {
    cadence: ctx?.cadence || null,
    nextDueDate: ctx?.next_due_date || null,
    latest: items,
    measuredTypes: [...latestByType.keys()],
  };
}

async function latestReview(patientId, tenantId) {
  const review = await DoctorReview.findAll({
    where: { patient_id: patientId, tenant_id: tenantId },
    order: [["id", "DESC"]], limit: 1, raw: true,
  });
  return review[0] ? { status: review[0].status, decision: review[0].decision, decidedAt: review[0].decided_at } : null;
}

async function hasAssessment(patient, tenantId) {
  const [viaLink, viaReview] = await Promise.all([
    PatientSession.findOne({ where: { patient_id: patient.id, tenant_id: tenantId }, attributes: ["id"], raw: true }),
    DoctorReview.findOne({ where: { patient_id: patient.id, tenant_id: tenantId, status: "approved" }, attributes: ["id"], raw: true }),
  ]);
  return Boolean(patient.source_session_id || viaLink || viaReview);
}

export const patientService = {
  async list({ tenantId, auth, query = {} }) {
    const current = actor(auth);
    if (!["doctor", "staff"].includes(current.role)) throw new AppError(403, "PATIENT_LIST_FORBIDDEN", "Only doctor or staff may list patients");

    const where = { tenant_id: tenantId };
    const status = Array.isArray(query.status) ? query.status.filter(Boolean) : (query.status ? [query.status] : []);
    if (status.length) where.status = { [Op.in]: status };
    if (query.q && String(query.q).trim()) {
      const like = { [Op.like]: `%${escapeLike(query.q)}%` };
      where[Op.or] = [{ full_name: like }, { phone_canonical: like }, { phone_display: like }];
    }

    const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
    const page = Math.max(Number(query.page) || 1, 1);
    const offset = (page - 1) * limit;
    const order = query.sort === "name" ? [["full_name", "ASC"]] : query.sort === "oldest" ? [["id", "ASC"]] : [["updated_at", "DESC"]];

    const [rows, total] = await Promise.all([
      Patient.findAll({ where, order, limit, offset, raw: true }),
      Patient.count({ where }),
    ]);
    const ids = rows.map((row) => row.id);

    const [subscriptions, pendingPayments] = await Promise.all([
      ids.length ? Subscription.findAll({ where: { tenant_id: tenantId, patient_id: { [Op.in]: ids } }, order: [["id", "DESC"]], raw: true }) : [],
      ids.length ? Payment.findAll({ where: { tenant_id: tenantId, patient_id: { [Op.in]: ids }, status: "pending" }, attributes: ["patient_id"], raw: true }) : [],
    ]);
    const latestSub = new Map();
    for (const sub of subscriptions) if (!latestSub.has(String(sub.patient_id))) latestSub.set(String(sub.patient_id), sub.status);
    const pendingSet = new Set(pendingPayments.map((row) => String(row.patient_id)));

    await auditService.record({ tenantId, action: "patient.list", entity: "patient", entityRef: "directory", metadata: { count: rows.length, status: status.length ? status : null }, actorType: current.role, actorId: current.userId });

    return {
      items: rows.map((row) => ({
        id: String(row.id),
        fullName: row.full_name,
        sex: row.sex,
        ageYears: row.age_years,
        phoneDisplay: row.phone_display,
        email: row.email,
        status: row.status,
        subscriptionStatus: latestSub.get(String(row.id)) || null,
        hasPendingPayment: pendingSet.has(String(row.id)),
        createdAt: row.created_at,
      })),
      pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async get({ tenantId, auth, patientId }) {
    const current = actor(auth);
    if (current.role === "patient" && String(current.patientId) !== String(patientId)) {
      throw new AppError(403, "PATIENT_ACCESS_FORBIDDEN", "Patients may only view their own profile");
    }
    if (!["doctor", "staff", "patient"].includes(current.role)) throw new AppError(403, "PATIENT_ACCESS_FORBIDDEN", "Not allowed to read patient data");
    const patient = await requirePatientInTenant(patientId, tenantId);

    const [profile, sub, payments, program, plans, appointments, progress, review] = await Promise.all([
      loadProfile(patient.id, tenantId),
      subscriptionWith(patient.id, tenantId),
      recentPayments(patient.id, tenantId),
      activeProgramSummary(patient.id, tenantId),
      activePlansSummary(patient.id, tenantId),
      upcomingAppointments(patient.id, tenantId),
      progressSummary(patient.id, tenantId),
      latestReview(patient.id, tenantId),
    ]);

    await auditService.record({ tenantId, action: "patient.viewed", entity: "patient", entityRef: String(patient.id), actorType: current.role, actorId: current.userId });

    return {
      patient: {
        id: String(patient.id),
        fullName: patient.full_name,
        dob: patient.dob,
        ageYears: patient.age_years,
        ageMonths: patient.age_months,
        sex: patient.sex,
        email: patient.email,
        phoneDisplay: patient.phone_display,
        status: patient.status,
        createdAt: patient.created_at,
      },
      profile,
      subscription: sub?.subscription || null,
      payments,
      careProgram: program,
      plans,
      upcomingAppointments: appointments,
      progress,
      review,
    };
  },

  async planVersions({ tenantId, auth, patientId }) {
    const current = actor(auth);
    if (current.role === "patient" && String(current.patientId) !== String(patientId)) {
      throw new AppError(403, "PATIENT_ACCESS_FORBIDDEN", "Patients may only view their own profile");
    }
    if (!["doctor", "staff", "patient"].includes(current.role)) throw new AppError(403, "PATIENT_ACCESS_FORBIDDEN", "Not allowed to read patient data");
    const patient = await requirePatientInTenant(patientId, tenantId);

    const versionsFor = async (Plan, PlanVersion) => {
      const plan = await Plan.findOne({
        where: { patient_id: patient.id, tenant_id: tenantId, status: { [Op.in]: ["active", "draft"] }, deleted_at: null },
        order: [["id", "DESC"]], raw: true,
      });
      if (!plan) return [];
      const rows = await PlanVersion.findAll({
        where: { plan_id: plan.id, tenant_id: tenantId, status: { [Op.in]: ["approved", "active"] } },
        order: [["version_no", "DESC"]], raw: true,
      });
      return rows.map((v) => ({
        id: String(v.id),
        planId: String(v.plan_id),
        versionNo: v.version_no,
        status: v.status,
        effectiveFrom: v.effective_from,
        effectiveTo: v.effective_to,
        notes: v.notes || null,
      }));
    };

    const [nutrition, exercise] = await Promise.all([
      versionsFor(NutritionPlan, NutritionPlanVersion),
      versionsFor(ExercisePlan, ExercisePlanVersion),
    ]);

    await auditService.record({ tenantId, action: "patient.plan_versions_read", entity: "patient", entityRef: String(patient.id), actorType: current.role, actorId: current.userId });

    return { patientId: String(patient.id), nutrition, exercise };
  },

  async home({ tenantId, auth }) {
    const current = actor(auth);
    if (current.role !== "patient" || !current.patientId) throw new AppError(403, "PATIENT_HOME_FORBIDDEN", "Patients only");
    const patient = await requirePatientInTenant(current.patientId, tenantId);

    const [sub, entitlements, pendingPayments, pendingSubs, program, plans, progress, review, assessment] = await Promise.all([
      activeSubscription(patient.id, tenantId),
      subscriptionWith(patient.id, tenantId),
      Payment.findAll({ where: { patient_id: patient.id, tenant_id: tenantId, status: "pending" }, order: [["id", "DESC"]], raw: true }),
      Subscription.findAll({ where: { patient_id: patient.id, tenant_id: tenantId, status: "pending" }, attributes: ["id"], raw: true }),
      activeProgramSummary(patient.id, tenantId),
      activePlansSummary(patient.id, tenantId),
      progressSummary(patient.id, tenantId),
      latestReview(patient.id, tenantId),
      hasAssessment(patient, tenantId),
    ]);

    let onboardingState;
    if (patient.status === "pending_payment") {
      onboardingState = sub ? "active" : pendingPayments.length || pendingSubs.length ? "awaiting_payment_review" : "choose_package";
    } else {
      onboardingState = sub ? "active" : pendingPayments.length || pendingSubs.length ? "awaiting_payment_review" : "unsubscribed";
    }
    if (!assessment) onboardingState = patient.status === "pending_payment" ? "assessment_not_linked" : onboardingState;

    return {
      patient: {
        id: String(patient.id),
        fullName: patient.full_name,
        status: patient.status,
      },
      onboarding: {
        state: onboardingState,
        hasAssessment: assessment,
        hasActiveSubscription: Boolean(sub),
        hasPendingPayment: pendingPayments.length > 0,
        careEnabled: Boolean(program),
      },
      subscription: entitlements?.subscription || (sub ? { id: String(sub.id), package: null, entitlements: [] } : null),
      pendingPayments: pendingPayments.map((row) => ({ id: String(row.id), status: row.status, method: row.method, amount: String(row.amount), currency: row.currency, submittedAt: row.submitted_at })),
      careProgram: program,
      plans,
      progress,
      review,
    };
  },
};

export default patientService;