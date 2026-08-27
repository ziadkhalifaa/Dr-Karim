export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("exercise_plan_version", "exercises_json", {
    type: Sequelize.JSON,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("exercise_plan_version", "exercises_json");
}
