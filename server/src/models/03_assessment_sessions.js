// Group 03 — Assessment sessions / answers / snapshot (hybrid, §2).
// Tables: assessment_session, assessment_answer, assessment_snapshot.
// Submitted records are IMMUTABLE (§0, §8): no updatedAt, no hard delete.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM, IDS } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- assessment_session ----
export const AssessmentSession = sequelize.define(
  "assessment_session",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    session_token: {
      type: DataTypes.STRING(IDS.SESSION_TOKEN_LENGTH),
      allowNull: false,
      unique: true,
    }, // federation id, §19
    reference_number: {
      type: DataTypes.STRING(IDS.REFERENCE_NUMBER_LENGTH),
      allowNull: true,
      unique: true,
    }, // DK-2026-XXXXXX, generated server-side at submit (column only, no logic)
    assessment_definition_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, // §4 chain lock
    flag_rule_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // flag interpretation at submit (§3)
    subject: { type: DataTypes.ENUM(...ENUM.SUBJECT), allowNull: false },
    language: { type: DataTypes.ENUM(...ENUM.LANGUAGE), allowNull: false, defaultValue: "ar" },
    status: { type: DataTypes.ENUM(...ENUM.SESSION_STATUS), allowNull: false, defaultValue: "draft" },
    started_at: { type: DataTypes.DATE, allowNull: true },
    last_saved_at: { type: DataTypes.DATE, allowNull: true }, // draft retention (§9)
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    // patient identity captured at intake (promoted to `patient` only at review-confirm, §23)
    patient_name: { type: DataTypes.STRING(100), allowNull: true },
    patient_dob: { type: DataTypes.DATEONLY, allowNull: true },
    patient_age_years: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    patient_age_months: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    patient_sex: { type: DataTypes.ENUM(...ENUM.SEX), allowNull: true },
    // contact capture (spec §3 / CL17)
    contact_patient_name: { type: DataTypes.STRING(100), allowNull: true },
    contact_person_name: { type: DataTypes.STRING(100), allowNull: true }, // C02
    contact_relationship_code: { type: DataTypes.STRING(40), allowNull: true }, // C03
    handoff_phone_canonical: { type: DataTypes.STRING(20), allowNull: true }, // C04
    handoff_phone_display: { type: DataTypes.STRING(20), allowNull: true },
    patient_phone_canonical: { type: DataTypes.STRING(20), allowNull: true }, // C05
    patient_phone_display: { type: DataTypes.STRING(20), allowNull: true },
    contact_preference: { type: DataTypes.ENUM(...ENUM.CONTACT_PREFERENCE), allowNull: true }, // C06
    contact_email: { type: DataTypes.STRING(190), allowNull: true }, // C07
    contact_best_time: { type: DataTypes.STRING(100), allowNull: true }, // C08
    // consent lifecycle (C09 / §9.3)
    consent_contact: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    consent_contact_at: { type: DataTypes.DATE, allowNull: true },
    consent_policy_version: { type: DataTypes.STRING(40), allowNull: true },
    consent_contact_revoked_at: { type: DataTypes.DATE, allowNull: true },
    // acknowledgements (§10)
    ack_accurate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // Q10_01
    ack_no_diagnosis: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // Q10_02
    ack_urgent: { type: DataTypes.BOOLEAN, allowNull: true }, // Q10_03 (only when urgent flag)
    // derived / audit (§23) — informational only, never routing
    derived_bmi: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    overall_tier: { type: DataTypes.ENUM(...ENUM.OVERALL_TIER), allowNull: true },
  },
  {
    tableName: "assessment_session",
    underscored: true,
    indexes: [
      { name: "session_tenant_status_submitted", fields: ["tenant_id", "status", "submitted_at"] }, // §17
      { name: "session_tenant_definition", fields: ["tenant_id", "assessment_definition_id"] },
    ],
  }
);

// ---- assessment_answer (canonical normalized answers; one row per question_code) ----
export const AssessmentAnswer = sequelize.define(
  "assessment_answer",
  {
    id: BIGID,
    session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    question_code: { type: DataTypes.STRING(20), allowNull: false },
    stored_value: { type: DataTypes.TEXT, allowNull: true }, // scalar
    stored_array_json: { type: DataTypes.JSON, allowNull: true }, // multi/list rows
  },
  {
    tableName: "assessment_answer",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { name: "answer_session_question", unique: true, fields: ["session_id", "question_code"] }, // §17
    ],
  }
);

// ---- assessment_snapshot (immutable submitted artifact) ----
export const AssessmentSnapshot = sequelize.define(
  "assessment_snapshot",
  {
    id: BIGID,
    session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
    full_payload_json: { type: DataTypes.TEXT("long"), allowNull: false }, // byte-faithful reconstruction (§2)
    payload_hash: { type: DataTypes.CHAR(IDS.HASH_LENGTH), allowNull: false, unique: true }, // sha256 hex
  },
  {
    tableName: "assessment_snapshot",
    underscored: true,
    timestamps: false,
  }
);

export const GROUP_03 = { AssessmentSession, AssessmentAnswer, AssessmentSnapshot };
