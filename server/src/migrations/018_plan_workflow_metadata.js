// Migration 018 — Phase 3C plan versioning and meal metadata.

import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  for (const table of ["nutrition_plan_version", "exercise_plan_version"]) {
    await queryInterface.addColumn(table, "previous_version_id", {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: table, key: "id" },
    });
    await queryInterface.addColumn(table, "approved_by", {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: "doctor", key: "id" },
    });
    await queryInterface.addColumn(table, "approved_at", { type: DataTypes.DATE, allowNull: true });
    await queryInterface.addIndex(table, ["previous_version_id"], { name: `${table}_previous_version` });
  }
  await queryInterface.addColumn("meal_template", "day_number", { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
  await queryInterface.addColumn("meal_template", "instructions", { type: DataTypes.TEXT, allowNull: true });
  await queryInterface.addColumn("food_substitution", "meal_item_id", {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: { model: "meal_item", key: "id" },
  });
  await queryInterface.addIndex("food_substitution", ["meal_item_id"], { name: "fs_meal_item" });
}
