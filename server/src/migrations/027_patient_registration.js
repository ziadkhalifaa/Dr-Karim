// Migration 027 — Phase 6D: Patient onboarding flow.
// Extends patient.status with `pending_payment` (account created right after
// assessment; becomes "active" when an approved payment activates the plan).

import { DataTypes } from "sequelize";
import { ENUM } from "../config/constants.js";

export async function up(queryInterface) {
  await queryInterface.changeColumn("patient", "status", {
    type: DataTypes.ENUM(...ENUM.PATIENT_STATUS),
    allowNull: false,
    defaultValue: "active",
  });
}

export async function down(queryInterface) {
  // Forward-only (§21): no destructive rollback. Downgrades are new migrations.
  await queryInterface.changeColumn("patient", "status", {
    type: DataTypes.ENUM("active", "inactive", "archived"),
    allowNull: false,
    defaultValue: "active",
  });
}