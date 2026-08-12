// Group 15 — append-only doctor review notes.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

export const DoctorReviewNote = sequelize.define("doctor_review_note", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  parent_note_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  author_type: { type: DataTypes.ENUM("doctor", "staff"), allowNull: false },
  author_id: { type: DataTypes.STRING(40), allowNull: false },
  visibility: { type: DataTypes.ENUM(...ENUM.NOTE_VISIBILITY), allowNull: false, defaultValue: "doctor_private" },
  body: { type: DataTypes.TEXT("medium"), allowNull: false },
  correction_reason: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "doctor_review_note",
  underscored: true,
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  indexes: [
    { name: "review_note_review_created", fields: ["review_id", "created_at"] },
    { name: "review_note_parent", fields: ["parent_note_id"] },
  ],
});

export const GROUP_15 = { DoctorReviewNote };
