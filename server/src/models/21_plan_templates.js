import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- plan_template ----
export const PlanTemplate = sequelize.define(
  "plan_template",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    doctor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    domain: { type: DataTypes.ENUM("nutrition", "exercise"), allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    content_json: { type: DataTypes.JSON, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "plan_template",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { name: "pt_tenant_doctor_domain", fields: ["tenant_id", "doctor_id", "domain"] },
    ],
  }
);

export const GROUP_21 = { PlanTemplate };
