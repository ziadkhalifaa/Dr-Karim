import { models, sequelize } from "../models/index.js";
import { ENUM } from "../config/constants.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";
import { notificationService } from "./notification.service.js";

const {
  DoctorReview, DoctorReviewEvent, DoctorReviewNote, AssessmentSession,
  AssessmentAnswer, AssessmentSnapshot, AssessmentDefinition, QuestionVersionCfg,
  QuestionCatalog, AssessmentFlag, FlagRuleVersion, Patient, PatientSession,
  PatientCondition, PatientAllergy, PatientMedication, PatientMeasurement,
  PatientLabValue, PatientPregnancyRecord, PatientGoalHistory, Doctor,
} = models;

const REVIEW_STATUSES = new Set(ENUM.REVIEW_STATUS);
const TRANSITIONS = {
  queued: ["assigned"],
  assigned: ["in_review"],
  in_review: ["needs_clarification", "approved", "rejected"],
  needs_clarification: ["in_review"],
  approved: [],
  rejected: [],
};

const PROFILE_DOMAINS = {
  conditions: { model: PatientCondition, fields: ["conditionCode", "notes"] },
  allergies: { model: PatientAllergy, fields: ["allergen", "reactionCode", "severityCode", "notes"] },
  medications: { model: PatientMedication, fields: ["medicationName", "dose", "reason", "activeTo", "notes"] },
  measurements: { model: PatientMeasurement, fields: ["measureCode", "value", "unit", "measuredBy", "measuredOn"] },
  labValues: { model: PatientLabValue, fields: ["labCode", "value", "unit", "measuredOn"] },
  pregnancyRecords: { model: PatientPregnancyRecord, fields: ["startedOn", "endedOn"] },
  goals: { model: PatientGoalHistory, fields: ["goalCode", "notes"] },
};

function actorFrom(auth) {
  const role = auth?.membership?.role;
  if (!auth || !["doctor", "staff"].includes(role)) {
    throw new AppError(403, "ROLE_FORBIDDEN", "Doctor or staff authorization required");
  }
  return { role, id: String(auth.user.id), doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null };
}

function reviewError(status, message, details) {
  return new AppError(status, "REVIEW_WORKFLOW_ERROR", message, details);
}

async function loadReview(reviewId, tenantId, transaction, lock = false) {
  const review = await DoctorReview.findOne({
    where: { id: reviewId, tenant_id: tenantId },
    transaction,
    lock: lock ? transaction.LOCK.UPDATE : undefined,
    raw: true,
  });
  if (!review) throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found");
  return review;
}

function assertTransition(from, to) {
  if (!REVIEW_STATUSES.has(to) || !TRANSITIONS[from]?.includes(to)) {
    throw reviewError(409, `Cannot transition review from ${from} to ${to}`);
  }
}

async function addEvent({ review, from, to, actor, note, transaction }) {
  return DoctorReviewEvent.create({
    tenant_id: review.tenant_id,
    review_id: review.id,
    from_status: from,
    to_status: to,
    actor_type: actor.role,
    actor_id: actor.id,
    note: note || null,
  }, { transaction });
}

async function transition(reviewId, tenantId, actor, to, note, transaction) {
  const review = await loadReview(reviewId, tenantId, transaction, true);
  assertTransition(review.status, to);
  const now = new Date();
  const values = { status: to };
  if (to === "assigned") values.assigned_at = now;
  if (to === "in_review") values.opened_at = review.opened_at || now;
  if (["approved", "rejected"].includes(to)) {
    values.decided_at = now;
    values.decision = to;
  }
  await DoctorReview.update(values, { where: { id: review.id, status: review.status }, transaction });
  await addEvent({ review, from: review.status, to, actor, note, transaction });
  await auditService.record({
    tenantId, action: `review.${to}`, entity: "doctor_review", entityRef: String(review.id),
    metadata: { fromStatus: review.status, toStatus: to }, actorType: actor.role, actorId: actor.id, transaction,
  });
  const notificationType = { approved: "review_approved", rejected: "review_rejected", needs_clarification: "review_needs_clarification" }[to]; if (notificationType && review.patient_id) await notificationService.emitForPatient({ tenantId, patientId: review.patient_id, type: notificationType, relatedEntity: "doctor_review", relatedRef: String(review.id), transaction });
  return { ...review, ...values };
}

