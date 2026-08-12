// Group 12 — Patient check-in / progress (NOT an assessment, §27).
// Tables: patient_checkin, patient_checkin_measurement, patient_checkin_adherence.
// Insert-only history; context plan/version ids captured at check-in date.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- patient_checkin ----
export const PatientCheckin = sequelize.define(
  "patient_checkin",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    checkin_on: { type: DataTypes.DATEONLY, allowNull: false },
    weight_kg: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    nutrition_adherence: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true }, // patient-reported scale (code refs)
    exercise_adherence: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    patient_note: { type: DataTypes.TEXT, allowNull: true }, // PHI candidate (§10)
    status: { type: DataTypes.ENUM(...ENUM.CHECKIN_STATUS), allowNull: false, defaultValue: "submitted" },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    reviewed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // doctor
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    doctor_note: { type: DataTypes.TEXT, allowNull: true }, // PHI — field-encryption target (§10)
    // context snapshots (active-at-check-in, never "current")
    context_assessment_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    context_nutrition_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    context_exercise_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  },
  {
    tableName: "patient_checkin",
    underscored: true,
    indexes: [
      { name: "checkin_tenant_patient_date", fields: ["tenant_id", "patient_id", "checkin_on"] },
      { name: "checkin_tenant_status", fields: ["tenant_id", "status"] },
    ],
  }
);

// ---- patient_checkin_measurement ----
export const PatientCheckinMeasurement = sequelize.define(
  "patient_checkin_measurement",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    checkin_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    measure_code: { type: DataTypes.STRING(40), allowNull: false },
    value: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    unit: { type: DataTypes.STRING(10), allowNull: true },
    taken_by: { type: DataTypes.ENUM(...ENUM.TAKEN_BY), allowNull: false, defaultValue: "patient" },
  },
  {
    tableName: "patient_checkin_measurement",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ name: "checkin_measurement_checkin", fields: ["checkin_id"] }],
  }
);

// ---- patient_checkin_adherence ----
export const PatientCheckinAdherence = sequelize.define(
  "patient_checkin_adherence",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    checkin_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    dimension: { type: DataTypes.ENUM(...ENUM.ADHERENCE_DIMENSION), allowNull: false },
    scale_value: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true }, // configurable reference scale
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "patient_checkin_adherence",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ name: "checkin_adherence_checkin", fields: ["checkin_id"] }],
  }
);

export const GROUP_12 = { PatientCheckin, PatientCheckinMeasurement, PatientCheckinAdherence };
