import { DataTypes, Sequelize } from "sequelize";

// Reconcile store tables to the exact model schema (models/20_store.js).
// Migration 033 ran once on the first deploy but used a stale column set
// (is_active, meta_title, reference_number, legacy ENUMs) that does not match
// the models the service queries. Since the store has no production data yet,
// we drop and recreate the five tables with the correct schema. Idempotent.
const CREATED = { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") };
const UPDATED = { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") };
const TENANT_FK = {
  type: DataTypes.BIGINT.UNSIGNED,
  allowNull: false,
  references: { model: "tenant", key: "id" },
};

const SCHEMAS = {
  product_category: {
    def: {
      id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      tenant_id: TENANT_FK,
      name: { type: DataTypes.STRING(160), allowNull: false },
      name_en: { type: DataTypes.STRING(160), allowNull: true },
      slug: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: CREATED,
      updated_at: UPDATED,
    },
    indexes: [{ name: "uniq_pcat_tenant_slug", columns: ["tenant_id", "slug"], unique: true }],
  },
  product: {
    def: {
      id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      tenant_id: TENANT_FK,
      category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "product_category", key: "id" },
      },
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
      status: {
        type: DataTypes.ENUM("active", "draft", "out_of_stock"),
        allowNull: false,
        defaultValue: "active",
      },
      featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      images_json: { type: DataTypes.JSON, allowNull: true },
      weight_grams: { type: DataTypes.INTEGER, allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: CREATED,
      updated_at: UPDATED,
    },
    indexes: [
      { name: "uniq_prod_tenant_slug", columns: ["tenant_id", "slug"], unique: true },
      { name: "idx_prod_tenant_cat", columns: ["tenant_id", "category_id"] },
      { name: "idx_prod_tenant_status", columns: ["tenant_id", "status"] },
      { name: "idx_prod_tenant_featured", columns: ["tenant_id", "featured"] },
    ],
  },
  store_order: {
    def: {
      id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      tenant_id: TENANT_FK,
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
      created_at: CREATED,
      updated_at: UPDATED,
    },
    indexes: [
      { name: "uniq_order_tenant_number", columns: ["tenant_id", "order_number"], unique: true },
      { name: "idx_order_tenant_status", columns: ["tenant_id", "status"] },
    ],
  },
  store_order_item: {
    def: {
      id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      tenant_id: TENANT_FK,
      order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "store_order", key: "id" },
      },
      product_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "product", key: "id" },
      },
      name_snapshot: { type: DataTypes.STRING(200), allowNull: false },
      price_snapshot: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "EGP" },
      quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    indexes: [
      { name: "idx_item_tenant_order", columns: ["tenant_id", "order_id"] },
      { name: "idx_item_order", columns: ["order_id"] },
    ],
  },
  store_payment: {
    def: {
      id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      tenant_id: TENANT_FK,
      order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "store_order", key: "id" },
      },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "EGP" },
      method: { type: DataTypes.ENUM("vodafone_cash", "instapay"), allowNull: false },
      sender_phone: { type: DataTypes.STRING(40), allowNull: false },
      transaction_reference: { type: DataTypes.STRING(120), allowNull: true },
      receipt_json: { type: DataTypes.JSON, allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      reviewed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      reviewed_at: { type: DataTypes.DATE, allowNull: true },
      rejection_reason: { type: DataTypes.TEXT, allowNull: true },
      created_at: CREATED,
      updated_at: UPDATED,
    },
    indexes: [
      { name: "idx_pay_tenant_order", columns: ["tenant_id", "order_id"] },
      { name: "idx_pay_order", columns: ["order_id"] },
    ],
  },
};

// Drop children first, then create parents first (so FKs resolve).
const DROP_ORDER = ["store_payment", "store_order_item", "store_order", "product", "product_category"];
const CREATE_ORDER = ["product_category", "product", "store_order", "store_order_item", "store_payment"];

export async function up(queryInterface) {
  for (const name of DROP_ORDER) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes(name)) await queryInterface.dropTable(name);
  }
  for (const name of CREATE_ORDER) {
    const { def, indexes } = SCHEMAS[name];
    await queryInterface.createTable(name, def);
    for (const idx of indexes) {
      const existing = await queryInterface.showIndex(name);
      if (!existing.some((i) => i.name === idx.name)) {
        await queryInterface.addIndex(name, idx.columns, { name: idx.name, unique: idx.unique });
      }
    }
  }
}

export async function down(queryInterface) {
  for (const name of DROP_ORDER) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes(name)) await queryInterface.dropTable(name);
  }
}
