// Group 22 — Messaging / Direct Chat.
// Tables: chat_session, chat_message.
// Each patient gets a single chat session per tenant (doctor can see all).
// Messages are threaded under a session and support optional attachments.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- chat_session ----
export const ChatSession = sequelize.define(
  "chat_session",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "closed"),
      allowNull: false,
      defaultValue: "active",
    },
    last_message_at: { type: DataTypes.DATE, allowNull: true },
    unread_doctor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    unread_patient: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "chat_session",
    underscored: true,
    indexes: [
      { unique: true, fields: ["tenant_id", "patient_id"] }, // one session per patient per tenant
    ],
  }
);

// ---- chat_message ----
export const ChatMessage = sequelize.define(
  "chat_message",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sender_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, // FK → auth_user.id
    sender_role: {
      type: DataTypes.ENUM("patient", "doctor", "staff"),
      allowNull: false,
    },
    content: { type: DataTypes.TEXT, allowNull: true }, // null if attachment-only message
    attachment_url: { type: DataTypes.STRING(500), allowNull: true },
    attachment_type: { type: DataTypes.ENUM("image", "file", "audio"), allowNull: true },
    read_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "chat_message", underscored: true }
);

export const GROUP_22 = { ChatSession, ChatMessage };
