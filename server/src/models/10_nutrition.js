// Group 10 — Nutrition plan (approved minimal future-ready, §14/§32).
// Tables: nutrition_plan, nutrition_plan_version, food_item, meal_template,
// meal_item, food_substitution, nutrition_plan_note.
// No plan generation / AI here — storage only. Versions never overwritten.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";
import { assertPlanReviewGated } from "../utils/review-gating.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- nutrition_plan ----
export const NutritionPlan = sequelize.define(
  "nutrition_plan",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    doctor_review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // gating link (§13)
    primary_goal_code: { type: DataTypes.STRING(40), allowNull: true }, // FK goal_code
    status: { type: DataTypes.ENUM(...ENUM.PLAN_STATUS), allowNull: false, defaultValue: "draft" },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "nutrition_plan",
    underscored: true,
    hooks: { beforeValidate: assertPlanReviewGated },
    indexes: [
      { name: "np_tenant_patient_status", fields: ["tenant_id", "patient_id", "status"] }, // §17
      { name: "np_review", fields: ["doctor_review_id"] },
    ],
  }
);

// ---- nutrition_plan_version ----
export const NutritionPlanVersion = sequelize.define(
  "nutrition_plan_version",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    plan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM(...ENUM.PLAN_STATUS), allowNull: false, defaultValue: "draft" },
    targets_json: { type: DataTypes.JSON, allowNull: true }, // §18 version-bound config
    notes: { type: DataTypes.TEXT, allowNull: true },
    source_review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    source_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    reviewer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    created_by: { type: DataTypes.STRING(40), allowNull: true },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    previous_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    approved_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "nutrition_plan_version",
    underscored: true,
    hooks: { beforeValidate: assertPlanReviewGated },
    indexes: [{ name: "npv_plan_version", unique: true, fields: ["plan_id", "version_no"] }],
  }
);

// ---- food_item (thin global catalog) ----
export const FoodItem = sequelize.define(
  "food_item",
  {
    id: BIGID,
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name_ar: { type: DataTypes.STRING(120), allowNull: false },
    name_en: { type: DataTypes.STRING(120), allowNull: false },
    category_code: { type: DataTypes.STRING(40), allowNull: true },
    unit: { type: DataTypes.STRING(20), allowNull: true },
    macros_json: { type: DataTypes.JSON, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "food_item", underscored: true }
);

// ---- meal_template ----
export const MealTemplate = sequelize.define(
  "meal_template",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    plan_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    code: { type: DataTypes.STRING(40), allowNull: false },
    name_ar: { type: DataTypes.STRING(120), allowNull: true },
    name_en: { type: DataTypes.STRING(120), allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    day_number: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "meal_template",
    underscored: true,
    indexes: [{ name: "mt_plan_version", fields: ["plan_version_id"] }],
  }
);

// ---- meal_item ----
export const MealItem = sequelize.define(
  "meal_item",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    meal_template_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    food_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // FK food_item
    quantity: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    unit: { type: DataTypes.STRING(20), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "meal_item",
    underscored: true,
    indexes: [{ name: "mi_meal_template", fields: ["meal_template_id"] }],
  }
);

// ---- food_substitution (catalog-level, reasons approved later) ----
export const FoodSubstitution = sequelize.define(
  "food_substitution",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    source_food_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    substitute_food_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    meal_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  },
  {
    tableName: "food_substitution",
    underscored: true,
    indexes: [{ name: "fs_source", fields: ["source_food_item_id"] }],
  }
);

// ---- nutrition_plan_note ----
export const NutritionPlanNote = sequelize.define(
  "nutrition_plan_note",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    plan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    author_type: { type: DataTypes.ENUM(...ENUM.NOTE_AUTHOR_TYPE), allowNull: false, defaultValue: "doctor" },
    author_id: { type: DataTypes.STRING(40), allowNull: true },
    visibility: { type: DataTypes.ENUM(...ENUM.NOTE_VISIBILITY), allowNull: false, defaultValue: "doctor_private" },
    note: { type: DataTypes.TEXT, allowNull: false }, // PHI candidate (§10)
  },
  {
    tableName: "nutrition_plan_note",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ name: "npn_plan", fields: ["plan_id"] }],
  }
);

export const GROUP_10 = {
  NutritionPlan,
  NutritionPlanVersion,
  FoodItem,
  MealTemplate,
  MealItem,
  FoodSubstitution,
  NutritionPlanNote,
};
