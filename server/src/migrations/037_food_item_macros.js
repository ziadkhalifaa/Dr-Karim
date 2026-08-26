// Migration 037 — Add macros_json column to the existing food_item table.
// The original 010 migration omitted this column; the seed previously tried to
// add it via `FoodItem.sync({ alter: true })`, which fails on the production
// food_item table ("Too many keys specified; max 64 keys allowed"). Adding the
// column directly (no index) is safe and idempotent.

import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  const [cols] = await queryInterface.sequelize.query(
    "SHOW COLUMNS FROM food_item LIKE 'macros_json'"
  );
  if (!cols || cols.length === 0) {
    await queryInterface.addColumn("food_item", "macros_json", {
      type: DataTypes.JSON,
      allowNull: true,
    });
  }
}

export async function down(queryInterface) {
  const [cols] = await queryInterface.sequelize.query(
    "SHOW COLUMNS FROM food_item LIKE 'macros_json'"
  );
  if (cols && cols.length) {
    await queryInterface.removeColumn("food_item", "macros_json");
  }
}
