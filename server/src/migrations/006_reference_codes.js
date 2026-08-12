// Migration 006 — Reference code catalogs (GLOBAL bilingual tables, §16/§20).
// Same shape: relationship_code, goal_code, diet_pattern_code, reaction_code,
// severity_code, condition_code, appointment_status, service_status.
// Seed values live in the seed phase; these are structural only.

import { DataTypes, Sequelize } from "sequelize";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};

const CODE_TABLES = [
  "relationship_code",
  "goal_code",
  "diet_pattern_code",
  "reaction_code",
  "severity_code",
  "condition_code",
  "appointment_status",
  "service_status",
];

export async function up(queryInterface) {
  for (const name of CODE_TABLES) {
    await queryInterface.createTable(name, {
      id: ID,
      code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      name_ar: { type: DataTypes.STRING(120), allowNull: false },
      name_en: { type: DataTypes.STRING(120), allowNull: false },
      sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      ...TS,
    });
  }
}