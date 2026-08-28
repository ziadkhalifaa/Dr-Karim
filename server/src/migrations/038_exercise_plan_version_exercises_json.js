import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.addColumn("exercise_plan_version", "exercises_json", {
    type: DataTypes.JSON,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("exercise_plan_version", "exercises_json");
}
