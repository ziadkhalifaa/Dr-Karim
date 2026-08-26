import { DataTypes, Sequelize } from "sequelize";

const CREATED = { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") };

export async function up(queryInterface) {
  const cols = await queryInterface.describeTable("product_review");
  if (!cols.images_json) {
    await queryInterface.addColumn("product_review", "images_json", {
      type: DataTypes.JSON,
      allowNull: true,
    });
  }
  if (!cols.doctor_reply) {
    await queryInterface.addColumn("product_review", "doctor_reply", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }
  if (!cols.doctor_reply_at) {
    await queryInterface.addColumn("product_review", "doctor_reply_at", {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }
  if (!cols.doctor_reply_by) {
    await queryInterface.addColumn("product_review", "doctor_reply_by", {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    });
  }
}

export async function down(queryInterface) {
  const cols = await queryInterface.describeTable("product_review");
  for (const c of ["images_json", "doctor_reply", "doctor_reply_at", "doctor_reply_by"]) {
    if (cols[c]) await queryInterface.removeColumn("product_review", c);
  }
}
