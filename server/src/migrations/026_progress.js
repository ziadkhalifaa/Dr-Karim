// Migration 026 — Phase 6C: Progress & Measurements.
// Tables: patient_progress, progress_measurement (IMMUTABLE append-only),
//         patient_progress_goal, patient_progress_goal_version.

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
const TENANT_FK = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } };
const PATIENT_FK = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } };

export async function up(queryInterface) {
  await queryInterface.createTable("patient_progress", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    cadence: { type: DataTypes.ENUM(...ENUM.PROGRESS_CADENCE), allowNull: false, defaultValue: "weekly" },
    cadence_days: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    next_due_date: { type: DataTypes.DATEONLY, allowNull: true },
    ...TS,
  }, {
    indexes: [{ name: "pp_patient", unique: true, fields: ["tenant_id", "patient_id"] }],
  });

  await queryInterface.createTable("progress_measurement", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    measurement_type: { type: DataTypes.ENUM(...ENUM.PROGRESS_MEASUREMENT_TYPE), allowNull: false },
    value: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    unit: { type: DataTypes.STRING(10), allowNull: false },
    measured_on: { type: DataTypes.DATEONLY, allowNull: false },
    measured_at: { type: DataTypes.DATE, allowNull: true },
    recorded_at: { type: DataTypes.DATE, allowNull: false },
    recorded_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false },
    recorded_by: { type: DataTypes.STRING(40), allowNull: true },
    source: { type: DataTypes.ENUM(...ENUM.PROGRESS_SOURCE), allowNull: false, defaultValue: "patient" },
    kind: { type: DataTypes.ENUM(...ENUM.PROGRESS_MEASUREMENT_KIND), allowNull: false, defaultValue: "initial" },
    correction_of_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "progress_measurement", key: "id" } },
    reason: { type: DataTypes.STRING(400), allowNull: true },
    care_program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "care_program", key: "id" } },
    checkin_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "patient_checkin", key: "id" } },
    appointment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "appointment", key: "id" } },
    notes: { type: DataTypes.STRING(1000), allowNull: true },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [
      { name: "pm_tenant_patient", fields: ["tenant_id", "patient_id"] },
      { name: "pm_patient_type_on", fields: ["patient_id", "measurement_type", "measured_on"] },
      { name: "pm_checkin_truth", unique: true, fields: ["patient_id", "source", "checkin_id", "measurement_type"] },
    ],
  });

  await queryInterface.createTable("patient_progress_goal", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: PATIENT_FK,
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
    goal_type: { type: DataTypes.ENUM(...ENUM.PROGRESS_GOAL_TYPE), allowNull: false, defaultValue: "weight" },
    unit: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "kg" },
    status: { type: DataTypes.ENUM(...ENUM.PROGRESS_GOAL_STATUS), allowNull: false, defaultValue: "draft" },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    target_date: { type: DataTypes.DATEONLY, allowNull: true },
    created_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false, defaultValue: "doctor" },
    created_by: { type: DataTypes.STRING(40), allowNull: true },
    approved_by: { type: DataTypes.STRING(40), allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    closed_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "ppg_patient", fields: ["tenant_id", "patient_id"] },
      { name: "ppg_patient_status", fields: ["patient_id", "status"] },
    ],
  });

  await queryInterface.createTable("patient_progress_goal_version", {
    id: ID,
    tenant_id: TENANT_FK,
    goal_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient_progress_goal", key: "id" } },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    target_value: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    unit: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "kg" },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    target_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.PROGRESS_GOAL_VERSION_STATUS), allowNull: false, defaultValue: "draft" },
    previous_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "patient_progress_goal_version", key: "id" } },
    created_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false, defaultValue: "doctor" },
    created_by: { type: DataTypes.STRING(40), allowNull: true },
    activated_by: { type: DataTypes.STRING(40), allowNull: true },
    activated_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "ppgv_goal_version", unique: true, fields: ["goal_id", "version_no"] },
      { name: "ppgv_tenant_goal", fields: ["tenant_id", "goal_id"] },
    ],
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("patient_progress_goal_version");
  await queryInterface.dropTable("patient_progress_goal");
  await queryInterface.dropTable("progress_measurement");
  await queryInterface.dropTable("patient_progress");
}