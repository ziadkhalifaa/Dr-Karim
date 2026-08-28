import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  const table = await queryInterface.describeTable("exercise_plan_version");
  if (!table.exercises_json) {
    await queryInterface.addColumn("exercise_plan_version", "exercises_json", {
      type: DataTypes.JSON,
      allowNull: true,
    });
  }
}

export async function down(queryInterface) {
  const table = await queryInterface.describeTable("exercise_plan_version");
  if (table.exercises_json) {
    await queryInterface.removeColumn("exercise_plan_version", "exercises_json");
  }
}
