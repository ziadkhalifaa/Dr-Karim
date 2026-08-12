// Migration 010 — Nutrition plan (approved minimal future-ready, §14/§32).
// Tables: nutrition_plan, nutrition_plan_version, food_item, meal_template,
// meal_item, food_substitution, nutrition_plan_note.

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
  await queryInterface.createTable("nutrition_plan", {
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
      { name: "np_tenant_patient_status", fields: ["tenant_id", "patient_id", "status"] },
      { name: "np_review", fields: ["doctor_review_id"] },
    ],
  });

  await queryInterface.createTable("nutrition_plan_version", {
    id: ID,
    tenant_id: TENANT_FK,
    plan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "nutrition_plan", key: "id" } },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM(...ENUM.PLAN_STATUS), allowNull: false, defaultValue: "draft" },
    targets_json: { type: DataTypes.JSON, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    source_review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor_review", key: "id" } },
    source_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "assessment_session", key: "id" } },
    reviewer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
    created_by: { type: DataTypes.STRING(40), allowNull: true },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    ...TS,
  }, {
    indexes: [{ name: "npv_plan_version", unique: true, fields: ["plan_id", "version_no"] }],
  });

  await queryInterface.createTable("food_item", {
    id: ID,
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name_ar: { type: DataTypes.STRING(120), allowNull: false },
    name_en: { type: DataTypes.STRING(120), allowNull: false },
    category_code: { type: DataTypes.STRING(40), allowNull: true },
    unit: { type: DataTypes.STRING(20), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...TS,
  });

  await queryInterface.createTable("meal_template", {
    id: ID,
    tenant_id: TENANT_FK,
    plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "nutrition_plan_version", key: "id" } },
    code: { type: DataTypes.STRING(40), allowNull: false },
    name_ar: { type: DataTypes.STRING(120), allowNull: true },
    name_en: { type: DataTypes.STRING(120), allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...TS,
  }, {
    indexes: [{ name: "mt_plan_version", fields: ["plan_version_id"] }],
  });

  await queryInterface.createTable("meal_item", {
    id: ID,
    tenant_id: TENANT_FK,
    meal_template_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "meal_template", key: "id" } },
    food_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "food_item", key: "id" } },
    quantity: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    unit: { type: DataTypes.STRING(20), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    ...TS,
  }, {
    indexes: [{ name: "mi_meal_template", fields: ["meal_template_id"] }],
  });

  await queryInterface.createTable("food_substitution", {
    id: ID,
    tenant_id: TENANT_FK,
    source_food_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "food_item", key: "id" } },
    substitute_food_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "food_item", key: "id" } },
    reason: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...TS,
  }, {
    indexes: [{ name: "fs_source", fields: ["source_food_item_id"] }],
  });

  await queryInterface.createTable("nutrition_plan_note", {
    id: ID,
    tenant_id: TENANT_FK,
    plan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "nutrition_plan", key: "id" } },
    author_type: { type: DataTypes.ENUM(...ENUM.NOTE_AUTHOR_TYPE), allowNull: false, defaultValue: "doctor" },
    author_id: { type: DataTypes.STRING(40), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: false },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [{ name: "npn_plan", fields: ["plan_id"] }],
  });
}
