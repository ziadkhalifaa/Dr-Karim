// Phase 6C — Progress & Measurements shared context helpers.
// DoCTOR is the decision maker for goals/context; patients act within their own
// bound profile. Cross-tenant validation is the application-layer guarantee.

import { models } from "../models/index.js";
import { AppError } from "../utils/errors.js";

const { Patient } = models;

// Returns a doctor-only actor context or throws 403/401.
export function ensureDoctorCtx(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  const role = auth.membership?.role;
  if (role !== "doctor") throw new AppError(403, "PROGRESS_DOCTOR_ONLY", "Only a doctor may perform this action");
  return {
    role,
    userId: String(auth.user.id),
    doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null,
  };
}

// Resolves a requested patient scoped to the tenant; throws when missing.
export async function resolvePatientCtxFor({ tenantId, requestedPatientId }) {
  if (!requestedPatientId) throw new AppError(422, "PROGRESS_PATIENT_REQUIRED", "patientId is required");
  const patient = await Patient.findOne({
    where: { id: requestedPatientId, tenant_id: tenantId, deleted_at: null },
    raw: true,
  });
  if (!patient) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
  return { patientId: String(patient.id) };
}