async function ensureAssignedDoctor(review, actor, doctorId, transaction) {
  const requested = doctorId == null ? actor.doctorId : String(doctorId);
  if (!requested) throw reviewError(422, "A doctor must be selected for assignment");
  if (actor.role === "doctor" && requested !== actor.doctorId) throw new AppError(403, "REVIEW_ASSIGNMENT_FORBIDDEN", "Doctors may only assign reviews to themselves");
  const doctor = await Doctor.findOne({ where: { id: requested, tenant_id: review.tenant_id, active: true, deleted_at: null }, transaction, raw: true });
  if (!doctor) throw new AppError(403, "REVIEW_ASSIGNMENT_FORBIDDEN", "Doctor is not active in this tenant");
  return requested;
}

async function promoteProfile(review, payload, actor, transaction) {
  if (actor.role !== "doctor") throw new AppError(403, "PROFILE_CONFIRMATION_FORBIDDEN", "Only a doctor can confirm profile data");
  const session = await AssessmentSession.findByPk(review.assessment_session_id, { transaction, raw: true });
  if (!session) throw new AppError(404, "ASSESSMENT_NOT_FOUND", "Assessment session not found");
  let patientId = review.patient_id;
  if (!patientId) {
    const patient = await Patient.create({
      tenant_id: review.tenant_id,
      full_name: session.patient_name || session.contact_patient_name || "Unnamed patient",
      dob: session.patient_dob,
      age_years: session.patient_age_years,
      age_months: session.patient_age_months,
      sex: session.patient_sex,
      email: session.contact_email,
      phone_canonical: session.patient_phone_canonical || session.handoff_phone_canonical,
      phone_display: session.patient_phone_display || session.handoff_phone_display,
      status: "active",
      source_session_id: session.id,
      confirmed_by: actor.doctorId,
    }, { transaction });
    patientId = patient.id;
    await DoctorReview.update({ patient_id: patientId }, { where: { id: review.id }, transaction });
    await PatientSession.create({ tenant_id: review.tenant_id, patient_id: patientId, assessment_session_id: session.id }, { transaction });
  }

  const now = new Date();
  const domains = payload && typeof payload === "object" ? payload : {};
  for (const [domain, config] of Object.entries(PROFILE_DOMAINS)) {
    const entries = domains[domain];
    if (entries == null) continue;
    if (!Array.isArray(entries)) throw reviewError(422, `${domain} must be an array`);
    if (entries.length === 0) continue;
    await config.model.update({ is_current: false }, { where: { tenant_id: review.tenant_id, patient_id: patientId, is_current: true }, transaction });
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") throw reviewError(422, `Invalid ${domain} entry`);
      const row = { tenant_id: review.tenant_id, patient_id: patientId, basis: "doctor_confirmed", confirmed_by: actor.doctorId, confirmed_at: now, source_session_id: session.id };
      for (const field of config.fields) {
        const column = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        if (entry[field] !== undefined) row[column] = entry[field];
      }
      await config.model.create(row, { transaction });
    }
  }
  return patientId;
}

