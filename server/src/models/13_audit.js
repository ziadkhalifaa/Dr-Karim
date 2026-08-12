// Group 13 — Audit / supporting entity.
// Table: audit_log. Append-only; never hard-deleted; NO raw PHI/medical content
// in general audit metadata (§23 / §10 logging restrictions).

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

export const AuditLog = sequelize.define(
  "audit_log",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // null for pre-tenant actions
    actor_type: { type: DataTypes.STRING(40), allowNull: true },
    actor_id: { type: DataTypes.STRING(40), allowNull: true }, // not FK — stays generic
    action: { type: DataTypes.STRING(80), allowNull: false },
    entity: { type: DataTypes.STRING(80), allowNull: false },
    entity_id: { type: DataTypes.STRING(40), allowNull: true },
    entity_ref: { type: DataTypes.STRING(80), allowNull: true }, // e.g. reference_number (safe)
    safe_metadata_json: { type: DataTypes.JSON, allowNull: true }, // non-PHI metadata only
    source_ip_masked: { type: DataTypes.STRING(45), allowNull: true }, // §9 IP masking
  },
  {
    tableName: "audit_log",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { name: "audit_tenant_entity", fields: ["tenant_id", "entity"] },
      { name: "audit_entity_entityid", fields: ["entity", "entity_id"] },
    ],
  }
);

export const GROUP_13 = { AuditLog };
