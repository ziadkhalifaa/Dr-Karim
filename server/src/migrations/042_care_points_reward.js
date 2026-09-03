// Migration 042 — Points & rewards: patient point ledger and reward redemptions.

import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("care_points", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    care_day_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    activity_instance_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reason: {
      type: DataTypes.ENUM(
        "program_join", "exercise_completed", "nutrition_completed",
        "checkin", "streak_bonus", "redeemed", "custom"
      ),
      allowNull: false,
    },
    reference_id: { type: DataTypes.STRING(120), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.literal("CURRENT_TIMESTAMP") },
  });

  await queryInterface.createTable("care_reward", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    points_spent: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("approved", "claimed", "cancelled"),
      allowNull: false,
      defaultValue: "approved",
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.literal("CURRENT_TIMESTAMP") },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("care_reward");
  await queryInterface.dropTable("care_points");
}
