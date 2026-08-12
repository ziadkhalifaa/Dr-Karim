// Migration 001 — Tenancy + People (tenant, doctor, patient, contact_person, patient_contact).
// Forward-only. NOTE: patient_session is created in 003 (its FK needs
// assessment_session). patient.source_session_id and
// patient_contact.source_session_id are added here as plain columns; their FKs
// are added in migration 004 (forward dependency on assessment_session).

import { DataTypes, Sequelize } from "sequelize";
import { ENUM } from "../config/constants.js";

const ID = { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true };
const TS = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
};

export async function up(queryInterface) {
  await queryInterface.createTable("tenant", {
    id: ID,
    slug: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...TS,
  });

  await queryInterface.createTable("doctor", {
    id: ID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    name: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(120), allowNull: true },
    email: { type: DataTypes.STRING(190), allowNull: true },
    phone_canonical: { type: DataTypes.STRING(20), allowNull: true },
    phone_display: { type: DataTypes.STRING(20), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, { indexes: [{ name: "doctor_tenant_active", fields: ["tenant_id", "active"] }] });

  await queryInterface.createTable("patient", {
    id: ID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    age_years: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    age_months: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    sex: { type: DataTypes.ENUM(...ENUM.SEX), allowNull: true },
    email: { type: DataTypes.STRING(190), allowNull: true },
    phone_canonical: { type: DataTypes.STRING(20), allowNull: true },
    phone_display: { type: DataTypes.STRING(20), allowNull: true },
    status: { type: DataTypes.ENUM(...ENUM.PATIENT_STATUS), allowNull: false, defaultValue: "active" },
    followup_cadence_days: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
    source_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // FK added in 004
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "patient_tenant_status", fields: ["tenant_id", "status"] },
      { name: "patient_phone_canonical", fields: ["phone_canonical"] },
      { name: "patient_email", fields: ["email"] },
      { name: "patient_source_session", fields: ["source_session_id"] },
    ],
  });

  await queryInterface.createTable("contact_person", {
    id: ID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    relationship_code: { type: DataTypes.STRING(40), allowNull: true },
    phone_canonical: { type: DataTypes.STRING(20), allowNull: true },
    phone_display: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(190), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    ...TS,
  }, {
    indexes: [
      { name: "contact_person_phone_canonical", fields: ["phone_canonical"] },
      { name: "contact_person_tenant", fields: ["tenant_id"] },
    ],
  });

  await queryInterface.createTable("patient_contact", {
    id: ID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "tenant", key: "id" } },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "patient", key: "id" } },
    contact_person_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: "contact_person", key: "id" } },
    relationship_code: { type: DataTypes.STRING(40), allowNull: false },
    is_guardian: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    active_from: { type: DataTypes.DATEONLY, allowNull: true },
    active_to: { type: DataTypes.DATEONLY, allowNull: true },
    source_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // FK added in 004
    ...TS,
  }, {
    indexes: [
      { name: "patient_contact_tenant", fields: ["tenant_id"] },
      { name: "patient_contact_patient", fields: ["patient_id"] },
      { name: "patient_contact_person", fields: ["contact_person_id"] },
      { name: "patient_contact_source_session", fields: ["source_session_id"] },
    ],
  });
}
