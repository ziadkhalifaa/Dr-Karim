// Migration 025 — Phase 6B: Daily Care Program.
// Tables: care_program, care_program_version, care_day,
//         care_activity_definition, care_activity_instance,
//         care_activity_execution (IMMUTABLE append-only),
//         care_daily_checkin.
// Also adds tenant.timezone (canonical care timezone, default Africa/Cairo).

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
  // Canonical care timezone per tenant (server-authoritative "today", §26).
  await queryInterface.addColumn("tenant", "timezone", {
    type: DataTypes.STRING(64),
    allowNull: true,
    defaultValue: "Africa/Cairo",
  });
  await queryInterface.sequelize.query(
    "UPDATE tenant SET timezone = 'Africa/Cairo' WHERE timezone IS NULL"
  );

  await queryInterface.createTable("care_program", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
    package_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "package", key: "id" } },
    subscription_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "subscription", key: "id" } },
    nutrition_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "nutrition_plan_version", key: "id" } },
    exercise_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "exercise_plan_version", key: "id" } },
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
    ...TS,
  }, {
    indexes: [
      { name: "cp_tenant_patient_status", fields: ["tenant_id", "patient_id", "status"] },
      { name: "cp_tenant_status", fields: ["tenant_id", "status"] },
    ],
  });

  await queryInterface.createTable("care_program_version", {
    id: ID,
    tenant_id: TENANT_FK,
    care_program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_program", key: "id" } },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nutrition_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "nutrition_plan_version", key: "id" } },
    exercise_plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "exercise_plan_version", key: "id" } },
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
    ...TS,
  }, {
    indexes: [
      { name: "cpv_program_version", unique: true, fields: ["care_program_id", "version_no"] },
      { name: "cpv_tenant_program", fields: ["tenant_id", "care_program_id"] },
    ],
  });

  await queryInterface.createTable("care_day", {
    id: ID,
    tenant_id: TENANT_FK,
    care_program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_program", key: "id" } },
    care_program_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_program_version", key: "id" } },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    day_index: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    ...TS,
  }, {
    indexes: [
      { name: "cd_program_date", unique: true, fields: ["care_program_id", "date"] },
      { name: "cd_tenant_program", fields: ["tenant_id", "care_program_id"] },
    ],
  });

  await queryInterface.createTable("care_activity_definition", {
    id: ID,
    tenant_id: TENANT_FK,
    care_program_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_program_version", key: "id" } },
    activity_type: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_TYPE), allowNull: false },
    code: { type: DataTypes.STRING(40), allowNull: false },
    name_ar: { type: DataTypes.STRING(120), allowNull: false },
    name_en: { type: DataTypes.STRING(120), allowNull: false },
    measure: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_MEASURE), allowNull: false },
    planned_target_json: { type: DataTypes.JSON, allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...TS,
  }, {
    indexes: [
      { name: "cad_version_code", unique: true, fields: ["care_program_version_id", "code"] },
      { name: "cad_tenant_version", fields: ["tenant_id", "care_program_version_id"] },
    ],
  });

  await queryInterface.createTable("care_activity_instance", {
    id: ID,
    tenant_id: TENANT_FK,
    care_day_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_day", key: "id" } },
    care_activity_definition_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_activity_definition", key: "id" } },
    activity_type: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_TYPE), allowNull: false },
    code: { type: DataTypes.STRING(40), allowNull: false },
    name_ar: { type: DataTypes.STRING(120), allowNull: false },
    name_en: { type: DataTypes.STRING(120), allowNull: false },
    measure: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_MEASURE), allowNull: false },
    planned_target_json: { type: DataTypes.JSON, allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [
      { name: "cai_day_definition", unique: true, fields: ["care_day_id", "care_activity_definition_id"] },
      { name: "cai_tenant_day", fields: ["tenant_id", "care_day_id"] },
    ],
  });

  await queryInterface.createTable("care_activity_execution", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    care_day_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_day", key: "id" } },
    activity_instance_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_activity_instance", key: "id" } },
    kind: { type: DataTypes.ENUM(...ENUM.CARE_EXECUTION_KIND), allowNull: false, defaultValue: "initial" },
    correction_of_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "care_activity_execution", key: "id" } },
    reason: { type: DataTypes.STRING(400), allowNull: true },
    planned_snapshot_json: { type: DataTypes.JSON, allowNull: false },
    actual_value_json: { type: DataTypes.JSON, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.CARE_ACTIVITY_STATUS), allowNull: false },
    recorded_at: { type: DataTypes.DATE, allowNull: false },
    recorded_by_type: { type: DataTypes.ENUM(...ENUM.ACTOR_TYPE), allowNull: false },
    recorded_by: { type: DataTypes.STRING(40), allowNull: false },
    source: { type: DataTypes.ENUM(...ENUM.CARE_EXECUTION_SOURCE), allowNull: false, defaultValue: "patient" },
    idempotency_key: { type: DataTypes.STRING(120), allowNull: true },
    metadata_json: { type: DataTypes.JSON, allowNull: true },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [
      { name: "cae_instance_status", fields: ["activity_instance_id", "status"] },
      { name: "cae_tenant_day", fields: ["tenant_id", "care_day_id"] },
      { name: "cae_instance_idem", unique: true, fields: ["activity_instance_id", "idempotency_key"] },
    ],
  });

  await queryInterface.createTable("care_daily_checkin", {
    id: ID,
    tenant_id: TENANT_FK,
    care_program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_program", key: "id" } },
    care_day_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "care_day", key: "id" } },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    checkin_on: { type: DataTypes.DATEONLY, allowNull: false },
    energy: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    hunger: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    adherence_self_report: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    weight_kg: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "cdc_day", unique: true, fields: ["care_day_id"] },
      { name: "cdc_tenant_program_day", fields: ["tenant_id", "care_program_id", "checkin_on"] },
    ],
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("care_daily_checkin");
  await queryInterface.dropTable("care_activity_execution");
  await queryInterface.dropTable("care_activity_instance");
  await queryInterface.dropTable("care_activity_definition");
  await queryInterface.dropTable("care_day");
  await queryInterface.dropTable("care_program_version");
  await queryInterface.dropTable("care_program");
  await queryInterface.removeColumn("tenant", "timezone");
}