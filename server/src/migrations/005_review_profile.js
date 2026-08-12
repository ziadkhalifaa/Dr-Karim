// Migration 005 — Doctor review + patient confirmed profile/history.
// Tables: doctor_review, doctor_review_event, patient_condition,
// patient_allergy, patient_medication, patient_measurement, patient_lab_value,
// patient_pregnancy_record, patient_goal_history.
// Provenance columns per §1 (basis/confirmed_by/confirmed_at/source_session_id).

import { DataTypes, Sequelize } from "sequelize";
import { ENUM } from "../config/constants.js";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};
const ONLY_CREATED_AT = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};

// Provenance attribute block shared by every durable clinical row (§1).
const PROVENANCE = {
  basis: { type: DataTypes.ENUM(...ENUM.BASIS), allowNull: false, defaultValue: "patient_reported" },
  confirmed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
  confirmed_at: { type: DataTypes.DATE, allowNull: true },
  source_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "assessment_session", key: "id" } },
};

const TENANT_FK = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } };
const PATIENT_FK = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } };

export async function up(queryInterface) {
  await queryInterface.createTable("doctor_review", {
    id: ID,
    tenant_id: TENANT_FK,
    assessment_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "assessment_session", key: "id" } },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "patient", key: "id" } },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
    status: { type: DataTypes.ENUM(...ENUM.REVIEW_STATUS), allowNull: false, defaultValue: "queued" },
    assigned_at: { type: DataTypes.DATE, allowNull: true },
    opened_at: { type: DataTypes.DATE, allowNull: true },
    decided_at: { type: DataTypes.DATE, allowNull: true },
    decision: { type: DataTypes.STRING(40), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    summary_outline_json: { type: DataTypes.JSON, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "review_tenant_status_assigned", fields: ["tenant_id", "status", "assigned_at"] },
      { name: "review_session", fields: ["assessment_session_id"] },
    ],
  });

  await queryInterface.createTable("doctor_review_event", {
    id: ID,
    tenant_id: TENANT_FK,
    review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "doctor_review", key: "id" } },
    from_status: { type: DataTypes.ENUM(...ENUM.REVIEW_STATUS), allowNull: true },
    to_status: { type: DataTypes.ENUM(...ENUM.REVIEW_STATUS), allowNull: false },
    actor_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false },
    actor_id: { type: DataTypes.STRING(40), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [{ name: "review_event_review", fields: ["review_id"] }],
  });

  await queryInterface.createTable("patient_condition", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    condition_code: { type: DataTypes.STRING(40), allowNull: false },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...PROVENANCE,
    ...TS,
  }, {
    indexes: [
      { name: "condition_tenant_patient", fields: ["tenant_id", "patient_id"] },
      { name: "condition_patient_current", fields: ["patient_id", "is_current"] },
    ],
  });

  await queryInterface.createTable("patient_allergy", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    allergen: { type: DataTypes.STRING(100), allowNull: false },
    reaction_code: { type: DataTypes.STRING(40), allowNull: true },
    severity_code: { type: DataTypes.STRING(40), allowNull: true },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...PROVENANCE,
    ...TS,
  }, {
    indexes: [{ name: "allergy_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  });

  await queryInterface.createTable("patient_medication", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    medication_name: { type: DataTypes.STRING(100), allowNull: false },
    dose: { type: DataTypes.STRING(100), allowNull: true },
    reason: { type: DataTypes.STRING(100), allowNull: true },
    active_to: { type: DataTypes.DATEONLY, allowNull: true },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...PROVENANCE,
    ...TS,
  }, {
    indexes: [{ name: "medication_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  });

  await queryInterface.createTable("patient_measurement", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    measure_code: { type: DataTypes.STRING(40), allowNull: false },
    value: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    unit: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "cm" },
    measured_by: { type: DataTypes.ENUM(...ENUM.MEASURED_BY), allowNull: false, defaultValue: "patient" },
    measured_on: { type: DataTypes.DATEONLY, allowNull: true },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...PROVENANCE,
    ...TS,
  }, {
    indexes: [{ name: "measurement_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  });

  await queryInterface.createTable("patient_lab_value", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    lab_code: { type: DataTypes.STRING(40), allowNull: false },
    value: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    unit: { type: DataTypes.STRING(20), allowNull: true },
    measured_on: { type: DataTypes.DATEONLY, allowNull: true },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...PROVENANCE,
    ...TS,
  }, {
    indexes: [{ name: "lab_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  });

  await queryInterface.createTable("patient_pregnancy_record", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    started_on: { type: DataTypes.DATEONLY, allowNull: false },
    ended_on: { type: DataTypes.DATEONLY, allowNull: true },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...PROVENANCE,
    ...TS,
  }, {
    indexes: [{ name: "pregnancy_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  });

  await queryInterface.createTable("patient_goal_history", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    goal_code: { type: DataTypes.STRING(40), allowNull: false },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...PROVENANCE,
    ...TS,
  }, {
    indexes: [{ name: "goal_tenant_patient", fields: ["tenant_id", "patient_id"] }],
  });
}
