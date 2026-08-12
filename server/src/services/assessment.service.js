import { models } from "../models/index.js";
import { sequelize } from "../config/database.js";
import env from "../config/env.js";
import { AppError, ERROR_CODES, validationError } from "../utils/errors.js";
import { sha256Hex, canonicalJsonString } from "../utils/hash.js";
import { generateReferenceNumber } from "../utils/reference.js";
import { computeBmi } from "../utils/bmi.js";
import { definitionService } from "./definition.service.js";
import { flagService } from "./flag.service.js";
import { auditService } from "./audit.service.js";
import {
  validateAssessment,
  validateAcknowledgements,
} from "../validation/assessment.validation.js";

const {
  AssessmentSession,
  AssessmentAnswer,
  AssessmentSnapshot,
  AssessmentFlag,
  DoctorReview,
  DoctorReviewEvent,
} = models;

const REF_RETRY = 8;

export const assessmentService = {
  // Atomic submission (Phase 2 §12). All-or-nothing:
  //   session → answers → snapshot → flags → review queued → review event → audit
  async submit(payload, { tenant, ip, failureAfter = null }) {
    const tenantId = tenant?.id;
    if (!tenantId) throw new AppError(400, ERROR_CODES.TENANT_NOT_FOUND, "Tenant not resolved");

    return sequelize.transaction(async (t) => {
      const def = await definitionService.loadActive({ transaction: t });
      definitionService.checkVersion(def.version, payload?.meta?.assessmentVersion);

      const defQuestions = await definitionService.loadQuestions(def.id, { transaction: t });
      const validation = validateAssessment(payload, defQuestions);

      const { meta, subject, answers, contact, minor } = validation.normalized;

      // Duplicate-session protection (session_token unique / §17). If a session
      // with this token already exists, fail-fast rather than waiting for the
      // INSERT unique violation — produces a clean DUPLICATE_SUBMISSION.
      const existing = await AssessmentSession.findOne({
        where: { session_token: meta.sessionId, tenant_id: tenantId },
        transaction: t,
        attributes: ["id", "status", "reference_number"],
        raw: true,
      });
      if (existing) {
        throw new AppError(
          409,
          ERROR_CODES.DUPLICATE_SUBMISSION,
          "This assessment session was already submitted"
        );
      }

      // Flags are derived from the validated answers BEFORE acknowledgements
      // (§10): urgent ack required iff at least one URGENT flag fires.
      // Session id is not yet known; pass a placeholder — rows resolved below.
      const provisional = await flagService.derive(answers, tenantId, 0, t);
      const overallTier = provisional.overallTier;
      const hasUrgent = provisional.hasUrgent;

      const ackResult = validateAcknowledgements(payload.acknowledgements, hasUrgent);
      const totalErrors = [...validation.errors, ...ackResult.errors];
      if (totalErrors.length) throw validationError(totalErrors);

      // BMI (informational, never routing). Stored as derived data only.
      const bmi = computeBmi(answers.Q02_01, answers.Q02_02);

      // Reference number (server-generated, unique via retry loop on collision).
      let referenceNumber = null;
      for (let attempt = 0; attempt < REF_RETRY; attempt += 1) {
        const candidate = generateReferenceNumber();
        const clash = await AssessmentSession.findOne({
          where: { reference_number: candidate },
          transaction: t,
          attributes: ["id"],
          raw: true,
        });
        if (!clash) {
          referenceNumber = candidate;
          break;
        }
      }
      if (!referenceNumber) {
        throw new AppError(500, ERROR_CODES.INTERNAL, "Could not allocate a unique reference number");
      }

      const now = new Date();

      // 1. AssessmentSession (submitted, immutable thereafter).
      const session = await AssessmentSession.create(
        {
          tenant_id: tenantId,
          session_token: meta.sessionId,
          reference_number: referenceNumber,
          assessment_definition_id: def.id,
          flag_rule_version_id: provisional.versionIdForSession,
          subject,
          language: meta.language || "ar",
          status: "submitted",
          started_at: parseDate(meta.startedAt) || now,
          last_saved_at: parseDate(meta.lastSavedAt),
          submitted_at: now,
          patient_name: answers.Q01_03 || null,
          patient_dob: answers.Q01_04a || null,
          patient_age_years: toAgeYears(answers),
          patient_age_months: answers.Q01_04b != null ? Number(answers.Q01_04b) : null,
          patient_sex: answers.Q01_05 || null,
          contact_patient_name: contact.patientName || null,
          contact_person_name: contact.contactPerson?.name || null,
          contact_relationship_code: contact.contactPerson?.relationship || null,
          handoff_phone_canonical: contact.handoffPhone?.canonical || null,
          handoff_phone_display: contact.handoffPhone?.display || null,
          patient_phone_canonical: contact.patientPhone?.canonical || null,
          patient_phone_display: contact.patientPhone?.display || null,
          contact_preference: contact.preference || null,
          contact_email: contact.email || null,
          contact_best_time: contact.bestTime || null,
          consent_contact: contact.consent === true,
          consent_contact_at: now,
          consent_policy_version: env.CONSENT_POLICY_VERSION,
          consent_contact_revoked_at: null,
          ack_accurate: ackResult.normalized.accurate,
          ack_no_diagnosis: ackResult.normalized.noDiagnosis,
          ack_urgent: ackResult.normalized.urgent,
          derived_bmi: bmi,
          overall_tier: overallTier,
        },
        { transaction: t }
      );

      // 2. AssessmentAnswer rows (one per submitted question_code).
      const answerRows = [];
      for (const [code, value] of Object.entries(answers)) {
        const isCollection = Array.isArray(value) || (value !== null && typeof value === "object" && !isScalarPrimitive(value));
        answerRows.push({
          session_id: session.id,
          question_code: code,
          stored_value: isCollection ? null : value == null ? null : String(value),
          stored_array_json: isCollection ? value : null,
        });
      }
      if (answerRows.length) await AssessmentAnswer.bulkCreate(answerRows, { transaction: t });

      // 3. AssessmentSnapshot (byte-faithful + sha256 payload_hash, immutable).
      const snapshotPayload = buildSnapshot({
        def,
        meta,
        subject,
        answers,
        contact,
        acknowledgements: ackResult.normalized,
        minor,
        bmi,
        overallTier,
        flags: provisional.rows,
        referenceNumber,
        submittedAt: now,
      });
      const snapshotJson = canonicalJsonString(snapshotPayload);
      const payloadHash = sha256Hex(snapshotJson);
      await AssessmentSnapshot.create(
        {
          session_id: session.id,
          full_payload_json: snapshotJson,
          payload_hash: payloadHash,
        },
        { transaction: t }
      );
      if (failureAfter === "snapshot") throw new Error("forced rollback test failure");

      // 4. AssessmentFlag rows (with re-linked session_id, now known).
      const flagRows = provisional.rows.map((r) => ({ ...r, session_id: session.id }));
      for (const row of flagRows) {
        await AssessmentFlag.create(row, { transaction: t });
      }

      // 5. DoctorReview (queued, no assignment — architecture §13).
      const review = await DoctorReview.create(
        {
          tenant_id: tenantId,
          assessment_session_id: session.id,
          patient_id: null,
          doctor_id: null,
          status: "queued",
          assigned_at: null,
          opened_at: null,
          decided_at: null,
          decision: null,
          notes: null,
          summary_outline_json: null,
        },
        { transaction: t }
      );

      // 6. DoctorReviewEvent (append-only status transition null → queued).
      await DoctorReviewEvent.create(
        {
          tenant_id: tenantId,
          review_id: review.id,
          from_status: null,
          to_status: "queued",
          actor_type: "system",
          actor_id: "backend",
          note: hasUrgent ? "queued: urgent routing state recorded" : "queued: standard queue",
        },
        { transaction: t }
      );

      // 7. Audit rows (no PHI in metadata).
      await auditService.record({
        tenantId,
        action: "assessment.submitted",
        entity: "assessment_session",
        entityRef: referenceNumber,
        metadata: { subject, language: meta.language, overallTier, flagCount: provisional.rows.length },
        ip,
        transaction: t,
      });
      await auditService.record({
        tenantId,
        action: "review.queued",
        entity: "doctor_review",
        entityRef: referenceNumber,
        metadata: { reviewStatus: "queued", urgent: hasUrgent },
        ip,
        transaction: t,
      });

      return {
        referenceNumber,
        overallTier,
        reviewState: "queued",
        hasUrgent,
        nextStep: nextStepMessage(overallTier),
      };
    });
  },
};

