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
  PATIENT_STATUS: ["active", "inactive", "archived", "pending_payment"], // §8 soft-archive + Phase 6D onboarding
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
  // ---- Phase 6B: Daily Care Program (§3, §8, §10) ----
  CARE_PROGRAM_STATUS: ["draft", "scheduled", "active", "completed", "paused", "cancelled", "expired"],
  CARE_VERSION_STATUS: ["draft", "active", "superseded"], // care_program_version
  CARE_ACTIVITY_TYPE: ["nutrition", "exercise", "medication"],
  CARE_ACTIVITY_MEASURE: ["boolean", "sessions", "quantity", "duration"],
  CARE_ACTIVITY_STATUS: ["planned", "completed", "partial", "skipped", "not_recorded"],
  CARE_EXECUTION_KIND: ["initial", "correction"],
  CARE_EXECUTION_SOURCE: ["patient", "doctor", "system"],
  // ---- Phase 6C: Progress & Measurements (§2, §3, §7, §10) ----
  // Approved measurement types preserved from patient_measurement (§2). Weight
  // is kg; dimensions (waist/neck/hip) are cm (§25 unit consistency).
  PROGRESS_MEASUREMENT_TYPE: ["weight", "waist", "neck", "hip", "body_fat_percentage", "muscle_mass_kg"],
  PROGRESS_SOURCE: ["patient", "doctor", "checkin", "assessment", "system", "appointment"],
  PROGRESS_MEASUREMENT_KIND: ["initial", "correction"], // append-only correction chains
  PROGRESS_UNIT_BY_TYPE: { weight: "kg", waist: "cm", neck: "cm", hip: "cm", body_fat_percentage: "%", muscle_mass_kg: "kg" },
  PROGRESS_GOAL_TYPE: ["weight"], // no invented goal categories (§7)
  PROGRESS_GOAL_STATUS: ["draft", "active", "closed", "superseded", "cancelled"], // §7/§9
  PROGRESS_GOAL_VERSION_STATUS: ["draft", "active", "superseded"], // §8
  PROGRESS_CADENCE: ["every_3_days", "weekly", "biweekly", "monthly", "custom"], // §10 (default weekly, §11)
};

// §10/§11 configurable measurement cadence presets (days between measurements).
export const PROGRESS_CADENCE_PRESETS = {
  every_3_days: 3,
  weekly: 7, // safe default (§11)
  biweekly: 14,
  monthly: 30,
  custom: null, // requires explicit cadence_days
};
export const PROGRESS_DEFAULT_CADENCE = "weekly";

// §28 sane configurable numeric bounds (server-authoritative validation).
export const PROGRESS_BOUNDS = {
  weight: [20, 400], // kg
  waist: [20, 300], // cm
  neck: [20, 300], // cm
  hip: [20, 300], // cm
  body_fat_percentage: [1, 80], // %
  muscle_mass_kg: [10, 200], // kg
};

export const IDS = {
  REFERENCE_NUMBER_PREFIX: "DK-", // jack: spec §3 success: DK-2026-XXXXXX
  REFERENCE_NUMBER_LENGTH: 20,
  SESSION_TOKEN_LENGTH: 36,
  HASH_ALGO: "sha256", // assessment_snapshot.payload_hash
  HASH_LENGTH: 64,
};

export default ENUM;
