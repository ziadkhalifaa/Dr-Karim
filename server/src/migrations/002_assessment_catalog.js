// Migration 002 — Assessment catalog (GLOBAL): question_catalog,
// assessment_definition, question_version_cfg.

import { DataTypes, Sequelize } from "sequelize";
import { ENUM } from "../config/constants.js";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};

export async function up(queryInterface) {
  await queryInterface.createTable("question_catalog", {
    id: ID,
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    section_no: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    question_type: { type: DataTypes.ENUM(...ENUM.QUESTION_TYPE), allowNull: false },
    data_path: { type: DataTypes.STRING(120), allowNull: true },
    ...TS,
  });

  await queryInterface.createTable("assessment_definition", {
    id: ID,
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    version: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    title_ar: { type: DataTypes.STRING(190), allowNull: true },
    title_en: { type: DataTypes.STRING(190), allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.DEFINITION_STATUS), allowNull: false, defaultValue: "draft" },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    published_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  });

  await queryInterface.createTable("question_version_cfg", {
    id: ID,
    definition_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "assessment_definition", key: "id" } },
    question_catalog_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "question_catalog", key: "id" } },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    label_ar: { type: DataTypes.TEXT, allowNull: false },
    label_en: { type: DataTypes.TEXT, allowNull: false },
    help_ar: { type: DataTypes.TEXT, allowNull: true },
    help_en: { type: DataTypes.TEXT, allowNull: true },
    placeholder_ar: { type: DataTypes.TEXT, allowNull: true },
    placeholder_en: { type: DataTypes.TEXT, allowNull: true },
    required: { type: DataTypes.ENUM(...ENUM.REQUIRED_FLAG), allowNull: false },
    options_json: { type: DataTypes.JSON, allowNull: true },
    validation_json: { type: DataTypes.JSON, allowNull: true },
    conditional_json: { type: DataTypes.JSON, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "qvc_def_question", unique: true, fields: ["definition_id", "question_catalog_id"] },
      { name: "qvc_definition_sort", fields: ["definition_id", "sort_order"] },
    ],
  });
}
