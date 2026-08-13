// Group 19 — Phase 6C: Progress & Measurements (historical time-series).
// Tables: patient_progress, progress_measurement, patient_progress_goal,
//         patient_progress_goal_version.
//
// Data-model invariants (docs/progress-measurements.md):
//   - progress_measurement is the CANONICAL historical measurement series,
//     immutable append-only (no updated_at). Corrections INSERT a new row
//     referencing the original (correction_of_id); the original is preserved.
//   - A measurement rows may reference its context (care_program_id,
//     checkin_id, appointment_id) WITHOUT being merged into those domains.
//   - patient_progress holds the per-patient progress context & cadence
//     (default weekly) — the "progress period" equivalent.
//   - patient_progress_goal is the doctor-managed numeric target; its versions
//     preserve goal history (§8). The existing patient_goal_history
//     (review goal-category) is untouched.
//   - current/starting weight are DERIVED from measurements — never stored as a
//     manually edited canonical field (§5, §30).

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- patient_progress (progress context + cadence) ----
export const PatientProgress = sequelize.define(
  "patient_progress",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    cadence: { type: DataTypes.ENUM(...ENUM.PROGRESS_CADENCE), allowNull: false, defaultValue: "weekly" },
    cadence_days: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // explicit days for custom presets
    // Rebuildable cached next due date (source of truth = measurements + cadence).
    next_due_date: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    tableName: "patient_progress",
    underscored: true,
    indexes: [
      { name: "pp_patient", unique: true, fields: ["tenant_id", "patient_id"] },
    ],
  }
);

// ---- progress_measurement (IMMUTABLE canonical history) ----
export const ProgressMeasurement = sequelize.define(
  "progress_measurement",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    measurement_type: { type: DataTypes.ENUM(...ENUM.PROGRESS_MEASUREMENT_TYPE), allowNull: false },
    value: { type: DataTypes.DECIMAL(8, 2), allowNull: false }, // kg for weight, cm for dimensions
    unit: { type: DataTypes.STRING(10), allowNull: false },
    measured_on: { type: DataTypes.DATEONLY, allowNull: false }, // tenant-tz day (§25)
    measured_at: { type: DataTypes.DATE, allowNull: true }, // optional exact datetime
    recorded_at: { type: DataTypes.DATE, allowNull: false },
    recorded_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false },
    recorded_by: { type: DataTypes.STRING(40), allowNull: true },
    source: { type: DataTypes.ENUM(...ENUM.PROGRESS_SOURCE), allowNull: false, defaultValue: "patient" },
    kind: { type: DataTypes.ENUM(...ENUM.PROGRESS_MEASUREMENT_KIND), allowNull: false, defaultValue: "initial" },
    correction_of_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // append-only chain
    reason: { type: DataTypes.STRING(400), allowNull: true }, // required for corrections
    // Optional provenance context (§12) — never the source domain itself.
    care_program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    checkin_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // patient_checkin (weekly) §23
    appointment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    notes: { type: DataTypes.STRING(1000), allowNull: true },
  },
  {
    tableName: "progress_measurement",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { name: "pm_tenant_patient", fields: ["tenant_id", "patient_id"] },
      { name: "pm_patient_type_on", fields: ["patient_id", "measurement_type", "measured_on"] },
      // single canonical truth for check-in sourced weights (§23/§30)
      { name: "pm_checkin_truth", unique: true, fields: ["patient_id", "source", "checkin_id", "measurement_type"] },
    ],
  }
);

// ---- patient_progress_goal (doctor-managed numeric target; §7/§9) ----
export const PatientProgressGoal = sequelize.define(
  "patient_progress_goal",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    goal_type: { type: DataTypes.ENUM(...ENUM.PROGRESS_GOAL_TYPE), allowNull: false, defaultValue: "weight" },
    unit: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "kg" },
    status: { type: DataTypes.ENUM(...ENUM.PROGRESS_GOAL_STATUS), allowNull: false, defaultValue: "draft" },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    target_date: { type: DataTypes.DATEONLY, allowNull: true },
    created_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false, defaultValue: "doctor" },
    created_by: { type: DataTypes.STRING(40), allowNull: true },
    approved_by: { type: DataTypes.STRING(40), allowNull: true }, // §7 approved_by
    approved_at: { type: DataTypes.DATE, allowNull: true },
    closed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "patient_progress_goal",
    underscored: true,
    indexes: [
      { name: "ppg_patient", fields: ["tenant_id", "patient_id"] },
      { name: "ppg_patient_status", fields: ["patient_id", "status"] },
    ],
  }
);

// ---- patient_progress_goal_version (goal history §8) ----
export const PatientProgressGoalVersion = sequelize.define(
  "patient_progress_goal_version",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    goal_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    target_value: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    unit: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "kg" },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    target_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.PROGRESS_GOAL_VERSION_STATUS), allowNull: false, defaultValue: "draft" },
    previous_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    created_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false, defaultValue: "doctor" },
    created_by: { type: DataTypes.STRING(40), allowNull: true },
    activated_by: { type: DataTypes.STRING(40), allowNull: true },
    activated_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "patient_progress_goal_version",
    underscored: true,
    indexes: [
      { name: "ppgv_goal_version", unique: true, fields: ["goal_id", "version_no"] },
      { name: "ppgv_tenant_goal", fields: ["tenant_id", "goal_id"] },
    ],
  }
);

export const GROUP_19 = {
  PatientProgress,
  ProgressMeasurement,
  PatientProgressGoal,
  PatientProgressGoalVersion,
};