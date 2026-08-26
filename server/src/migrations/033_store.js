import { DataTypes, Sequelize } from "sequelize";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TENANT_FK = {
  type: DataTypes.BIGINT.UNSIGNED,
  allowNull: false,
  references: { model: "tenant", key: "id" },
};
const CREATED = { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") };
const UPDATED = { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") };

async function createIfMissing(queryInterface, name, definition) {
  const tables = await queryInterface.showAllTables();
  if (tables.includes(name)) return;
  await queryInterface.createTable(name, definition);
}

async function addIndexIfMissing(queryInterface, table, columns, opts) {
  const existing = await queryInterface.showIndex(table);
  if (existing.some((i) => i.name === opts.name)) return;
  await queryInterface.addIndex(table, columns, opts);
}

export async function up(queryInterface) {
  await createIfMissing(queryInterface, "product_category", {
    id: ID,
    tenant_id: TENANT_FK,
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(140), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: CREATED,
    updated_at: UPDATED,
  });
  await addIndexIfMissing(queryInterface, "product_category", ["tenant_id", "slug"], {
    unique: true,
    name: "uniq_pcat_tenant_slug",
  });

  await createIfMissing(queryInterface, "product", {
    id: ID,
    tenant_id: TENANT_FK,
    category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: "product_category", key: "id" },
    },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    short_description: { type: DataTypes.STRING(255), allowNull: true },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    compare_at_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "EGP" },
    images_json: { type: DataTypes.JSON, allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "draft", "out_of_stock"),
      allowNull: false,
      defaultValue: "draft",
    },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    stock_quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    sku: { type: DataTypes.STRING(80), allowNull: true },
    weight_grams: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    meta_title: { type: DataTypes.STRING(160), allowNull: true },
    meta_description: { type: DataTypes.STRING(255), allowNull: true },
    created_at: CREATED,
    updated_at: UPDATED,
  });
  await addIndexIfMissing(queryInterface, "product", ["tenant_id", "slug"], {
    unique: true,
    name: "uniq_prod_tenant_slug",
  });
  await addIndexIfMissing(queryInterface, "product", ["tenant_id", "category_id"], {
    name: "idx_prod_tenant_cat",
  });
  await addIndexIfMissing(queryInterface, "product", ["tenant_id", "status"], {
    name: "idx_prod_tenant_status",
  });

  await createIfMissing(queryInterface, "store_order", {
    id: ID,
    tenant_id: TENANT_FK,
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    order_number: { type: DataTypes.STRING(40), allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    shipping_fee: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "EGP" },
    customer_name: { type: DataTypes.STRING(120), allowNull: true },
    customer_phone: { type: DataTypes.STRING(20), allowNull: true },
    customer_email: { type: DataTypes.STRING(120), allowNull: true },
    shipping_address: { type: DataTypes.TEXT, allowNull: true },
    shipping_city: { type: DataTypes.STRING(80), allowNull: true },
    shipping_governorate: { type: DataTypes.STRING(80), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    payment_method: {
      type: DataTypes.ENUM("vodafone", "instapay", "card", "cod", "bank"),
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM("unpaid", "pending", "paid", "failed", "refunded"),
      allowNull: false,
      defaultValue: "unpaid",
    },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    created_at: CREATED,
    updated_at: UPDATED,
  });
  await addIndexIfMissing(queryInterface, "store_order", ["tenant_id", "order_number"], {
    unique: true,
    name: "uniq_order_tenant_number",
  });
  await addIndexIfMissing(queryInterface, "store_order", ["tenant_id", "status"], {
    name: "idx_order_tenant_status",
  });

  await createIfMissing(queryInterface, "store_order_item", {
    id: ID,
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
    product_name: { type: DataTypes.STRING(160), allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    created_at: CREATED,
    updated_at: UPDATED,
  });
  await addIndexIfMissing(queryInterface, "store_order_item", ["tenant_id", "order_id"], {
    name: "idx_item_tenant_order",
  });
  await addIndexIfMissing(queryInterface, "store_order_item", ["order_id"], {
    name: "idx_item_order",
  });

  await createIfMissing(queryInterface, "store_payment", {
    id: ID,
    tenant_id: TENANT_FK,
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "store_order", key: "id" },
    },
    method: {
      type: DataTypes.ENUM("vodafone", "instapay", "card", "cod", "bank"),
      allowNull: false,
    },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "EGP" },
    status: {
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    reference_number: { type: DataTypes.STRING(80), allowNull: true },
    receipt_path: { type: DataTypes.STRING(255), allowNull: true },
    verified_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    verified_at: { type: DataTypes.DATE, allowNull: true },
    created_at: CREATED,
    updated_at: UPDATED,
  });
  await addIndexIfMissing(queryInterface, "store_payment", ["tenant_id", "order_id"], {
    name: "idx_pay_tenant_order",
  });
  await addIndexIfMissing(queryInterface, "store_payment", ["order_id"], {
    name: "idx_pay_order",
  });
}
