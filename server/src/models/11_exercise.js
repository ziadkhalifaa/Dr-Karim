// Group 11 — Exercise plan (lightweight v1 catalog, §26/§32).
// Tables: exercise_plan, exercise_plan_version, exercise_item,
// exercise_substitution, exercise_plan_note.
// No contraindications/MET/physiology columns (v1 boundary). Thin catalog.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";
import { assertPlanReviewGated } from "../utils/review-gating.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- exercise_plan ----
export const ExercisePlan = sequelize.define(
  "exercise_plan",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    doctor_review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    primary_goal_code: { type: DataTypes.STRING(40), allowNull: true }, // FK goal_code
    status: { type: DataTypes.ENUM(...ENUM.PLAN_STATUS), allowNull: false, defaultValue: "draft" },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "exercise_plan",
    underscored: true,
    hooks: { beforeValidate: assertPlanReviewGated },
    indexes: [
      { name: "ep_tenant_patient_status", fields: ["tenant_id", "patient_id", "status"] },
      { name: "ep_review", fields: ["doctor_review_id"] },
    ],
  }
);

// ---- exercise_plan_version (stores prescribed details) ----
export const ExercisePlanVersion = sequelize.define(
  "exercise_plan_version",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    plan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM(...ENUM.PLAN_STATUS), allowNull: false, defaultValue: "draft" },
    sets: { type: DataTypes.STRING(40), allowNull: true },
    reps: { type: DataTypes.STRING(40), allowNull: true },
    duration: { type: DataTypes.STRING(40), allowNull: true },
    frequency: { type: DataTypes.STRING(40), allowNull: true },
    rest: { type: DataTypes.STRING(40), allowNull: true },
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
    tableName: "exercise_plan_version",
    underscored: true,
    hooks: { beforeValidate: assertPlanReviewGated },
    indexes: [{ name: "epv_plan_version", unique: true, fields: ["plan_id", "version_no"] }],
  }
);

// ---- exercise_item (lightweight v1 catalog) ----
export const ExerciseItem = sequelize.define(
  "exercise_item",
  {
    id: BIGID,
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name_ar: { type: DataTypes.STRING(120), allowNull: false },
    name_en: { type: DataTypes.STRING(120), allowNull: false },
    category_code: { type: DataTypes.STRING(40), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "exercise_item", underscored: true }
);

// ---- exercise_substitution ----
export const ExerciseSubstitution = sequelize.define(
  "exercise_substitution",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    source_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    substitute_item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "exercise_substitution",
    underscored: true,
    indexes: [{ name: "es_source", fields: ["source_item_id"] }],
  }
);

// ---- exercise_plan_note ----
export const ExercisePlanNote = sequelize.define(
  "exercise_plan_note",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    plan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    author_type: { type: DataTypes.ENUM(...ENUM.NOTE_AUTHOR_TYPE), allowNull: false, defaultValue: "doctor" },
    author_id: { type: DataTypes.STRING(40), allowNull: true },
    visibility: { type: DataTypes.ENUM(...ENUM.NOTE_VISIBILITY), allowNull: false, defaultValue: "doctor_private" },
    note: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "exercise_plan_note",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ name: "epn_plan", fields: ["plan_id"] }],
  }
);

export const GROUP_11 = {
  ExercisePlan,
  ExercisePlanVersion,
  ExerciseItem,
  ExerciseSubstitution,
  ExercisePlanNote,
};
