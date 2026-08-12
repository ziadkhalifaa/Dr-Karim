// Migration 016 — Phase 3B review notes and staff audit attribution.

import { DataTypes, Sequelize } from "sequelize";
import { ENUM } from "../config/constants.js";

export async function up(queryInterface) {
  await queryInterface.changeColumn("doctor_review_event", "actor_type", {
    type: DataTypes.ENUM(...ENUM.ACTOR_TYPE),
    allowNull: false,
  });
  await queryInterface.createTable("doctor_review_note", {
    id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "doctor_review", key: "id" } },
    parent_note_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor_review_note", key: "id" } },
    author_type: { type: DataTypes.ENUM("doctor", "staff"), allowNull: false },
    author_id: { type: DataTypes.STRING(40), allowNull: false },
    visibility: { type: DataTypes.ENUM(...ENUM.NOTE_VISIBILITY), allowNull: false, defaultValue: "doctor_private" },
    body: { type: DataTypes.TEXT("medium"), allowNull: false },
    correction_reason: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  }, {
    indexes: [
      { name: "review_note_review_created", fields: ["review_id", "created_at"] },
      { name: "review_note_parent", fields: ["parent_note_id"] },
    ],
  });
}
