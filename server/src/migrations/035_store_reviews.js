import { DataTypes, Sequelize } from "sequelize";

// Phase 7 addendum: product reviews (purchase-verified, buyers only) and a
// free_shipping flag on products. Idempotent (guards against existing columns
// / tables so re-running is safe).
const CREATED = { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") };
const UPDATED = { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") };
const TENANT_FK = {
  type: DataTypes.BIGINT.UNSIGNED,
  allowNull: false,
  references: { model: "tenant", key: "id" },
};

export async function up(queryInterface) {
  // --- free_shipping flag on product ---
  const productCols = await queryInterface.describeTable("product");
  if (!productCols.free_shipping) {
    await queryInterface.addColumn("product", "free_shipping", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  // --- user_id on store_order (links the buying auth user for purchase verification) ---
  const orderCols = await queryInterface.describeTable("store_order");
  if (!orderCols.user_id) {
    await queryInterface.addColumn("store_order", "user_id", {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    });
  }

  // --- product_review table ---
  const tables = await queryInterface.showAllTables();
  if (!tables.includes("product_review")) {
    await queryInterface.createTable("product_review", {
      id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
      tenant_id: TENANT_FK,
      product_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "product", key: "id" },
      },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "store_order", key: "id" },
      },
      rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "approved",
      },
      created_at: CREATED,
      updated_at: UPDATED,
    });
    await queryInterface.addIndex("product_review", ["tenant_id", "product_id"], { name: "idx_review_tenant_product" });
    await queryInterface.addIndex("product_review", ["product_id", "status"], { name: "idx_review_product_status" });
    // one review per buyer per product
    await queryInterface.addIndex("product_review", ["product_id", "user_id"], { unique: true, name: "uniq_review_product_user" });
  }
}

export async function down(queryInterface) {
  const productCols = await queryInterface.describeTable("product");
  if (productCols.free_shipping) await queryInterface.removeColumn("product", "free_shipping");
  const orderCols = await queryInterface.describeTable("store_order");
  if (orderCols.user_id) await queryInterface.removeColumn("store_order", "user_id");
  const tables = await queryInterface.showAllTables();
  if (tables.includes("product_review")) await queryInterface.dropTable("product_review");
}
