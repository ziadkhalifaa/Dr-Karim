// Migration 019 — patient-visible/private plan note policy.

import { DataTypes } from "sequelize";
import { ENUM } from "../config/constants.js";

export async function up(queryInterface) {
  for (const table of ["nutrition_plan_note", "exercise_plan_note"]) {
    await queryInterface.addColumn(table, "visibility", { type: DataTypes.ENUM(...ENUM.NOTE_VISIBILITY), allowNull: false, defaultValue: "doctor_private" });
    await queryInterface.addIndex(table, ["plan_id", "visibility"], { name: `${table}_visibility` });
  }
}
