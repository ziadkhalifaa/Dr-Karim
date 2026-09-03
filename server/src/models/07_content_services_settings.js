// Group 07 — Services / content / clinic / settings.
// Tables: service_category (+ translation), service (+ translation),
// content_category (+ translation), content (+ translation), clinic_info,
// working_hour, platform_setting, feature_flag.
// Localization per §16: translation tables (UNIQUE entity_id+locale) for authored
// content; settings/flags are global (not tenant-scoped, §7).

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };

// ---- service_category ----
export const ServiceCategory = sequelize.define(
  "service_category",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "service_category", underscored: true }
);

export const ServiceCategoryTranslation = sequelize.define(
  "service_category_translation",
  {
    id: BIGID,
    service_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    locale: { type: DataTypes.ENUM(...ENUM.LOCALE), allowNull: false },
    name: { type: DataTypes.STRING(190), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "service_category_translation",
    underscored: true,
    timestamps: false,
    indexes: [
      { name: "sct_category_locale", unique: true, fields: ["service_category_id", "locale"] },
    ],
  }
);

// ---- service ----
export const Service = sequelize.define(
  "service",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    service_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    cover_image_url: { type: DataTypes.STRING(500), allowNull: true },
    status: { type: DataTypes.ENUM("active", "inactive", "archived"), allowNull: false, defaultValue: "active" },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "service",
    underscored: true,
    indexes: [{ name: "service_tenant_category", fields: ["tenant_id", "service_category_id"] }],
  }
);

export const ServiceTranslation = sequelize.define(
  "service_translation",
  {
    id: BIGID,
    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    locale: { type: DataTypes.ENUM(...ENUM.LOCALE), allowNull: false },
    name: { type: DataTypes.STRING(190), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "service_translation",
    underscored: true,
    timestamps: false,
    indexes: [{ name: "st_service_locale", unique: true, fields: ["service_id", "locale"] }],
  }
);

// ---- content_category ----
export const ContentCategory = sequelize.define(
  "content_category",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "content_category", underscored: true }
);

export const ContentCategoryTranslation = sequelize.define(
  "content_category_translation",
  {
    id: BIGID,
    content_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    locale: { type: DataTypes.ENUM(...ENUM.LOCALE), allowNull: false },
    name: { type: DataTypes.STRING(190), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "content_category_translation",
    underscored: true,
    timestamps: false,
    indexes: [
      { name: "cc_trans_category_locale", unique: true, fields: ["content_category_id", "locale"] },
    ],
  }
);

// ---- content ----
export const Content = sequelize.define(
  "content",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    content_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM(...ENUM.CONTENT_STATUS), allowNull: false, defaultValue: "draft" },
    cover_image_url: { type: DataTypes.STRING(500), allowNull: true },
    excerpt: { type: DataTypes.TEXT, allowNull: true },
    author_name: { type: DataTypes.STRING(120), allowNull: true },
    read_time_minutes: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "content",
    underscored: true,
    indexes: [{ name: "content_tenant_category", fields: ["tenant_id", "content_category_id"] }],
  }
);

export const ContentTranslation = sequelize.define(
  "content_translation",
  {
    id: BIGID,
    content_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    locale: { type: DataTypes.ENUM(...ENUM.LOCALE), allowNull: false },
    title: { type: DataTypes.STRING(190), allowNull: false },
    body: { type: DataTypes.TEXT("medium"), allowNull: true },
  },
  {
    tableName: "content_translation",
    underscored: true,
    timestamps: false,
    indexes: [{ name: "ct_content_locale", unique: true, fields: ["content_id", "locale"] }],
  }
);

// ---- clinic_info ----
export const ClinicInfo = sequelize.define(
  "clinic_info",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(190), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    phone_canonical: { type: DataTypes.STRING(20), allowNull: true },
    phone_display: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(190), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "clinic_info", underscored: true }
);

// ---- working_hour ----
export const WorkingHour = sequelize.define(
  "working_hour",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    clinic_info_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    day_of_week: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false }, // 0=Sunday … 6=Saturday
    open_time: { type: DataTypes.STRING(5), allowNull: true }, // "09:00"
    close_time: { type: DataTypes.STRING(5), allowNull: true }, // "17:00"
    is_closed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "working_hour",
    underscored: true,
    indexes: [{ name: "working_hour_tenant_day", fields: ["tenant_id", "day_of_week"] }],
  }
);

// ---- platform_setting (tenant-scoped key/value config) ----
export const PlatformSetting = sequelize.define(
  "platform_setting",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    key: { type: DataTypes.STRING(80), allowNull: false },
    value: { type: DataTypes.TEXT, allowNull: false },
    value_type: {
      type: DataTypes.ENUM("string", "number", "boolean", "json"),
      allowNull: false,
      defaultValue: "string",
    },
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: "platform_setting", underscored: true, indexes: [{ unique: true, fields: ["tenant_id", "key"] }] }
);

// ---- feature_flag (global) ----
export const FeatureFlag = sequelize.define(
  "feature_flag",
  {
    id: BIGID,
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: "feature_flag", underscored: true }
);

// ---- testimonial ----
export const Testimonial = sequelize.define(
  "testimonial",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    patient_name: { type: DataTypes.STRING(150), allowNull: false },
    patient_subtitle: { type: DataTypes.STRING(200), allowNull: true }, // e.g. "فقدت 20 كجم في 3 أشهر"
    content: { type: DataTypes.TEXT, allowNull: false },
    rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, defaultValue: 5 },
    image_url: { type: DataTypes.STRING(400), allowNull: true },
    is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "testimonial", underscored: true }
);

export const GROUP_07 = {
  ServiceCategory,
  ServiceCategoryTranslation,
  Service,
  ServiceTranslation,
  ContentCategory,
  ContentCategoryTranslation,
  Content,
  ContentTranslation,
  ClinicInfo,
  WorkingHour,
  PlatformSetting,
  FeatureFlag,
  Testimonial,
};
