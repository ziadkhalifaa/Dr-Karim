// Migration 031 — Booking slots for the appointment engine.
// Table: appointment_slot (concrete bookable time windows).
// A slot is a single bookable row; interleaved biweekly recurrences share a
// series_ref so the whole series can be cancelled together.
// Also adds subscription_entitlement.period_unit so quota enforcement can count
// used sessions inside the current week/month window.

import { DataTypes, Sequelize } from "sequelize";
import { ENUM } from "../config/constants.js";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};
const TENANT_FK = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } };

export async function up(queryInterface) {
  await queryInterface.createTable("appointment_slot", {
    id: ID,
    tenant_id: TENANT_FK,
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "doctor", key: "id" } },
    appointment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "appointment", key: "id" } },
    series_ref: { type: DataTypes.STRING(64), allowNull: true },
    starts_at: { type: DataTypes.DATE, allowNull: false },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    duration_min: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.SLOT_STATUS), allowNull: false, defaultValue: "open" },
    branch_ref: { type: DataTypes.STRING(40), allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "as_tenant_doctor_start", fields: ["tenant_id", "doctor_id", "starts_at"] },
      { name: "as_tenant_status_start", fields: ["tenant_id", "status", "starts_at"] },
      { name: "as_tenant_series", fields: ["tenant_id", "series_ref"] },
    ],
  });

  await queryInterface.addColumn("subscription_entitlement", "period_unit", {
    type: DataTypes.STRING(20),
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("subscription_entitlement", "period_unit");
  await queryInterface.dropTable("appointment_slot");
}