async function context(review, tenantId) {
  const session = await AssessmentSession.findOne({ where: { id: review.assessment_session_id, tenant_id: tenantId }, raw: true });
  if (!session) throw new AppError(404, "ASSESSMENT_NOT_FOUND", "Assessment session not found");
  const [answers, snapshot, definition, questionConfig, flags, flagRuleVersion, patient, events, notes] = await Promise.all([
    AssessmentAnswer.findAll({ where: { session_id: session.id }, order: [["id", "ASC"]], raw: true }),
    AssessmentSnapshot.findOne({ where: { session_id: session.id }, raw: true }),
    AssessmentDefinition.findByPk(session.assessment_definition_id, { raw: true }),
    QuestionVersionCfg.findAll({ where: { definition_id: session.assessment_definition_id }, include: [{ model: QuestionCatalog, required: false }], order: [["id", "ASC"]], raw: true, nest: true }),
    AssessmentFlag.findAll({ where: { session_id: session.id }, order: [["tier", "DESC"], ["id", "ASC"]], raw: true }),
    session.flag_rule_version_id ? FlagRuleVersion.findByPk(session.flag_rule_version_id, { raw: true }) : null,
    review.patient_id ? Patient.findOne({ where: { id: review.patient_id, tenant_id: tenantId }, raw: true }) : null,
    DoctorReviewEvent.findAll({ where: { review_id: review.id, tenant_id: tenantId }, order: [["id", "ASC"]], raw: true }),
    DoctorReviewNote.findAll({ where: { review_id: review.id, tenant_id: tenantId }, order: [["id", "ASC"]], raw: true }),
  ]);
  const history = patient ? await loadProfile(patient.id, tenantId) : emptyProfile();
  return {
    review: { id: String(review.id), tenantId: String(review.tenant_id), status: review.status, doctorId: review.doctor_id ? String(review.doctor_id) : null, assignedAt: review.assigned_at, openedAt: review.opened_at, decidedAt: review.decided_at, decision: review.decision },
    patientIdentity: patient || { full_name: session.patient_name, dob: session.patient_dob, age_years: session.patient_age_years, age_months: session.patient_age_months, sex: session.patient_sex },
    contact: { patientName: session.contact_patient_name, personName: session.contact_person_name, relationship: session.contact_relationship_code, handoffPhone: session.handoff_phone_display, patientPhone: session.patient_phone_display, preference: session.contact_preference, email: session.contact_email, bestTime: session.contact_best_time, consentContact: session.consent_contact },
    assessment: { session, answers, snapshot, definition, questionConfig, flags, flagRuleVersion },
    derived: { bmi: session.derived_bmi, overallTier: session.overall_tier, urgentFlags: flags.filter((flag) => flag.tier === "urgent") },
    profile: history,
    events,
    notes,
  };
}

async function loadProfile(patientId, tenantId) {
  const where = { patient_id: patientId, tenant_id: tenantId, is_current: true };
  const [conditions, allergies, medications, measurements, labValues, pregnancyRecords, goals] = await Promise.all([
    PatientCondition.findAll({ where, raw: true }), PatientAllergy.findAll({ where, raw: true }), PatientMedication.findAll({ where, raw: true }), PatientMeasurement.findAll({ where, raw: true }), PatientLabValue.findAll({ where, raw: true }), PatientPregnancyRecord.findAll({ where, raw: true }), PatientGoalHistory.findAll({ where, raw: true }),
  ]);
  return { conditions, allergies, medications, measurements, labValues, pregnancyRecords, goals };
}

function emptyProfile() { return { conditions: [], allergies: [], medications: [], measurements: [], labValues: [], pregnancyRecords: [], goals: [] }; }

