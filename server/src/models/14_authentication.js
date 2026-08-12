// Group 14 — auth identity, tenant membership, refresh sessions, password reset.
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };
const ROLES = ["doctor", "staff", "patient"];

export const AuthUser = sequelize.define("auth_user", {
  id: BIGID, email: { type: DataTypes.STRING(190), allowNull: true, unique: true },
  phone_canonical: { type: DataTypes.STRING(20), allowNull: true, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  user_type: { type: DataTypes.ENUM(...ROLES), allowNull: false },
  doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  status: { type: DataTypes.ENUM("enabled", "disabled"), allowNull: false, defaultValue: "enabled" },
  failed_login_count: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  locked_until: { type: DataTypes.DATE, allowNull: true }, last_login_at: { type: DataTypes.DATE, allowNull: true }, password_changed_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "auth_user", underscored: true });

export const AuthUserTenant = sequelize.define("auth_user_tenant", {
  id: BIGID, user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, role: { type: DataTypes.ENUM(...ROLES), allowNull: false }, active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: "auth_user_tenant", underscored: true });

export const AuthRefreshToken = sequelize.define("auth_refresh_token", {
  id: BIGID, user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, family_id: { type: DataTypes.STRING(36), allowNull: false }, token_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true }, expires_at: { type: DataTypes.DATE, allowNull: false }, revoked_at: { type: DataTypes.DATE, allowNull: true }, replaced_by_hash: { type: DataTypes.CHAR(64), allowNull: true }, last_used_at: { type: DataTypes.DATE, allowNull: true }, user_agent: { type: DataTypes.STRING(255), allowNull: true }, source_ip_masked: { type: DataTypes.STRING(45), allowNull: true },
}, { tableName: "auth_refresh_token", underscored: true });

export const AuthPasswordReset = sequelize.define("auth_password_reset", {
  id: BIGID, user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, token_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true }, expires_at: { type: DataTypes.DATE, allowNull: false }, used_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "auth_password_reset", underscored: true });

export const GROUP_14 = { AuthUser, AuthUserTenant, AuthRefreshToken, AuthPasswordReset };
