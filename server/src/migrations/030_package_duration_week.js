import { DataTypes } from "sequelize";

// Forward-only (§21): packages may now be billed weekly as well as monthly.
// MySQL ENUM columns are altered with MODIFY COLUMN which never drops rows.
export async function up(queryInterface) {
  const table = await queryInterface.describeTable("package");
  if (table.duration_unit) {
    await queryInterface.changeColumn("package", "duration_unit", {
      type: DataTypes.ENUM("one_time", "month", "week"),
      allowNull: false,
    });
  }
}