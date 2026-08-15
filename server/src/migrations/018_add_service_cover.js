import { DataTypes } from "sequelize";

export async function up(queryInterface, sequelize) {
  // Add cover_image_url to service table if it doesn't exist
  const table = await queryInterface.describeTable("service");
  if (!table.cover_image_url) {
    await queryInterface.addColumn("service", "cover_image_url", {
      type: DataTypes.STRING(500),
      allowNull: true,
    });
  }
}
