import { DataTypes } from "sequelize";

export async function up(queryInterface, sequelize) {
  const table = await queryInterface.describeTable("payment");

  if (!table.upgrade_json) {
    await queryInterface.addColumn("payment", "upgrade_json", {
      type: DataTypes.JSON,
      allowNull: true,
    });
  }
}