function parseDate(s) {
  if (!s || typeof s !== "string") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toAgeYears(answers) {
  if (answers.Q01_04a) {
    const d = new Date(answers.Q01_04a);
    if (!Number.isNaN(d.getTime())) {
      const today = new Date();
      let years = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years -= 1;
      return Math.max(0, years);
    }
  }
  const raw = answers.Q01_04;
  return raw === "" || raw == null ? null : Number(raw);
}

function isScalarPrimitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function buildSnapshot({
  def,
  meta,
  subject,
  answers,
  contact,
  acknowledgements,
  minor,
  bmi,
  overallTier,
  flags,
  referenceNumber,
  submittedAt,
}) {
  return {
    schemaVersion: "1.0",
    definition: { code: def.code, version: def.version },
    meta: {
      language: meta.language,
      startedAt: meta.startedAt || null,
      lastSavedAt: meta.lastSavedAt || null,
      assessmentVersion: def.version,
      status: "submitted",
    },
    subject,
    minor,
    answers,
    contact,
    acknowledgements,
    derived: { bmi, overallTier },
    flags: (flags || []).map((f) => ({ ruleId: f.rule_id, ruleVersion: f.rule_version, tier: f.tier, message: { ar: f.message_ar, en: f.message_en }, questionRefs: f.question_refs_json, triggerContext: f.trigger_context_json })),
    referenceNumber,
    submittedAt: submittedAt ? submittedAt.toISOString() : null,
    policyVersion: env.CONSENT_POLICY_VERSION,
  };
}

function nextStepMessage(overallTier) {
  if (overallTier === "urgent") {
    return {
      ar: "تم استلام تقييمك وسيتم مراجعته بأسرع وقت من قبل الطبيب.",
      en: "Your assessment was received and will be reviewed by the doctor promptly.",
    };
  }
  return {
    ar: "تم استلام تقييمك وسيراجعه الطبيب في الموعد المتاح.",
    en: "Your assessment was received and a doctor will review it during the next available slot.",
  };
}

export default assessmentService;



