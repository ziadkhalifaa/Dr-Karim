import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const ID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };
const tenant = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false };
const ts = {
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
};

export const ProductCategory = sequelize.define(
  "product_category",
  {
    id: ID,
    tenant_id: tenant,
    name: { type: DataTypes.STRING(160), allowNull: false },
    name_en: { type: DataTypes.STRING(160), allowNull: true },
    slug: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...ts,
  },
  { tableName: "product_category", underscored: true }
);

export const Product = sequelize.define(
  "product",
  {
    id: ID,
    tenant_id: tenant,
    category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    name_en: { type: DataTypes.STRING(200), allowNull: true },
    slug: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    short_description: { type: DataTypes.STRING(320), allowNull: true },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    compare_at_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "EGP" },
    stock_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sku: { type: DataTypes.STRING(80), allowNull: true },
    status: { type: DataTypes.ENUM("active", "draft", "out_of_stock"), allowNull: false, defaultValue: "active" },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    images_json: { type: DataTypes.JSON, allowNull: true },
    weight_grams: { type: DataTypes.INTEGER, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...ts,
  },
  { tableName: "product", underscored: true }
);

export const StoreOrder = sequelize.define(
  "store_order",
  {
    id: ID,
    tenant_id: tenant,
    order_number: { type: DataTypes.STRING(40), allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    customer_name: { type: DataTypes.STRING(160), allowNull: false },
    customer_phone: { type: DataTypes.STRING(40), allowNull: false },
    customer_email: { type: DataTypes.STRING(160), allowNull: true },
    city: { type: DataTypes.STRING(120), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "EGP" },
    status: {
      type: DataTypes.ENUM("pending_payment", "paid", "processing", "shipped", "delivered", "cancelled"),
      allowNull: false,
      defaultValue: "pending_payment",
    },
    payment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    ...ts,
  },
  { tableName: "store_order", underscored: true }
);

export const StoreOrderItem = sequelize.define(
  "store_order_item",
  {
    id: ID,
    tenant_id: tenant,
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    name_snapshot: { type: DataTypes.STRING(200), allowNull: false },
    price_snapshot: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "EGP" },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  { tableName: "store_order_item", underscored: true }
);

export const StorePayment = sequelize.define(
  "store_payment",
  {
    id: ID,
    tenant_id: tenant,
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "EGP" },
    method: { type: DataTypes.ENUM("vodafone_cash", "instapay"), allowNull: false },
    sender_phone: { type: DataTypes.STRING(40), allowNull: false },
    transaction_reference: { type: DataTypes.STRING(120), allowNull: true },
    receipt_json: { type: DataTypes.JSON, allowNull: true },
    status: { type: DataTypes.ENUM("pending", "approved", "rejected"), allowNull: false, defaultValue: "pending" },
    reviewed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    ...ts,
  },
  { tableName: "store_payment", underscored: true }
);

export const ProductReview = sequelize.define(
  "product_review",
  {
    id: ID,
    tenant_id: tenant,
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "approved",
    },
    ...ts,
  },
  { tableName: "product_review", underscored: true }
);

export const GROUP_20 = { ProductCategory, Product, StoreOrder, StoreOrderItem, StorePayment, ProductReview };
