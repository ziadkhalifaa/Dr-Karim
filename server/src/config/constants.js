// Centralized enum/status constants for the Phase 1 schema.
//
// Every ENUM column value below is locked by docs/database-architecture.md and
// docs/assessment-spec.md. Models and migrations import from here so a value
// can never silently diverge between a migration and a model.
//
// NOTE: MySQL 8 ENUM ordering = declaration order; do NOT reorder after a
// migration has been applied (forward-only philosophy).

export const ENUM = {
  SEX: ["female", "male"],
  PATIENT_STATUS: ["active", "inactive", "archived"], // §8 soft-archive
  SUBJECT: ["self", "someone_else"],
  LANGUAGE: ["ar", "en"],
  SESSION_STATUS: ["draft", "submitted"], // draft purge per §9; submitted immutable
  CONTACT_PREFERENCE: ["whatsapp", "call", "both"],
  OVERALL_TIER: ["standard", "urgent"],
  FLAG_TIER: ["standard", "urgent"], // two tiers only; no Medium (§0, §3)
  FLAG_STATUS: ["pending", "acknowledged", "reviewing", "resolved", "superseded"], // §3
  REVIEW_STATUS: [
    "queued",
    "assigned",
    "in_review",
    "needs_clarification",
    "approved",
    "rejected", // §13 state machine
  ],
  ACTOR_TYPE: ["doctor", "staff", "system", "patient", "admin"],
  BASIS: ["patient_reported", "doctor_confirmed"], // §1 provenance
  MEASURED_BY: ["patient", "doctor", "clinic"],
  PLAN_STATUS: ["draft", "doctor_review", "approved", "active", "archived"], // §14/§26
  NOTE_AUTHOR_TYPE: ["doctor", "patient", "admin"],
  NOTE_VISIBILITY: ["doctor_private", "patient_visible"], // §31 default doctor_private
  APPOINTMENT_TYPE: ["clinic", "online"], // §15
  APPOINTMENT_STATUS: ["pending", "confirmed", "cancelled", "completed", "no_show"], // §15/§28
  LIVE_SESSION_STATUS: ["not_started", "waiting", "active", "ended", "failed"], // §28
  VIDEO_MEETING_STATUS: ["pending", "created", "started", "ended", "failed"], // §29
  CHECKIN_STATUS: ["submitted", "reviewed"], // §27 default submitted
  TAKEN_BY: ["patient", "doctor", "clinic"], // §27 check-in measurements
  ADHERENCE_DIMENSION: ["nutrition", "exercise", "sleep", "stress"], // §27
  QUESTION_TYPE: [
    "single",
    "multi",
    "number",
    "date",
    "text",
    "textarea",
    "phone",
    "email",
    "scale",
    "list",
    "consent",
    "toggle",
    "notice",
  ],
  REQUIRED_FLAG: ["*", "o", "c"], // spec §3 legend
  DEFINITION_STATUS: ["draft", "published", "retired"], // §4
  CONTENT_STATUS: ["draft", "published", "archived"], // §16/§18
  LOCALE: ["ar", "en"],
};

export const IDS = {
  REFERENCE_NUMBER_PREFIX: "DK-", // jack: spec §3 success: DK-2026-XXXXXX
  REFERENCE_NUMBER_LENGTH: 20,
  SESSION_TOKEN_LENGTH: 36,
  HASH_ALGO: "sha256", // assessment_snapshot.payload_hash
  HASH_LENGTH: 64,
};

export default ENUM;
