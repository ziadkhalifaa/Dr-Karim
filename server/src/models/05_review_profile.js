// Group 05 — Doctor review + patient confirmed profile/history.
// Tables: doctor_review, doctor_review_event, patient_condition,
// patient_allergy, patient_medication, patient_measurement, patient_lab_value,
// patient_pregnancy_record, patient_goal_history.
// Provenance (§1): every durable clinical row carries basis/confirmed_*/source_session_id.
// Profile writes happen ONLY in the review-confirm step (§13) — no auto-promotion.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// Provenance columns shared by every durable clinical row (§1).
const PROVENANCE = {
  basis: { type: DataTypes.ENUM(...ENUM.BASIS), allowNull: false, defaultValue: "patient_reported" },
  confirmed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // FK doctor
  confirmed_at: { type: DataTypes.DATE, allowNull: true },
  source_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
};

// ---- doctor_review (formal, not a boolean; §13) ----
export const DoctorReview = sequelize.define(
  "doctor_review",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    assessment_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // linked at confirm step
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // nullable until assigned
    status: { type: DataTypes.ENUM(...ENUM.REVIEW_STATUS), allowNull: false, defaultValue: "queued" },
    assigned_at: { type: DataTypes.DATE, allowNull: true },
    opened_at: { type: DataTypes.DATE, allowNull: true },
    decided_at: { type: DataTypes.DATE, allowNull: true },
    decision: { type: DataTypes.STRING(40), allowNull: true }, // mirror of approved/rejected (audit convenience)
    notes: { type: DataTypes.TEXT, allowNull: true }, // PHI — app-level field encryption target (§10)
    summary_outline_json: { type: DataTypes.JSON, allowNull: true }, // doctor-authored only (§13)
  },
  {
    tableName: "doctor_review",
    underscored: true,
    indexes: [
      { name: "review_tenant_status_assigned", fields: ["tenant_id", "status", "assigned_at"] }, // §17
      { name: "review_session", fields: ["assessment_session_id"] },
    ],
  }
);

// ---- doctor_review_event (append-only state history) ----
export const DoctorReviewEvent = sequelize.define(
  "doctor_review_event",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    from_status: { type: DataTypes.ENUM(...ENUM.REVIEW_STATUS), allowNull: true },
    to_status: { type: DataTypes.ENUM(...ENUM.REVIEW_STATUS), allowNull: false },
    actor_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false },
    actor_id: { type: DataTypes.STRING(40), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "doctor_review_event",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ name: "review_event_review", fields: ["review_id"] }],
  }
);

// ---- patient_condition ----
export const PatientCondition = sequelize.define(
  "patient_condition",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    condition_code: { type: DataTypes.STRING(40), allowNull: false }, // FK condition_code
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...PROVENANCE,
  },
  {
    tableName: "patient_condition",
    underscored: true,
    indexes: [
      { name: "condition_tenant_patient", fields: ["tenant_id", "patient_id"] },
      { name: "condition_patient_current", fields: ["patient_id", "is_current"] },
    ],
  }
);

// ---- patient_allergy ----
export const PatientAllergy = sequelize.define(
  "patient_allergy",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    allergen: { type: DataTypes.STRING(100), allowNull: false },
    reaction_code: { type: DataTypes.STRING(40), allowNull: true }, // FK reaction_code (mild..anaphylaxis)
    severity_code: { type: DataTypes.STRING(40), allowNull: true }, // FK severity_code
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...PROVENANCE,
  },
  {
    tableName: "patient_allergy",
    underscored: true,
    indexes: [{ name: "allergy_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  }
);

// ---- patient_medication ----
export const PatientMedication = sequelize.define(
  "patient_medication",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    medication_name: { type: DataTypes.STRING(100), allowNull: false },
    dose: { type: DataTypes.STRING(100), allowNull: true },
    reason: { type: DataTypes.STRING(100), allowNull: true },
    active_to: { type: DataTypes.DATEONLY, allowNull: true }, // current meds marker (§1)
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...PROVENANCE,
  },
  {
    tableName: "patient_medication",
    underscored: true,
    indexes: [{ name: "medication_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  }
);

// ---- patient_measurement (current durable measures; history lives in sessions) ----
export const PatientMeasurement = sequelize.define(
  "patient_measurement",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    measure_code: { type: DataTypes.STRING(40), allowNull: false }, // height_cm|weight_kg|neck_cm|waist_cm|hip_cm
    value: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    unit: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "cm" },
    measured_by: { type: DataTypes.ENUM(...ENUM.MEASURED_BY), allowNull: false, defaultValue: "patient" },
    measured_on: { type: DataTypes.DATEONLY, allowNull: true },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...PROVENANCE,
  },
  {
    tableName: "patient_measurement",
    underscored: true,
    indexes: [{ name: "measurement_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  }
);

// ---- patient_lab_value ----
export const PatientLabValue = sequelize.define(
  "patient_lab_value",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    lab_code: { type: DataTypes.STRING(40), allowNull: false }, // e.g. hba1c
    value: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    unit: { type: DataTypes.STRING(20), allowNull: true },
    measured_on: { type: DataTypes.DATEONLY, allowNull: true },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...PROVENANCE,
  },
  {
    tableName: "patient_lab_value",
    underscored: true,
    indexes: [{ name: "lab_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  }
);

// ---- patient_pregnancy_record (date-range fact; only from approved review, §1) ----
export const PatientPregnancyRecord = sequelize.define(
  "patient_pregnancy_record",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    started_on: { type: DataTypes.DATEONLY, allowNull: false },
    ended_on: { type: DataTypes.DATEONLY, allowNull: true },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...PROVENANCE,
  },
  {
    tableName: "patient_pregnancy_record",
    underscored: true,
    indexes: [{ name: "pregnancy_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  }
);

// ---- patient_goal_history ----
export const PatientGoalHistory = sequelize.define(
  "patient_goal_history",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    goal_code: { type: DataTypes.STRING(40), allowNull: false }, // FK goal_code
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...PROVENANCE,
  },
  {
    tableName: "patient_goal_history",
    underscored: true,
    indexes: [{ name: "goal_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  }
);

export const GROUP_05 = {
  DoctorReview,
  DoctorReviewEvent,
  PatientCondition,
  PatientAllergy,
  PatientMedication,
  PatientMeasurement,
  PatientLabValue,
  PatientPregnancyRecord,
  PatientGoalHistory,
};
