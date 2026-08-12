// Group 04 — Flags (two tiers; storage/catalog only, §3, §10).
// Tables: flag_rule, flag_rule_version, assessment_flag.
// The derivation ALGORITHM is NOT implemented in this phase — only storage +
// catalog support. trigger_json records the approved semantics by referencing
// the single-source frontend module (src/features/assessment/logic/flags.js).

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- flag_rule (registry, mutable metadata) ----
export const FlagRule = sequelize.define(
  "flag_rule",
  {
    id: BIGID,
    rule_id: { type: DataTypes.STRING(10), allowNull: false, unique: true }, // RU1..RU9 / RS1..RS14
    title: { type: DataTypes.STRING(190), allowNull: false },
    tier: { type: DataTypes.ENUM(...ENUM.FLAG_TIER), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "flag_rule", underscored: true }
);

// ---- flag_rule_version (immutable published rule snapshot) ----
export const FlagRuleVersion = sequelize.define(
  "flag_rule_version",
  {
    id: BIGID,
    flag_rule_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    version: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "1.0" },
    tier: { type: DataTypes.ENUM(...ENUM.FLAG_TIER), allowNull: false },
    trigger_json: { type: DataTypes.JSON, allowNull: false }, // approved semantics snapshot (§3)
    question_refs_json: { type: DataTypes.JSON, allowNull: false }, // ["Q04_E1", ...]
    message_ar: { type: DataTypes.TEXT, allowNull: false },
    message_en: { type: DataTypes.TEXT, allowNull: false },
    severity_config_json: { type: DataTypes.JSON, allowNull: true }, // future configurable severity (§3)
    published_at: { type: DataTypes.DATE, allowNull: false },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    tableName: "flag_rule_version",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ name: "frv_rule_version", unique: true, fields: ["flag_rule_id", "version"] }],
  }
);

// ---- assessment_flag (context-carrying snapshot columns, immutable at submit) ----
export const AssessmentFlag = sequelize.define(
  "assessment_flag",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    flag_rule_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    flag_rule_version_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    tier: { type: DataTypes.ENUM(...ENUM.FLAG_TIER), allowNull: false }, // snapshot
    message_ar: { type: DataTypes.TEXT, allowNull: false }, // snapshot (exact published wording)
    message_en: { type: DataTypes.TEXT, allowNull: false }, // snapshot
    question_refs_json: { type: DataTypes.JSON, allowNull: false }, // snapshot
    trigger_context_json: { type: DataTypes.JSON, allowNull: true }, // minimal firing answers (§3)
    status: { type: DataTypes.ENUM(...ENUM.FLAG_STATUS), allowNull: false, defaultValue: "pending" },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    reviewed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // FK doctor
  },
  {
    tableName: "assessment_flag",
    underscored: true,
    indexes: [
      { name: "flag_tenant_tier_status", fields: ["tenant_id", "tier", "status"] }, // §17
      { name: "flag_session", fields: ["session_id"] }, // §17
      { name: "flag_session_rule", unique: true, fields: ["session_id", "flag_rule_id"] },
    ],
  }
);

export const GROUP_04 = { FlagRule, FlagRuleVersion, AssessmentFlag };
