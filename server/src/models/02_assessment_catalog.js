// Group 02 — Assessment definitions / versioning (GLOBAL catalogs, §7).
// Tables: question_catalog, assessment_definition, question_version_cfg.
// Frozen per published definition (§4); historical sessions bind to a
// definition, never re-interpret against newer ones.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- question_catalog (global stable code registry) ----
export const QuestionCatalog = sequelize.define(
  "question_catalog",
  {
    id: BIGID,
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true }, // e.g. Q01_01, C04, Q10_01
    section_no: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 }, // 0 = contact/safety step
    question_type: { type: DataTypes.ENUM(...ENUM.QUESTION_TYPE), allowNull: false },
    data_path: { type: DataTypes.STRING(120), allowNull: true }, // pseudo-JSON path, spec §7
  },
  { tableName: "question_catalog", underscored: true }
);

// ---- assessment_definition (version identity; only one active, §4) ----
export const AssessmentDefinition = sequelize.define(
  "assessment_definition",
  {
    id: BIGID,
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true }, // nutrition-assessment
    version: { type: DataTypes.STRING(10), allowNull: false, unique: true }, // semantic 1.0
    title_ar: { type: DataTypes.STRING(190), allowNull: true },
    title_en: { type: DataTypes.STRING(190), allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.DEFINITION_STATUS), allowNull: false, defaultValue: "draft" },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    published_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "assessment_definition", underscored: true }
);

// ---- question_version_cfg (frozen per-definition question configuration) ----
export const QuestionVersionCfg = sequelize.define(
  "question_version_cfg",
  {
    id: BIGID,
    definition_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    question_catalog_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    label_ar: { type: DataTypes.TEXT, allowNull: false },
    label_en: { type: DataTypes.TEXT, allowNull: false },
    help_ar: { type: DataTypes.TEXT, allowNull: true },
    help_en: { type: DataTypes.TEXT, allowNull: true },
    placeholder_ar: { type: DataTypes.TEXT, allowNull: true },
    placeholder_en: { type: DataTypes.TEXT, allowNull: true },
    required: { type: DataTypes.ENUM(...ENUM.REQUIRED_FLAG), allowNull: false },
    options_json: { type: DataTypes.JSON, allowNull: true }, // [{value, ar, en}]
    validation_json: { type: DataTypes.JSON, allowNull: true }, // ranges/patterns/scale
    conditional_json: { type: DataTypes.JSON, allowNull: true }, // visibility/branch facts (§4)
  },
  {
    tableName: "question_version_cfg",
    underscored: true,
    indexes: [
      { name: "qvc_def_question", unique: true, fields: ["definition_id", "question_catalog_id"] },
      { name: "qvc_definition_sort", fields: ["definition_id", "sort_order"] },
    ],
  }
);

export const GROUP_02 = { QuestionCatalog, AssessmentDefinition, QuestionVersionCfg };