// Store / e-commerce schema (Phase 7): product catalog + orders + payments.
// Forward-only; tables are tenant-scoped (§7).
export async function up(queryInterface, _sequelize) {
  await queryInterface.createTable("product_category", {
    id: { type: "BIGINT UNSIGNED", autoIncrement: true, primaryKey: true },
    tenant_id: { type: "BIGINT UNSIGNED", allowNull: false },
    name: { type: "VARCHAR(160)", allowNull: false },
    name_en: { type: "VARCHAR(160)", allowNull: true },
    slug: { type: "VARCHAR(120)", allowNull: false },
    description: { type: "TEXT", allowNull: true },
    sort_order: { type: "INTEGER", allowNull: false, defaultValue: 0 },
    active: { type: "BOOLEAN", allowNull: false, defaultValue: true },
    created_at: { type: "DATETIME", allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    updated_at: { type: "DATETIME", allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
  }, {});
  await queryInterface.addIndex("product_category", ["tenant_id", "slug"], { unique: true });

  await queryInterface.createTable("product", {
    id: { type: "BIGINT UNSIGNED", autoIncrement: true, primaryKey: true },
    tenant_id: { type: "BIGINT UNSIGNED", allowNull: false },
    category_id: { type: "BIGINT UNSIGNED", allowNull: true },
    name: { type: "VARCHAR(200)", allowNull: false },
    name_en: { type: "VARCHAR(200)", allowNull: true },
    slug: { type: "VARCHAR(160)", allowNull: false },
    description: { type: "TEXT", allowNull: true },
    short_description: { type: "VARCHAR(320)", allowNull: true },
    price: { type: "DECIMAL(12,2)", allowNull: false },
    compare_at_price: { type: "DECIMAL(12,2)", allowNull: true },
    currency: { type: "VARCHAR(8)", allowNull: false, defaultValue: "EGP" },
    stock_quantity: { type: "INTEGER", allowNull: false, defaultValue: 0 },
    sku: { type: "VARCHAR(80)", allowNull: true },
    status: { type: "ENUM('active','draft','out_of_stock')", allowNull: false, defaultValue: "active" },
    featured: { type: "BOOLEAN", allowNull: false, defaultValue: false },
    images_json: { type: "JSON", allowNull: true },
    weight_grams: { type: "INTEGER", allowNull: true },
    sort_order: { type: "INTEGER", allowNull: false, defaultValue: 0 },
    created_at: { type: "DATETIME", allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    updated_at: { type: "DATETIME", allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
  }, {});
  await queryInterface.addIndex("product", ["tenant_id", "slug"], { unique: true });
  await queryInterface.addIndex("product", ["tenant_id", "category_id"], {});

  await queryInterface.createTable("store_order", {
    id: { type: "BIGINT UNSIGNED", autoIncrement: true, primaryKey: true },
    tenant_id: { type: "BIGINT UNSIGNED", allowNull: false },
    order_number: { type: "VARCHAR(40)", allowNull: false },
    patient_id: { type: "BIGINT UNSIGNED", allowNull: true },
    customer_name: { type: "VARCHAR(160)", allowNull: false },
    customer_phone: { type: "VARCHAR(40)", allowNull: false },
    customer_email: { type: "VARCHAR(160)", allowNull: true },
    city: { type: "VARCHAR(120)", allowNull: true },
    address: { type: "TEXT", allowNull: true },
    notes: { type: "TEXT", allowNull: true },
    subtotal: { type: "DECIMAL(12,2)", allowNull: false },
    currency: { type: "VARCHAR(8)", allowNull: false, defaultValue: "EGP" },
    status: { type: "ENUM('pending_payment','paid','processing','shipped','delivered','cancelled')", allowNull: false, defaultValue: "pending_payment" },
    payment_id: { type: "BIGINT UNSIGNED", allowNull: true },
    created_at: { type: "DATETIME", allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    updated_at: { type: "DATETIME", allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
  }, {});
  await queryInterface.addIndex("store_order", ["tenant_id", "order_number"], { unique: true });

  await queryInterface.createTable("store_order_item", {
    id: { type: "BIGINT UNSIGNED", autoIncrement: true, primaryKey: true },
    tenant_id: { type: "BIGINT UNSIGNED", allowNull: false },
    order_id: { type: "BIGINT UNSIGNED", allowNull: false },
    product_id: { type: "BIGINT UNSIGNED", allowNull: true },
    name_snapshot: { type: "VARCHAR(200)", allowNull: false },
    price_snapshot: { type: "DECIMAL(12,2)", allowNull: false },
    currency: { type: "VARCHAR(8)", allowNull: false, defaultValue: "EGP" },
    quantity: { type: "INTEGER UNSIGNED", allowNull: false, defaultValue: 1 },
    line_total: { type: "DECIMAL(12,2)", allowNull: false },
  }, {});
  await queryInterface.addIndex("store_order_item", ["order_id"], {});

  await queryInterface.createTable("store_payment", {
    id: { type: "BIGINT UNSIGNED", autoIncrement: true, primaryKey: true },
    tenant_id: { type: "BIGINT UNSIGNED", allowNull: false },
    order_id: { type: "BIGINT UNSIGNED", allowNull: false },
    amount: { type: "DECIMAL(12,2)", allowNull: false },
    currency: { type: "VARCHAR(8)", allowNull: false, defaultValue: "EGP" },
    method: { type: "ENUM('vodafone_cash','instapay')", allowNull: false },
    sender_phone: { type: "VARCHAR(40)", allowNull: false },
    transaction_reference: { type: "VARCHAR(120)", allowNull: true },
    receipt_json: { type: "JSON", allowNull: true },
    status: { type: "ENUM('pending','approved','rejected')", allowNull: false, defaultValue: "pending" },
    reviewed_by: { type: "BIGINT UNSIGNED", allowNull: true },
    reviewed_at: { type: "DATETIME", allowNull: true },
    rejection_reason: { type: "TEXT", allowNull: true },
    created_at: { type: "DATETIME", allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    updated_at: { type: "DATETIME", allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
  }, {});
  await queryInterface.addIndex("store_payment", ["order_id"], {});
}

export async function down(queryInterface) {
  await queryInterface.dropTable("store_payment");
  await queryInterface.dropTable("store_order_item");
  await queryInterface.dropTable("store_order");
  await queryInterface.dropTable("product");
  await queryInterface.dropTable("product_category");
}
