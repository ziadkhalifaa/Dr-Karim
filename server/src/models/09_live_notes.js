// Group 09 — Live sessions (Daily-neutral) + session notes.
// Tables: video_meeting_provider, video_meeting, live_session, session_note,
// session_note_clarification.
// §28/§29: provider-neutral core only; no Daily fields on Patient/Doctor/
// Appointment; NO recording default; ephemeral tokens never stored.
// §31: notes default doctor_private; append-only corrections.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- video_meeting_provider (catalog, global) ----
export const VideoMeetingProvider = sequelize.define(
  "video_meeting_provider",
  {
    id: BIGID,
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true }, // daily
    name: { type: DataTypes.STRING(80), allowNull: false },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "video_meeting_provider", underscored: true }
);

// ---- video_meeting (provider-neutral technical metadata) ----
export const VideoMeeting = sequelize.define(
  "video_meeting",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    live_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    provider_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    external_room_ref: { type: DataTypes.STRING(190), allowNull: true },
    external_room_url: { type: DataTypes.STRING(255), allowNull: true },
    external_session_ref: { type: DataTypes.STRING(190), allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.VIDEO_MEETING_STATUS), allowNull: false, defaultValue: "pending" },
    started_at: { type: DataTypes.DATE, allowNull: true },
    ended_at: { type: DataTypes.DATE, allowNull: true },
    duration_sec: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "video_meeting",
    underscored: true,
    indexes: [
      { name: "vm_tenant_session", fields: ["tenant_id", "live_session_id"] },
      { name: "vm_tenant_status", fields: ["tenant_id", "status"] },
    ],
  }
);

// ---- live_session ----
export const LiveSession = sequelize.define(
  "live_session",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    appointment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // 1:0..1
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    scheduled_at: { type: DataTypes.DATE, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    ended_at: { type: DataTypes.DATE, allowNull: true },
    duration_actual_sec: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.LIVE_SESSION_STATUS), allowNull: false, defaultValue: "not_started" },
  },
  {
    tableName: "live_session",
    underscored: true,
    indexes: [
      { name: "live_session_tenant_status", fields: ["tenant_id", "status"] },
      { name: "live_session_appointment", fields: ["appointment_id"] },
    ],
  }
);

// ---- session_note (clinical follow-up note, §31) ----
export const SessionNote = sequelize.define(
  "session_note",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    appointment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    live_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    parent_note_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // correction chain (append-only)
    visibility: { type: DataTypes.ENUM(...ENUM.NOTE_VISIBILITY), allowNull: false, defaultValue: "doctor_private" },
    body: { type: DataTypes.TEXT("medium"), allowNull: false }, // PHI — field-encryption target (§10)
  },
  {
    tableName: "session_note",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { name: "note_tenant_patient", fields: ["tenant_id", "patient_id"] },
      { name: "note_parent", fields: ["parent_note_id"] },
    ],
  }
);

// ---- session_note_clarification (cross-reference of a correction event) ----
export const SessionNoteClarification = sequelize.define(
  "session_note_clarification",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    note_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, // the new (correcting) note
    original_note_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, // the preserved original
    reason: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "session_note_clarification",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { name: "snc_note", fields: ["note_id"] },
      { name: "snc_original", fields: ["original_note_id"] },
    ],
  }
);

export const GROUP_09 = {
  VideoMeetingProvider,
  VideoMeeting,
  LiveSession,
  SessionNote,
  SessionNoteClarification,
};