export const doctorReviewService = {
  async list({ tenantId, status, limit = 50 }) {
    const where = { tenant_id: tenantId, ...(status ? { status } : {}) };
    if (status && !REVIEW_STATUSES.has(status)) throw reviewError(422, "Unknown review status");
    const reviews = await DoctorReview.findAll({ where, include: [{ model: AssessmentSession, required: true, attributes: ["id", "reference_number", "submitted_at", "overall_tier", "patient_name", "patient_age_years"] }], order: [[sequelize.literal("CASE WHEN `assessment_session`.`overall_tier` = 'urgent' THEN 0 ELSE 1 END"), "ASC"], ["created_at", "ASC"]], limit: Math.min(Math.max(Number(limit) || 50, 1), 100) });
    return reviews.map((review) => ({ id: String(review.id), status: review.status, doctorId: review.doctor_id ? String(review.doctor_id) : null, assignedAt: review.assigned_at, submittedAt: review.assessment_session?.submitted_at, referenceNumber: review.assessment_session?.reference_number, patientName: review.assessment_session?.patient_name, overallTier: review.assessment_session?.overall_tier, priority: review.assessment_session?.overall_tier === "urgent" ? "urgent" : "standard" }));
  },

  async get({ reviewId, tenantId }) { return context(await loadReview(reviewId, tenantId), tenantId); },
  async events({ reviewId, tenantId }) { const review = await loadReview(reviewId, tenantId); return DoctorReviewEvent.findAll({ where: { review_id: review.id, tenant_id: tenantId }, order: [["id", "ASC"]], raw: true }); },

  async assign({ reviewId, tenantId, auth, doctorId, note }) {
    const actor = actorFrom(auth);
    return sequelize.transaction(async (transaction) => {
      const review = await loadReview(reviewId, tenantId, transaction, true);
      const assignedDoctorId = await ensureAssignedDoctor(review, actor, doctorId, transaction);
      const transitioned = await transition(reviewId, tenantId, actor, "assigned", note, transaction);
      await DoctorReview.update({ doctor_id: assignedDoctorId }, { where: { id: review.id }, transaction });
      return { ...transitioned, doctor_id: assignedDoctorId };
    });
  },

  async open({ reviewId, tenantId, auth }) { const actor = actorFrom(auth); return sequelize.transaction((transaction) => transition(reviewId, tenantId, actor, "in_review", null, transaction)); },
  async clarify({ reviewId, tenantId, auth, note }) { const actor = actorFrom(auth); if (!note) throw reviewError(422, "Clarification details are required"); return sequelize.transaction((transaction) => transition(reviewId, tenantId, actor, "needs_clarification", note, transaction)); },

  async approve({ reviewId, tenantId, auth, note, profile }) {
    const actor = actorFrom(auth);
    if (actor.role !== "doctor") throw new AppError(403, "PROFILE_CONFIRMATION_FORBIDDEN", "Only a doctor can approve and confirm a review");
    return sequelize.transaction(async (transaction) => {
      const review = await loadReview(reviewId, tenantId, transaction, true);
      const patientId = await promoteProfile(review, profile, actor, transaction);
      const result = await transition(reviewId, tenantId, actor, "approved", note, transaction);
      return { ...result, patient_id: patientId };
    });
  },

  async reject({ reviewId, tenantId, auth, reason }) { const actor = actorFrom(auth); if (!reason) throw reviewError(422, "Rejection reason is required"); return sequelize.transaction((transaction) => transition(reviewId, tenantId, actor, "rejected", reason, transaction)); },

  async addNote({ reviewId, tenantId, auth, body, visibility = "doctor_private", parentNoteId = null, correctionReason = null }) {
    const actor = actorFrom(auth);
    if (!body || typeof body !== "string" || body.length > 10000) throw reviewError(422, "A note body of 1–10000 characters is required");
    if (!ENUM.NOTE_VISIBILITY.includes(visibility)) throw reviewError(422, "Unknown note visibility");
    return sequelize.transaction(async (transaction) => {
      const review = await loadReview(reviewId, tenantId, transaction, true);
      if (["approved", "rejected"].includes(review.status)) throw reviewError(409, "Closed reviews cannot be modified");
      if (parentNoteId) {
        const parent = await DoctorReviewNote.findOne({ where: { id: parentNoteId, review_id: review.id, tenant_id: tenantId }, transaction, raw: true });
        if (!parent) throw new AppError(404, "REVIEW_NOTE_NOT_FOUND", "Parent review note not found");
      }
      const note = await DoctorReviewNote.create({ tenant_id: tenantId, review_id: review.id, parent_note_id: parentNoteId, author_type: actor.role, author_id: actor.id, visibility, body, correction_reason: correctionReason }, { transaction });
      await addEvent({ review, from: review.status, to: review.status, actor, note: correctionReason ? "review note correction recorded" : "review note added", transaction });
      return note.toJSON();
    });
  },
};

export default doctorReviewService;
