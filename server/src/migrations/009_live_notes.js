// Migration 009 — Live sessions (Daily-neutral) + session notes (§28/§29/§31).
// Tables: video_meeting_provider, live_session, video_meeting, session_note,
// session_note_clarification. No Daily-specific columns on core entities; no
// recording; notes append-only (created_at only).

import { DataTypes, Sequelize } from "sequelize";
import { ENUM } from "../config/constants.js";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};
const ONLY_CREATED_AT = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};
const TENANT_FK = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } };

export async function up(queryInterface) {
  await queryInterface.createTable("video_meeting_provider", {
    id: ID,
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...TS,
  });

  await queryInterface.createTable("live_session", {
    id: ID,
    tenant_id: TENANT_FK,
    appointment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "appointment", key: "id" } },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "doctor", key: "id" } },
    scheduled_at: { type: DataTypes.DATE, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    ended_at: { type: DataTypes.DATE, allowNull: true },
    duration_actual_sec: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.LIVE_SESSION_STATUS), allowNull: false, defaultValue: "not_started" },
    ...TS,
  }, {
    indexes: [
      { name: "live_session_tenant_status", fields: ["tenant_id", "status"] },
      { name: "live_session_appointment", fields: ["appointment_id"] },
    ],
  });

  await queryInterface.createTable("video_meeting", {
    id: ID,
    tenant_id: TENANT_FK,
    live_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "live_session", key: "id" } },
    provider_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "video_meeting_provider", key: "id" } },
    external_room_ref: { type: DataTypes.STRING(190), allowNull: true },
    external_session_ref: { type: DataTypes.STRING(190), allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.VIDEO_MEETING_STATUS), allowNull: false, defaultValue: "pending" },
    started_at: { type: DataTypes.DATE, allowNull: true },
    ended_at: { type: DataTypes.DATE, allowNull: true },
    duration_sec: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "vm_tenant_session", fields: ["tenant_id", "live_session_id"] },
      { name: "vm_tenant_status", fields: ["tenant_id", "status"] },
    ],
  });

  await queryInterface.createTable("session_note", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "doctor", key: "id" } },
    appointment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "appointment", key: "id" } },
    live_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "live_session", key: "id" } },
    parent_note_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "session_note", key: "id" } },
    visibility: { type: DataTypes.ENUM(...ENUM.NOTE_VISIBILITY), allowNull: false, defaultValue: "doctor_private" },
    body: { type: DataTypes.TEXT("medium"), allowNull: false },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [
      { name: "note_tenant_patient", fields: ["tenant_id", "patient_id"] },
      { name: "note_parent", fields: ["parent_note_id"] },
    ],
  });

  await queryInterface.createTable("session_note_clarification", {
    id: ID,
    tenant_id: TENANT_FK,
    note_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "session_note", key: "id" } },
    original_note_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "session_note", key: "id" } },
    reason: { type: DataTypes.TEXT, allowNull: true },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [
      { name: "snc_note", fields: ["note_id"] },
      { name: "snc_original", fields: ["original_note_id"] },
    ],
  });
}
