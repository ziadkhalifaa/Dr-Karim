import { Op } from "sequelize";
import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";
import { notificationService } from "./notification.service.js";

const { Appointment, Patient, Doctor, Service, LiveSession } = models;
const TRANSITIONS = { pending: ["confirmed", "cancelled"], confirmed: ["cancelled", "completed", "no_show"], cancelled: [], completed: [], no_show: [] };

function currentActor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  return { role: auth.membership.role, userId: String(auth.user.id), doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null, patientId: auth.user.patient_id ? String(auth.user.patient_id) : null };
}

async function patientInTenant(id, tenantId, transaction) { const row = await Patient.findOne({ where: { id, tenant_id: tenantId, status: { [Op.in]: ["active", "inactive"] } }, transaction, raw: true }); if (!row) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found"); return row; }
async function doctorInTenant(id, tenantId, transaction) { const row = await Doctor.findOne({ where: { id, tenant_id: tenantId, active: true, deleted_at: null }, transaction, raw: true }); if (!row) throw new AppError(404, "DOCTOR_NOT_FOUND", "Doctor not found"); return row; }
async function appointment(id, tenantId, transaction, lock = false) { const row = await Appointment.findOne({ where: { id, tenant_id: tenantId, deleted_at: null }, transaction, lock: lock ? transaction.LOCK.UPDATE : undefined, raw: true }); if (!row) throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Appointment not found"); const live = await LiveSession.findOne({ where: { appointment_id: row.id, tenant_id: tenantId }, order: [["id", "DESC"]], transaction, raw: true }); return { ...row, liveSessionId: live ? String(live.id) : null }; }
async function withLiveIds(rows, tenantId) { return Promise.all(rows.map(async (row) => { const live = await LiveSession.findOne({ where: { appointment_id: row.id, tenant_id: tenantId }, order: [["id", "DESC"]], raw: true }); return { ...row, liveSessionId: live ? String(live.id) : null }; })); }
function authorized(row, actor, write = false) { if (actor.role === "patient" && String(row.patient_id) !== String(actor.patientId)) throw new AppError(403, "APPOINTMENT_ACCESS_FORBIDDEN", "Appointment access denied"); if (actor.role === "doctor" && String(row.doctor_id) !== String(actor.doctorId)) throw new AppError(403, "APPOINTMENT_ACCESS_FORBIDDEN", "Appointment access denied"); if (write && !["doctor", "patient"].includes(actor.role)) throw new AppError(403, "APPOINTMENT_WRITE_FORBIDDEN", "Appointment write access denied"); }
function times(body) { const start = new Date(body.scheduledStartAt); if (Number.isNaN(start.getTime())) throw new AppError(422, "APPOINTMENT_VALIDATION_ERROR", "scheduledStartAt is invalid"); const end = body.scheduledEndAt ? new Date(body.scheduledEndAt) : null; if (end && (Number.isNaN(end.getTime()) || end <= start)) throw new AppError(422, "APPOINTMENT_VALIDATION_ERROR", "scheduledEndAt must be after scheduledStartAt"); const duration = body.durationMin == null ? end ? Math.round((end - start) / 60000) : null : Number(body.durationMin); if (duration != null && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) throw new AppError(422, "APPOINTMENT_VALIDATION_ERROR", "durationMin is invalid"); return { start, end, duration }; }

export const appointmentService = {
  async create({ tenantId, auth, body, ip }) {
    const actor = currentActor(auth); if (!["doctor", "patient"].includes(actor.role)) throw new AppError(403, "APPOINTMENT_WRITE_FORBIDDEN", "Only doctors or patients may create appointments");
    const patientId = actor.role === "patient" ? actor.patientId : body.patientId; if (!patientId) throw new AppError(422, "APPOINTMENT_VALIDATION_ERROR", "patientId is required");
    const doctorId = body.doctorId; if (!doctorId) throw new AppError(422, "APPOINTMENT_VALIDATION_ERROR", "doctorId is required");
    const { start, end, duration } = times(body);
    return sequelize.transaction(async (transaction) => {
      await patientInTenant(patientId, tenantId, transaction); await doctorInTenant(doctorId, tenantId, transaction);
      if (body.serviceId != null) { const service = await Service.findOne({ where: { id: body.serviceId, tenant_id: tenantId, status: "active" }, transaction, raw: true }); if (!service) throw new AppError(422, "SERVICE_INVALID", "Service is not active in this tenant"); }
      const row = await Appointment.create({ tenant_id: tenantId, patient_id: patientId, doctor_id: doctorId, service_id: body.serviceId || null, type: body.type || "clinic", status: "pending", scheduled_start_at: start, scheduled_end_at: end, duration_min: duration, branch_ref: body.branchRef || null, notes: body.notes || null }, { transaction });
      await auditService.record({ tenantId, action: "appointment.created", entity: "appointment", entityRef: String(row.id), metadata: { type: row.type, status: row.status }, actorType: actor.role, actorId: actor.userId, ip, transaction });
      return row.toJSON();
    });
  },
  async get({ tenantId, id, auth }) { const actor = currentActor(auth); const row = await appointment(id, tenantId); authorized(row, actor); return row; },
  async listPatient({ tenantId, patientId, auth }) { const actor = currentActor(auth); if (actor.role === "patient" && String(actor.patientId) !== String(patientId)) throw new AppError(403, "APPOINTMENT_ACCESS_FORBIDDEN", "Appointment access denied"); await patientInTenant(patientId, tenantId); return withLiveIds(await Appointment.findAll({ where: { tenant_id: tenantId, patient_id: patientId, deleted_at: null }, order: [["scheduled_start_at", "DESC"]], raw: true }), tenantId); },
  async listDoctor({ tenantId, doctorId, auth }) { const actor = currentActor(auth); if (actor.role === "doctor" && String(actor.doctorId) !== String(doctorId)) throw new AppError(403, "APPOINTMENT_ACCESS_FORBIDDEN", "Appointment access denied"); await doctorInTenant(doctorId, tenantId); return withLiveIds(await Appointment.findAll({ where: { tenant_id: tenantId, doctor_id: doctorId, deleted_at: null }, order: [["scheduled_start_at", "ASC"]], raw: true }), tenantId); },
  async transition({ tenantId, id, auth, to, ip }) {
    const actor = currentActor(auth); if (actor.role !== "doctor") throw new AppError(403, "APPOINTMENT_WRITE_FORBIDDEN", "Only the assigned doctor may change appointment state");
    return sequelize.transaction(async (transaction) => {
      const row = await appointment(id, tenantId, transaction, true); authorized(row, actor, true); if (!TRANSITIONS[row.status]?.includes(to)) throw new AppError(409, "APPOINTMENT_INVALID_TRANSITION", `Cannot transition appointment from ${row.status} to ${to}`);
      const values = { status: to }; if (to === "confirmed") values.confirmation_sent_at = new Date();
      const updated = await Appointment.update(values, { where: { id: row.id, tenant_id: tenantId, status: row.status }, transaction }); if (!updated[0]) throw new AppError(409, "APPOINTMENT_CONFLICT", "Appointment was changed concurrently");
      await auditService.record({ tenantId, action: `appointment.${to}`, entity: "appointment", entityRef: String(row.id), metadata: { fromStatus: row.status, toStatus: to }, actorType: actor.role, actorId: actor.userId, ip, transaction });
      const type = { confirmed: "appointment_confirmed", cancelled: "appointment_cancelled", completed: "appointment_completed" }[to]; if (type) await notificationService.emitForPatient({ tenantId, patientId: row.patient_id, type, relatedEntity: "appointment", relatedRef: String(row.id), transaction });
      return { ...row, ...values };
    });
  },
};

export default appointmentService;
