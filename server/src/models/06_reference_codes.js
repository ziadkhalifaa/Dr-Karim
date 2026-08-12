// Group 06 — Reference code catalogs (GLOBAL, bilingual tiny stable sets, §16/§20).
// Tables (same shape): relationship_code, goal_code, diet_pattern_code,
// reaction_code, severity_code, condition_code, appointment_status, service_status.
// These are "code + name_ar/name_en" reference tables seeded from the approved
// spec (values below). Operational status ENUMs (appointment.status etc.) mirror
// these catalog rows — the catalogs hold the stable labels; the ENUM holds the
// machine state (documented as reference registry, not FK-enforced, in this phase).

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

function defineCodeTable(name) {
  return sequelize.define(
    name,
    {
      id: BIGID,
      code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      name_ar: { type: DataTypes.STRING(120), allowNull: false },
      name_en: { type: DataTypes.STRING(120), allowNull: false },
      sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { tableName: name, underscored: true }
  );
}

export const RelationshipCode = defineCodeTable("relationship_code");
export const GoalCode = defineCodeTable("goal_code");
export const DietPatternCode = defineCodeTable("diet_pattern_code");
export const ReactionCode = defineCodeTable("reaction_code");
export const SeverityCode = defineCodeTable("severity_code");
export const ConditionCode = defineCodeTable("condition_code");
export const AppointmentStatus = defineCodeTable("appointment_status");
export const ServiceStatus = defineCodeTable("service_status");

export const GROUP_06 = {
  RelationshipCode,
  GoalCode,
  DietPatternCode,
  ReactionCode,
  SeverityCode,
  ConditionCode,
  AppointmentStatus,
  ServiceStatus,
};