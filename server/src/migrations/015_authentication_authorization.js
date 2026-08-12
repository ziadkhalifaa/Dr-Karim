// Migration 015 — authentication and authorization foundation.
// Auth identity is separate from clinical doctor/patient profile data.
import { DataTypes, Sequelize } from "sequelize";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};
const ROLES = ["doctor", "staff", "patient"];

export async function up(queryInterface) {
  await queryInterface.createTable("auth_user", {
    id: ID,
    email: { type: DataTypes.STRING(190), allowNull: true, unique: true },
    phone_canonical: { type: DataTypes.STRING(20), allowNull: true, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    user_type: { type: DataTypes.ENUM(...ROLES), allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "doctor", key: "id" } },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "patient", key: "id" } },
    status: { type: DataTypes.ENUM("enabled", "disabled"), allowNull: false, defaultValue: "enabled" },
    failed_login_count: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    locked_until: { type: DataTypes.DATE, allowNull: true },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    password_changed_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, { indexes: [{ name: "auth_user_phone", fields: ["phone_canonical"] }] });

  await queryInterface.createTable("auth_user_tenant", {
    id: ID,
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "auth_user", key: "id" } },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    role: { type: DataTypes.ENUM(...ROLES), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...TS,
  }, { indexes: [
    { name: "auth_membership_unique", unique: true, fields: ["user_id", "tenant_id"] },
    { name: "auth_membership_tenant_role", fields: ["tenant_id", "role", "active"] },
  ] });

  await queryInterface.createTable("auth_refresh_token", {
    id: ID,
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "auth_user", key: "id" } },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    family_id: { type: DataTypes.STRING(36), allowNull: false },
    token_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    replaced_by_hash: { type: DataTypes.CHAR(64), allowNull: true },
    last_used_at: { type: DataTypes.DATE, allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
    source_ip_masked: { type: DataTypes.STRING(45), allowNull: true },
    ...TS,
  }, { indexes: [
    { name: "auth_refresh_family", fields: ["family_id", "revoked_at"] },
    { name: "auth_refresh_user", fields: ["user_id", "expires_at"] },
  ] });

  await queryInterface.createTable("auth_password_reset", {
    id: ID,
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "auth_user", key: "id" } },
    token_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, { indexes: [{ name: "auth_reset_user", fields: ["user_id", "expires_at"] }] });
}
