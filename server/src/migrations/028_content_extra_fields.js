import { DataTypes } from "sequelize";

export async function up(queryInterface, sequelize) {
  const table = await queryInterface.describeTable("content");

  if (!table.cover_image_url) {
    await queryInterface.addColumn("content", "cover_image_url", {
      type: DataTypes.STRING(500),
      allowNull: true,
    });
  }

  if (!table.excerpt) {
    await queryInterface.addColumn("content", "excerpt", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }

  if (!table.author_name) {
    await queryInterface.addColumn("content", "author_name", {
      type: DataTypes.STRING(120),
      allowNull: true,
    });
  }

  if (!table.read_time_minutes) {
    await queryInterface.addColumn("content", "read_time_minutes", {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    });
  }
}
