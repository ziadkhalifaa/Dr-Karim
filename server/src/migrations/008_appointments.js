// Migration 008 — Appointments (§15/§28). Booking lifecycle only; no engine.

import { DataTypes, Sequelize } from "sequelize";
import { ENUM } from "../config/constants.js";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};

export async function up(queryInterface) {
  await queryInterface.createTable("appointment", {
    id: ID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "doctor", key: "id" } },
    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "service", key: "id" } },
    type: { type: DataTypes.ENUM(...ENUM.APPOINTMENT_TYPE), allowNull: false, defaultValue: "clinic" },
    status: { type: DataTypes.ENUM(...ENUM.APPOINTMENT_STATUS), allowNull: false, defaultValue: "pending" },
    scheduled_start_at: { type: DataTypes.DATE, allowNull: false },
    scheduled_end_at: { type: DataTypes.DATE, allowNull: true },
    duration_min: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    branch_ref: { type: DataTypes.STRING(40), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    confirmation_sent_at: { type: DataTypes.DATE, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "appt_tenant_doctor_start", fields: ["tenant_id", "doctor_id", "scheduled_start_at"] },
      { name: "appt_tenant_status", fields: ["tenant_id", "status"] },
    ],
  });
}
