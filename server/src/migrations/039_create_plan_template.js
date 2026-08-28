import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("plan_template", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    doctor_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    domain: {
      type: DataTypes.ENUM("nutrition", "exercise"),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content_json: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex("plan_template", ["tenant_id", "doctor_id", "domain"], {
    name: "pt_tenant_doctor_domain",
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("plan_template");
}
