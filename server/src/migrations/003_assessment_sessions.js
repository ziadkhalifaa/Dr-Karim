// Migration 003 — Assessment sessions/answers/snapshot + patient_session link.
// patient_session lives here (FK to assessment_session). AssessmentSession.age
// columns are DATEONLY etc.; submitted records are immutable (created_at only).

import { DataTypes, Sequelize } from "sequelize";
import { ENUM, IDS } from "../config/constants.js";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};
const ONLY_CREATED_AT = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};

export async function up(queryInterface) {
  await queryInterface.createTable("assessment_session", {
    id: ID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    session_token: { type: DataTypes.STRING(IDS.SESSION_TOKEN_LENGTH), allowNull: false, unique: true },
    reference_number: { type: DataTypes.STRING(IDS.REFERENCE_NUMBER_LENGTH), allowNull: true, unique: true },
    assessment_definition_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "assessment_definition", key: "id" } },
    flag_rule_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // FK added in 004
    subject: { type: DataTypes.ENUM(...ENUM.SUBJECT), allowNull: false },
    language: { type: DataTypes.ENUM(...ENUM.LANGUAGE), allowNull: false, defaultValue: "ar" },
    status: { type: DataTypes.ENUM(...ENUM.SESSION_STATUS), allowNull: false, defaultValue: "draft" },
    started_at: { type: DataTypes.DATE, allowNull: true },
    last_saved_at: { type: DataTypes.DATE, allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    patient_name: { type: DataTypes.STRING(100), allowNull: true },
    patient_dob: { type: DataTypes.DATEONLY, allowNull: true },
    patient_age_years: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    patient_age_months: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    patient_sex: { type: DataTypes.ENUM(...ENUM.SEX), allowNull: true },
    contact_patient_name: { type: DataTypes.STRING(100), allowNull: true },
    contact_person_name: { type: DataTypes.STRING(100), allowNull: true },
    contact_relationship_code: { type: DataTypes.STRING(40), allowNull: true },
    handoff_phone_canonical: { type: DataTypes.STRING(20), allowNull: true },
    handoff_phone_display: { type: DataTypes.STRING(20), allowNull: true },
    patient_phone_canonical: { type: DataTypes.STRING(20), allowNull: true },
    patient_phone_display: { type: DataTypes.STRING(20), allowNull: true },
    contact_preference: { type: DataTypes.ENUM(...ENUM.CONTACT_PREFERENCE), allowNull: true },
    contact_email: { type: DataTypes.STRING(190), allowNull: true },
    contact_best_time: { type: DataTypes.STRING(100), allowNull: true },
    consent_contact: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    consent_contact_at: { type: DataTypes.DATE, allowNull: true },
    consent_policy_version: { type: DataTypes.STRING(40), allowNull: true },
    consent_contact_revoked_at: { type: DataTypes.DATE, allowNull: true },
    ack_accurate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ack_no_diagnosis: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ack_urgent: { type: DataTypes.BOOLEAN, allowNull: true },
    derived_bmi: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    overall_tier: { type: DataTypes.ENUM(...ENUM.OVERALL_TIER), allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "session_tenant_status_submitted", fields: ["tenant_id", "status", "submitted_at"] },
      { name: "session_tenant_definition", fields: ["tenant_id", "assessment_definition_id"] },
      { name: "session_flag_rule_version", fields: ["flag_rule_version_id"] },
    ],
  });

  await queryInterface.createTable("assessment_answer", {
    id: ID,
    session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "assessment_session", key: "id" } },
    question_code: { type: DataTypes.STRING(20), allowNull: false },
    stored_value: { type: DataTypes.TEXT, allowNull: true },
    stored_array_json: { type: DataTypes.JSON, allowNull: true },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [{ name: "answer_session_question", unique: true, fields: ["session_id", "question_code"] }],
  });

  await queryInterface.createTable("assessment_snapshot", {
    id: ID,
    session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true, references: { model: "assessment_session", key: "id" } },
    full_payload_json: { type: DataTypes.TEXT("long"), allowNull: false },
    payload_hash: { type: DataTypes.CHAR(IDS.HASH_LENGTH), allowNull: false, unique: true },
    ...ONLY_CREATED_AT,
  });

  await queryInterface.createTable("patient_session", {
    id: ID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    assessment_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "assessment_session", key: "id" } },
    ...TS,
  }, {
    indexes: [
      { name: "patient_session_uniq", unique: true, fields: ["patient_id", "assessment_session_id"] },
      { name: "patient_session_session", fields: ["assessment_session_id"] },
    ],
  });
}
