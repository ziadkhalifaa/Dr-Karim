// Group 18 — Phase 6B: Daily Care Program (executable daily care).
// Tables: care_program, care_program_version, care_day,
//         care_activity_definition, care_activity_instance,
//         care_activity_execution, care_daily_checkin.
//
// Data-model invariants (docs/care-activity-model.md):
//   - Definition vs Instance are separate tables. Instances snapshot the
//     definition at materialization time; a future plan/program edit never
//     rewrites historical instances.
//   - Executions are IMMUTABLE append-only rows (updatedAt disabled). A
//     correction inserts a NEW row referencing the original (correction_of_id);
//     the original is never mutated or deleted.
//   - care_day.date + care_program_version_id bound each calendar day to the
//     plan versions that were active on that date (plan-version boundary §20).

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- care_program ----
export const CareProgram = sequelize.define(
  "care_program",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    // commercial / access context (never drives clinical routing)
    package_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    subscription_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    // current plan bindings (latest care_program_version; per-day binding is
    // captured on care_day for the plan-version boundary)
    nutrition_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    exercise_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM(...ENUM.CARE_PROGRAM_STATUS), allowNull: false, defaultValue: "draft" },
    program_instructions: { type: DataTypes.TEXT, allowNull: true },
    created_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: true },
    created_by: { type: DataTypes.STRING(40), allowNull: true },
    activated_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: true },
    activated_by: { type: DataTypes.STRING(40), allowNull: true },
    activated_at: { type: DataTypes.DATE, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "care_program",
    underscored: true,
    indexes: [
      { name: "cp_tenant_patient_status", fields: ["tenant_id", "patient_id", "status"] },
      { name: "cp_tenant_status", fields: ["tenant_id", "status"] },
    ],
  }
);

// ---- care_program_version (plan-version boundary per program change) ----
export const CareProgramVersion = sequelize.define(
  "care_program_version",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nutrition_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    exercise_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    program_instructions: { type: DataTypes.TEXT, allowNull: true },
    effective_from: { type: DataTypes.DATEONLY, allowNull: false },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.CARE_VERSION_STATUS), allowNull: false, defaultValue: "draft" },
    created_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: true },
    created_by: { type: DataTypes.STRING(40), allowNull: true },
    activated_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: true },
    activated_by: { type: DataTypes.STRING(40), allowNull: true },
    activated_at: { type: DataTypes.DATE, allowNull: true },
    previous_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  },
  {
    tableName: "care_program_version",
    underscored: true,
    indexes: [
      { name: "cpv_program_version", unique: true, fields: ["care_program_id", "version_no"] },
      { name: "cpv_tenant_program", fields: ["tenant_id", "care_program_id"] },
    ],
  }
);

// ---- care_day (a specific calendar day inside the program) ----
export const CareDay = sequelize.define(
  "care_day",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_program_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    day_index: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    tableName: "care_day",
    underscored: true,
    indexes: [
      { name: "cd_program_date", unique: true, fields: ["care_program_id", "date"] },
      { name: "cd_tenant_program", fields: ["tenant_id", "care_program_id"] },
    ],
  }
);

// ---- care_activity_definition (doctor-authored planned activity/type) ----
export const CareActivityDefinition = sequelize.define(
  "care_activity_definition",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_program_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    activity_type: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_TYPE), allowNull: false },
    code: { type: DataTypes.STRING(40), allowNull: false },
    name_ar: { type: DataTypes.STRING(120), allowNull: false },
    name_en: { type: DataTypes.STRING(120), allowNull: false },
    measure: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_MEASURE), allowNull: false },
    planned_target_json: { type: DataTypes.JSON, allowNull: true }, // { sessions } | { quantity, unit } | { duration_min }
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "care_activity_definition",
    underscored: true,
    indexes: [
      { name: "cad_version_code", unique: true, fields: ["care_program_version_id", "code"] },
      { name: "cad_tenant_version", fields: ["tenant_id", "care_program_version_id"] },
    ],
  }
);

// ---- care_activity_instance (the concrete activity scheduled for a care day) ----
// Immutable snapshot of the definition at materialization time.
export const CareActivityInstance = sequelize.define(
  "care_activity_instance",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_day_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_activity_definition_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    activity_type: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_TYPE), allowNull: false },
    code: { type: DataTypes.STRING(40), allowNull: false },
    name_ar: { type: DataTypes.STRING(120), allowNull: false },
    name_en: { type: DataTypes.STRING(120), allowNull: false },
    measure: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_MEASURE), allowNull: false },
    planned_target_json: { type: DataTypes.JSON, allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "care_activity_instance",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { name: "cai_day_definition", unique: true, fields: ["care_day_id", "care_activity_definition_id"] },
      { name: "cai_tenant_day", fields: ["tenant_id", "care_day_id"] },
    ],
  }
);

// ---- care_activity_execution (IMMUTABLE append-only patient-recorded truth) ----
export const CareActivityExecution = sequelize.define(
  "care_activity_execution",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_day_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    activity_instance_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    kind: { type: DataTypes.ENUM(...ENUM.CARE_EXECUTION_KIND), allowNull: false, defaultValue: "initial" },
    correction_of_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // append-only correction chain
    reason: { type: DataTypes.STRING(400), allowNull: true }, // required for corrections
    planned_snapshot_json: { type: DataTypes.JSON, allowNull: false },
    actual_value_json: { type: DataTypes.JSON, allowNull: true }, // { sessions } | { quantity, unit } | { duration_min } | { done }
    status: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_STATUS), allowNull: false },
    recorded_at: { type: DataTypes.DATE, allowNull: false },
    recorded_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false },
    recorded_by: { type: DataTypes.STRING(40), allowNull: false },
    source: { type: DataTypes.ENUM(...ENUM.CARE_EXECUTION_SOURCE), allowNull: false, defaultValue: "patient" },
    idempotency_key: { type: DataTypes.STRING(120), allowNull: true },
    metadata_json: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: "care_activity_execution",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { name: "cae_instance_status", fields: ["activity_instance_id", "status"] },
      { name: "cae_tenant_day", fields: ["tenant_id", "care_day_id"] },
      { name: "cae_instance_idem", unique: true, fields: ["activity_instance_id", "idempotency_key"] },
    ],
  }
);

// ---- care_daily_checkin (daily "how was my day"; separate from executions) ----
export const CareDailyCheckin = sequelize.define(
  "care_daily_checkin",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_day_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    checkin_on: { type: DataTypes.DATEONLY, allowNull: false },
    energy: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true }, // patient-reported 0..10
    hunger: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    adherence_self_report: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true }, // 0..100
    weight_kg: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "care_daily_checkin",
    underscored: true,
    indexes: [
      { name: "cdc_day", unique: true, fields: ["care_day_id"] },
      { name: "cdc_tenant_program_day", fields: ["tenant_id", "care_program_id", "checkin_on"] },
    ],
  }
);

export const GROUP_18 = {
  CareProgram,
  CareProgramVersion,
  CareDay,
  CareActivityDefinition,
  CareActivityInstance,
  CareActivityExecution,
  CareDailyCheckin,
};
