// Migration 004 — Flags + deferred FKs (forward dependencies resolved).
// Tables: flag_rule, flag_rule_version, assessment_flag.
// Adds FK: patient.source_session_id, patient_contact.source_session_id
// (deferred from 001), assessment_session.flag_rule_version_id (deferred from 003).

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

export async function up(queryInterface) {
  await queryInterface.createTable("flag_rule", {
    id: ID,
    rule_id: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(190), allowNull: false },
    tier: { type: DataTypes.ENUM(...ENUM.FLAG_TIER), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...TS,
  });

  await queryInterface.createTable("flag_rule_version", {
    id: ID,
    flag_rule_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "flag_rule", key: "id" } },
    version: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "1.0" },
    tier: { type: DataTypes.ENUM(...ENUM.FLAG_TIER), allowNull: false },
    trigger_json: { type: DataTypes.JSON, allowNull: false },
    question_refs_json: { type: DataTypes.JSON, allowNull: false },
    message_ar: { type: DataTypes.TEXT, allowNull: false },
    message_en: { type: DataTypes.TEXT, allowNull: false },
    severity_config_json: { type: DataTypes.JSON, allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: false },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [{ name: "frv_rule_version", unique: true, fields: ["flag_rule_id", "version"] }],
  });

  await queryInterface.createTable("assessment_flag", {
    id: ID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "assessment_session", key: "id" } },
    flag_rule_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "flag_rule", key: "id" } },
    flag_rule_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "flag_rule_version", key: "id" } },
    tier: { type: DataTypes.ENUM(...ENUM.FLAG_TIER), allowNull: false },
    message_ar: { type: DataTypes.TEXT, allowNull: false },
    message_en: { type: DataTypes.TEXT, allowNull: false },
    question_refs_json: { type: DataTypes.JSON, allowNull: false },
    trigger_context_json: { type: DataTypes.JSON, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.FLAG_STATUS), allowNull: false, defaultValue: "pending" },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    reviewed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
    ...TS,
  }, {
    indexes: [
      { name: "flag_tenant_tier_status", fields: ["tenant_id", "tier", "status"] },
      { name: "flag_session", fields: ["session_id"] },
      { name: "flag_session_rule", unique: true, fields: ["session_id", "flag_rule_id"] },
    ],
  });

  // Deferred FKs (forward dependencies resolved now).
  await queryInterface.addConstraint("patient", {
    name: "fk_patient_source_session",
    type: "foreign key",
    fields: ["source_session_id"],
    references: { table: "assessment_session", field: "id" },
  });
  await queryInterface.addConstraint("patient_contact", {
    name: "fk_patient_contact_source_session",
    type: "foreign key",
    fields: ["source_session_id"],
    references: { table: "assessment_session", field: "id" },
  });
  await queryInterface.addConstraint("assessment_session", {
    name: "fk_assessment_session_flag_rule_version",
    type: "foreign key",
    fields: ["flag_rule_version_id"],
    references: { table: "flag_rule_version", field: "id" },
  });
}
