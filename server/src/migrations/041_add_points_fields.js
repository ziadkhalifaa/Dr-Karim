// Migration 041 — Points & rewards: add points_price to product and
// points_reward to care_activity_definition.

import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.addColumn("product", "points_price", {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  });
  await queryInterface.addColumn("care_activity_definition", "points_reward", {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("product", "points_price");
  await queryInterface.removeColumn("care_activity_definition", "points_reward");
}
