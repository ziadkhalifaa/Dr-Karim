// Group 01 — Tenancy + People.
// Tables: tenant, doctor, patient, contact_person, patient_contact, patient_session.
// Conventions: docs/database-architecture.md §5–§8, §12.1, §19 (BIGINT surrogate
// PKs never exposed), §21 (forward-only). Tenant-scoped per §7.

import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { ENUM } from "../config/constants.js";

const BIGID = { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true };
const PHONE_CANONICAL = { type: DataTypes.STRING(20), allowNull: true };
const PHONE_DISPLAY = { type: DataTypes.STRING(20), allowNull: true };

// ---- tenant (global, single seeded default row dr-kareem) ----
export const Tenant = sequelize.define(
  "tenant",
  {
    id: BIGID,
    slug: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: "tenant", underscored: true }
);

// ---- doctor (tenant-scoped; PK stays internal) ----
export const Doctor = sequelize.define(
  "doctor",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(120), allowNull: true },
    email: { type: DataTypes.STRING(190), allowNull: true },
    phone_canonical: PHONE_CANONICAL,
    phone_display: PHONE_DISPLAY,
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "doctor", underscored: true, paranoid: false }
);

// ---- patient (tenant-scoped; soft-archive via status; §8) ----
export const Patient = sequelize.define(
  "patient",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: true }, // Q01_04a optional
    age_years: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true }, // derived (Q01_04)
    age_months: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true }, // Q01_04b
    sex: { type: DataTypes.ENUM(...ENUM.SEX), allowNull: true },
    email: { type: DataTypes.STRING(190), allowNull: true },
    phone_canonical: PHONE_CANONICAL,
    phone_display: PHONE_DISPLAY,
    status: { type: DataTypes.ENUM(...ENUM.PATIENT_STATUS), allowNull: false, defaultValue: "active" },
    followup_cadence_days: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true }, // §30 per-patient override
    source_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // provenance (review-confirm)
    confirmed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // provenance (review-confirm)
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "patient",
    underscored: true,
    paranoid: false,
    indexes: [
      { name: "patient_tenant_status", fields: ["tenant_id", "status"] }, // §17
      { name: "patient_phone_canonical", fields: ["phone_canonical"] }, // §6 non-unique
      { name: "patient_email", fields: ["email"] }, // §6 non-unique
    ],
  }
);

// ---- contact_person (reusable identity only; §5) ----
export const ContactPerson = sequelize.define(
  "contact_person",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    full_name: { type: DataTypes.STRING(100), allowNull: false },
    relationship_code: { type: DataTypes.STRING(40), allowNull: true }, // FK relationship_code (set in associations)
    phone_canonical: PHONE_CANONICAL,
    phone_display: PHONE_DISPLAY,
    email: { type: DataTypes.STRING(190), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "contact_person",
    underscored: true,
    paranoid: false,
    indexes: [{ name: "contact_person_phone_canonical", fields: ["phone_canonical"] }], // §6 non-unique
  }
);

// ---- patient_contact (association; relationship belongs here, §5) ----
export const PatientContact = sequelize.define(
  "patient_contact",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    contact_person_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    relationship_code: { type: DataTypes.STRING(40), allowNull: false },
    is_guardian: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // someone_else ∧ minor; doctor-editable at confirm
    is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    active_from: { type: DataTypes.DATEONLY, allowNull: true },
    active_to: { type: DataTypes.DATEONLY, allowNull: true },
    source_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  },
  {
    tableName: "patient_contact",
    underscored: true,
    indexes: [
      { name: "patient_contact_tenant", fields: ["tenant_id"] },
      { name: "patient_contact_patient", fields: ["patient_id"] },
      { name: "patient_contact_person", fields: ["contact_person_id"] },
    ],
  }
);

// ---- patient_session (patient↔session link, created only at review-confirm; §17) ----
export const PatientSession = sequelize.define(
  "patient_session",
  {
    id: BIGID,
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    patient_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    assessment_session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  },
  {
    tableName: "patient_session",
    underscored: true,
    indexes: [
      { name: "patient_session_uniq", unique: true, fields: ["patient_id", "assessment_session_id"] },
      { name: "patient_session_session", fields: ["assessment_session_id"] },
    ],
  }
);

export const GROUP_01 = { Tenant, Doctor, Patient, ContactPerson, PatientContact, PatientSession };
