import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  // Add column image_url to plan_template table
  const tableInfo = await queryInterface.describeTable("plan_template");
  if (!tableInfo.image_url) {
    await queryInterface.addColumn("plan_template", "image_url", {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    });
  }
}

export async function down(queryInterface) {
  const tableInfo = await queryInterface.describeTable("plan_template");
  if (tableInfo.image_url) {
    await queryInterface.removeColumn("plan_template", "image_url");
  }
}
