// Migration 013 — Audit log (append-only; no raw PHI in safe metadata, §23/§10).

import { DataTypes, Sequelize } from "sequelize";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const ONLY_CREATED_AT = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};

export async function up(queryInterface) {
  await queryInterface.createTable("audit_log", {
    id: ID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "tenant", key: "id" } },
    actor_type: { type: DataTypes.STRING(40), allowNull: true },
    actor_id: { type: DataTypes.STRING(40), allowNull: true },
    action: { type: DataTypes.STRING(80), allowNull: false },
    entity: { type: DataTypes.STRING(80), allowNull: false },
    entity_id: { type: DataTypes.STRING(40), allowNull: true },
    entity_ref: { type: DataTypes.STRING(80), allowNull: true },
    safe_metadata_json: { type: DataTypes.JSON, allowNull: true },
    source_ip_masked: { type: DataTypes.STRING(45), allowNull: true },
    ...ONLY_CREATED_AT,
  }, {
    indexes: [
      { name: "audit_tenant_entity", fields: ["tenant_id", "entity"] },
      { name: "audit_entity_entityid", fields: ["entity", "entity_id"] },
    ],
  });
}