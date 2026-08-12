// Migration 012 — Patient check-in / progress (§27). NOT an assessment.
// Tables: patient_checkin, patient_checkin_measurement, patient_checkin_adherence.

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

export async function up(queryInterface) {
  await queryInterface.createTable("patient_checkin", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    checkin_on: { type: DataTypes.DATEONLY, allowNull: false },
    weight_kg: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    nutrition_adherence: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    exercise_adherence: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    patient_note: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.CHECKIN_STATUS), allowNull: false, defaultValue: "submitted" },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    reviewed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    doctor_note: { type: DataTypes.TEXT, allowNull: true },
    context_assessment_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "assessment_session", key: "id" } },
    context_nutrition_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "nutrition_plan_version", key: "id" } },
    context_exercise_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "exercise_plan_version", key: "id" } },
    ...TS,
  }, {
    indexes: [
      { name: "checkin_tenant_patient_date", fields: ["tenant_id", "patient_id", "checkin_on"] },
      { name: "checkin_tenant_status", fields: ["tenant_id", "status"] },
    ],
  });

  await queryInterface.createTable("patient_checkin_measurement", {
    id: ID,
    tenant_id: TENANT_FK,
    checkin_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient_checkin", key: "id" } },
    measure_code: { type: DataTypes.STRING(40), allowNull: false },
    value: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    unit: { type: DataTypes.STRING(10), allowNull: true },
    taken_by: { type: DataTypes.ENUM(...ENUM.TAKEN_BY), allowNull: false, defaultValue: "patient" },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [{ name: "checkin_measurement_checkin", fields: ["checkin_id"] }],
  });

  await queryInterface.createTable("patient_checkin_adherence", {
    id: ID,
    tenant_id: TENANT_FK,
    checkin_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient_checkin", key: "id" } },
    dimension: { type: DataTypes.ENUM(...ENUM.ADHERENCE_DIMENSION), allowNull: false },
    scale_value: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [{ name: "checkin_adherence_checkin", fields: ["checkin_id"] }],
  });
}
