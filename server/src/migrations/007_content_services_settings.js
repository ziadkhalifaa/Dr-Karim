// Migration 007 — Services / content / clinic / settings.
// Tables: service_category(+translation), service(+translation),
// content_category(+translation), content(+translation), clinic_info,
// working_hour, platform_setting, feature_flag.

import { DataTypes, Sequelize } from "sequelize";
import { ENUM } from "../config/constants.js";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};
const TENANT_FK = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } };

export async function up(queryInterface) {
  // service_category + translation
  await queryInterface.createTable("service_category", {
    id: ID,
    tenant_id: TENANT_FK,
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  });
  await queryInterface.createTable("service_category_translation", {
    id: ID,
    service_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "service_category", key: "id" } },
    locale: { type: DataTypes.ENUM(...ENUM.LOCALE), allowNull: false },
    name: { type: DataTypes.STRING(190), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  }, {
    indexes: [{ name: "sct_category_locale", unique: true, fields: ["service_category_id", "locale"] }],
  });

  // service + translation
  await queryInterface.createTable("service", {
    id: ID,
    tenant_id: TENANT_FK,
    service_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "service_category", key: "id" } },
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM("active", "inactive", "archived"), allowNull: false, defaultValue: "active" },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [{ name: "service_tenant_category", fields: ["tenant_id", "service_category_id"] }],
  });
  await queryInterface.createTable("service_translation", {
    id: ID,
    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "service", key: "id" } },
    locale: { type: DataTypes.ENUM(...ENUM.LOCALE), allowNull: false },
    name: { type: DataTypes.STRING(190), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  }, {
    indexes: [{ name: "st_service_locale", unique: true, fields: ["service_id", "locale"] }],
  });

  // content_category + translation
  await queryInterface.createTable("content_category", {
    id: ID,
    tenant_id: TENANT_FK,
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  });
  await queryInterface.createTable("content_category_translation", {
    id: ID,
    content_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "content_category", key: "id" } },
    locale: { type: DataTypes.ENUM(...ENUM.LOCALE), allowNull: false },
    name: { type: DataTypes.STRING(190), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  }, {
    indexes: [{ name: "cc_trans_category_locale", unique: true, fields: ["content_category_id", "locale"] }],
  });

  // content + translation
  await queryInterface.createTable("content", {
    id: ID,
    tenant_id: TENANT_FK,
    content_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "content_category", key: "id" } },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM(...ENUM.CONTENT_STATUS), allowNull: false, defaultValue: "draft" },
    published_at: { type: DataTypes.DATE, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [{ name: "content_tenant_category", fields: ["tenant_id", "content_category_id"] }],
  });
  await queryInterface.createTable("content_translation", {
    id: ID,
    content_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "content", key: "id" } },
    locale: { type: DataTypes.ENUM(...ENUM.LOCALE), allowNull: false },
    title: { type: DataTypes.STRING(190), allowNull: false },
    body: { type: DataTypes.TEXT("medium"), allowNull: true },
  }, {
    indexes: [{ name: "ct_content_locale", unique: true, fields: ["content_id", "locale"] }],
  });

  // clinic_info + working_hour
  await queryInterface.createTable("clinic_info", {
    id: ID,
    tenant_id: TENANT_FK,
    name: { type: DataTypes.STRING(190), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    phone_canonical: { type: DataTypes.STRING(20), allowNull: true },
    phone_display: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(190), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...TS,
  });
  await queryInterface.createTable("working_hour", {
    id: ID,
    tenant_id: TENANT_FK,
    clinic_info_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, references: { model: "clinic_info", key: "id" } },
    day_of_week: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    open_time: { type: DataTypes.STRING(5), allowNull: true },
    close_time: { type: DataTypes.STRING(5), allowNull: true },
    is_closed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...TS,
  }, {
    indexes: [{ name: "working_hour_tenant_day", fields: ["tenant_id", "day_of_week"] }],
  });

  // platform_setting + feature_flag (GLOBAL, §7)
  await queryInterface.createTable("platform_setting", {
    id: ID,
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    value: { type: DataTypes.TEXT, allowNull: false },
    value_type: { type: DataTypes.ENUM("string", "number", "boolean", "json"), allowNull: false, defaultValue: "string" },
    description: { type: DataTypes.STRING(255), allowNull: true },
    ...TS,
  });
  await queryInterface.createTable("feature_flag", {
    id: ID,
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    ...TS,
  });
}
