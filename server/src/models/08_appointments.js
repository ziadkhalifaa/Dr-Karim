// Group 08 — Appointments (future-ready booking lifecycle, §15/§28).
// Tables: appointment, appointment_slot (bookable time windows).

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

export const Appointment = sequelize.define(
  "appointment",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    type: { type: DataTypes.ENUM(...ENUM.APPOINTMENT_TYPE), allowNull: false, defaultValue: "clinic" },
    status: { type: DataTypes.ENUM(...ENUM.APPOINTMENT_STATUS), allowNull: false, defaultValue: "pending" },
    scheduled_start_at: { type: DataTypes.DATE, allowNull: false },
    scheduled_end_at: { type: DataTypes.DATE, allowNull: true },
    duration_min: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    branch_ref: { type: DataTypes.STRING(40), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true }, // PHI candidate (§10) if clinically sensitive
    confirmation_sent_at: { type: DataTypes.DATE, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "appointment",
    underscored: true,
    indexes: [
      { name: "appt_tenant_doctor_start", fields: ["tenant_id", "doctor_id", "scheduled_start_at"] }, // §17
      { name: "appt_tenant_status", fields: ["tenant_id", "status"] },
    ],
  }
);

export const AppointmentSlot = sequelize.define(
  "appointment_slot",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    appointment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    series_ref: { type: DataTypes.STRING(64), allowNull: true },
    starts_at: { type: DataTypes.DATE, allowNull: false },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    duration_min: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.SLOT_STATUS), allowNull: false, defaultValue: "open" },
    branch_ref: { type: DataTypes.STRING(40), allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "appointment_slot",
    underscored: true,
    indexes: [
      { name: "as_tenant_doctor_start", fields: ["tenant_id", "doctor_id", "starts_at"] },
      { name: "as_tenant_status_start", fields: ["tenant_id", "status", "starts_at"] },
      { name: "as_tenant_series", fields: ["tenant_id", "series_ref"] },
    ],
  }
);

export const GROUP_08 = { Appointment, AppointmentSlot };