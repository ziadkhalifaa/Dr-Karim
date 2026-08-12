// Migration 017 — patient confirmation provenance used by Phase 3B.

import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.addColumn("patient", "confirmed_by", {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: { model: "doctor", key: "id" },
  });
  await queryInterface.addIndex("patient", ["confirmed_by"], { name: "patient_confirmed_by" });
}
