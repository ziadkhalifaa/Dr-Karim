// Migration 043 — Add coupon, testimonial, chat_session, chat_message tables
// Forward-only. Adds new tables without touching any existing ones.

export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;

  // ---- coupon ----
  await queryInterface.createTable("coupon", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    discount_type: {
      type: DataTypes.ENUM("percentage", "fixed"),
      allowNull: false,
    },
    discount_value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    max_uses: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    used_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  });
  await queryInterface.addIndex("coupon", ["tenant_id", "code"], {
    unique: true,
    name: "coupon_tenant_code_unique",
  });

  // ---- testimonial ----
  await queryInterface.createTable("testimonial", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    patient_name: { type: DataTypes.STRING(150), allowNull: false },
    patient_subtitle: { type: DataTypes.STRING(200), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      defaultValue: 5,
    },
    image_url: { type: DataTypes.STRING(400), allowNull: true },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  });
  await queryInterface.addIndex("testimonial", ["tenant_id", "is_published", "sort_order"], {
    name: "testimonial_tenant_published_sort",
  });

  // ---- chat_session ----
  await queryInterface.createTable("chat_session", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "closed"),
      allowNull: false,
      defaultValue: "active",
    },
    last_message_at: { type: DataTypes.DATE, allowNull: true },
    unread_doctor: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    unread_patient: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  });
  await queryInterface.addIndex("chat_session", ["tenant_id", "patient_id"], {
    unique: true,
    name: "chat_session_tenant_patient_unique",
  });

  // ---- chat_message ----
  await queryInterface.createTable("chat_message", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sender_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sender_role: {
      type: DataTypes.ENUM("patient", "doctor", "staff"),
      allowNull: false,
    },
    content: { type: DataTypes.TEXT, allowNull: true },
    attachment_url: { type: DataTypes.STRING(500), allowNull: true },
    attachment_type: {
      type: DataTypes.ENUM("image", "file", "audio"),
      allowNull: true,
    },
    read_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  });
  await queryInterface.addIndex("chat_message", ["session_id", "created_at"], {
    name: "chat_message_session_created",
  });
}
