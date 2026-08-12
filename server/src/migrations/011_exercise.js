// Migration 011 — Exercise plan (lightweight v1 catalog, §26/§32).
// Tables: exercise_plan, exercise_plan_version, exercise_item,
// exercise_substitution, exercise_plan_note.

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
  await queryInterface.createTable("exercise_plan", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
    doctor_review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor_review", key: "id" } },
    primary_goal_code: { type: DataTypes.STRING(40), allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.PLAN_STATUS), allowNull: false, defaultValue: "draft" },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "ep_tenant_patient_status", fields: ["tenant_id", "patient_id", "status"] },
      { name: "ep_review", fields: ["doctor_review_id"] },
    ],
  });

  await queryInterface.createTable("exercise_plan_version", {
    id: ID,
    tenant_id: TENANT_FK,
    plan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "exercise_plan", key: "id" } },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM(...ENUM.PLAN_STATUS), allowNull: false, defaultValue: "draft" },
    sets: { type: DataTypes.STRING(40), allowNull: true },
    reps: { type: DataTypes.STRING(40), allowNull: true },
    duration: { type: DataTypes.STRING(40), allowNull: true },
    frequency: { type: DataTypes.STRING(40), allowNull: true },
    rest: { type: DataTypes.STRING(40), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    source_review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor_review", key: "id" } },
    source_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "assessment_session", key: "id" } },
    reviewer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
    created_by: { type: DataTypes.STRING(40), allowNull: true },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    ...TS,
  }, {
    indexes: [{ name: "epv_plan_version", unique: true, fields: ["plan_id", "version_no"] }],
  });

  await queryInterface.createTable("exercise_item", {
    id: ID,
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name_ar: { type: DataTypes.STRING(120), allowNull: false },
    name_en: { type: DataTypes.STRING(120), allowNull: false },
    category_code: { type: DataTypes.STRING(40), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...TS,
  });

  await queryInterface.createTable("exercise_substitution", {
    id: ID,
    tenant_id: TENANT_FK,
    source_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "exercise_item", key: "id" } },
    substitute_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "exercise_item", key: "id" } },
    reason: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...TS,
  }, {
    indexes: [{ name: "es_source", fields: ["source_item_id"] }],
  });

  await queryInterface.createTable("exercise_plan_note", {
    id: ID,
    tenant_id: TENANT_FK,
    plan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "exercise_plan", key: "id" } },
    author_type: { type: DataTypes.ENUM(...ENUM.NOTE_AUTHOR_TYPE), allowNull: false, defaultValue: "doctor" },
    author_id: { type: DataTypes.STRING(40), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: false },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [{ name: "epn_plan", fields: ["plan_id"] }],
  });
}
