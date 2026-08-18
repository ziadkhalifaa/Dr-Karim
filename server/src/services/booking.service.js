// Booking service - the appointment engine (s15/s28).
//
// Doctors publish concrete time windows (appointment_slot); a recurring
// doctor schedule (weekly / biweekly) is expanded into individual slots that
// share one series_ref so the group can be identified in listing/audit.
// Patients with the live_session entitlement book an open slot. Booking is
// immediate and exclusive: the slot row is SELECT ... FOR UPDATE, validated
// against status/time, and a confirmed appointment is created in the same
// transaction, so two patients can never book the same slot.
//
// Session quotas come from package entitlements: live_session may carry
// limit_value + period_unit (week/month). Quota counts are derived from
// non-cancelled appointments in the current subscription period window.

import { Op } from "sequelize";
import crypto from "node:crypto";
import { models, sequelize } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";
import { notificationService } from "./notification.service.js";
import { entitlementService } from "./entitlement.service.js";

const { Appointment, AppointmentSlot, Patient, Doctor } = models;

const REPEAT_DAYS = { none: 0, weekly: 7, biweekly: 14 };
const REPEAT_UNITS = Object.keys(REPEAT_DAYS);
const SLOT_VIEW_CODES = { open: "open", booked: "booked", cancelled: "cancelled" };

function currentActor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  return { role: auth.membership.role, userId: String(auth.user.id), doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null, patientId: auth.user.patient_id ? String(auth.user.patient_id) : null };
}

async function patientInTenant(id, tenantId, transaction) {
  const row = await Patient.findOne({ where: { id, tenant_id: tenantId, status: { [Op.in]: ["active", "inactive"] } }, transaction, raw: true });
  if (!row) throw new AppError(404, "PATIENT_NOT_FOUND", "Patient not found");
  return row;
}

async function doctorInTenant(id, tenantId, transaction) {
  const row = await Doctor.findOne({ where: { id, tenant_id: tenantId, active: true, deleted_at: null }, transaction, raw: true });
  if (!row) throw new AppError(404, "DOCTOR_NOT_FOUND", "Doctor not found");
  return row;
}

function slot(id, tenantId, transaction, lock = false) {
  return AppointmentSlot.findOne({ where: { id, tenant_id: tenantId, deleted_at: null }, transaction, lock: lock ? transaction.LOCK.UPDATE : undefined, raw: true });
}

function windowTo(from, to) {
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (start && Number.isNaN(start.getTime())) throw new AppError(422, "SLOT_VALIDATION_ERROR", "from is invalid");
  if (end && Number.isNaN(end.getTime())) throw new AppError(422, "SLOT_VALIDATION_ERROR", "to is invalid");
  if (start && end && start >= end) throw new AppError(422, "SLOT_VALIDATION_ERROR", "from must be before to");
  return { start, end };
}

function slotTimes(body) {
  const start = new Date(body.startsAt);
  if (Number.isNaN(start.getTime())) throw new AppError(422, "SLOT_VALIDATION_ERROR", "startsAt is invalid");
  let end = body.endsAt ? new Date(body.endsAt) : null;
  if (end && (Number.isNaN(end.getTime()) || end <= start)) throw new AppError(422, "SLOT_VALIDATION_ERROR", "endsAt must be after startsAt");
  let duration = body.durationMin == null ? (end ? Math.round((end - start) / 60000) : 30) : Number(body.durationMin);
  if (!Number.isInteger(duration) || duration < 1 || duration > 1440) throw new AppError(422, "SLOT_VALIDATION_ERROR", "durationMin is invalid");
  if (!end) end = new Date(start.getTime() + duration * 60000);
  return { start, end, duration };
}

function repeatPlan(body) {
  const unit = body.repeatUnit || "none";
  if (!REPEAT_UNITS.includes(unit)) throw new AppError(422, "SLOT_VALIDATION_ERROR", "repeatUnit must be none, weekly or biweekly");
  const count = body.repeatCount == null ? 1 : Number(body.repeatCount);
  if (!Number.isInteger(count) || count < 1 || count > 52) throw new AppError(422, "SLOT_VALIDATION_ERROR", "repeatCount must be between 1 and 52");
  return { unit, count, days: REPEAT_DAYS[unit] };
}

export const bookingService = {
  async createSlots({ tenantId, auth, body, ip }) {
    const actor = currentActor(auth);
    if (actor.role !== "doctor") throw new AppError(403, "SLOT_WRITE_FORBIDDEN", "Only doctors may publish appointment slots");
    const { start, duration } = slotTimes(body);
    const repeat = repeatPlan(body);
    const seriesRef = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    return sequelize.transaction(async (transaction) => {
      const doctorId = body.doctorId || actor.doctorId;
      if (!doctorId) throw new AppError(422, "SLOT_VALIDATION_ERROR", "doctorId is required");
      await doctorInTenant(doctorId, tenantId, transaction);
      const created = [];
      for (let i = 0; i < repeat.count; i += 1) {
        const s = new Date(start.getTime() + i * repeat.days * 86400000);
        const e = new Date(s.getTime() + duration * 60000);
        if (e.getTime() <= Date.now()) continue;
        const clash = await AppointmentSlot.count({
          where: {
            tenant_id: tenantId, doctor_id: doctorId, deleted_at: null,
            status: { [Op.in]: ["open", "booked"] },
            starts_at: { [Op.lt]: e },
            ends_at: { [Op.gt]: s },
          },
          transaction,
        });
        if (clash) throw new AppError(409, "SLOT_OVERLAP", "An existing slot overlaps this time window");
        const row = await AppointmentSlot.create({
          tenant_id: tenantId, doctor_id: doctorId, series_ref: repeat.count > 1 ? seriesRef : null,
          starts_at: s, ends_at: e, duration_min: duration, status: "open",
          branch_ref: body.branchRef || null,
        }, { transaction });
        created.push(row.toJSON());
      }
      if (!created.length) throw new AppError(422, "SLOT_VALIDATION_ERROR", "All slots would be in the past");
      await auditService.record({ tenantId, action: "booking.slots_created", entity: "appointment_slot", entityRef: created.length > 1 ? seriesRef : String(created[0].id), metadata: { count: created.length, repeatUnit: repeat.unit }, actorType: actor.role, actorId: actor.userId, ip, transaction });
      return created;
    });
  },

  async list({ tenantId, auth, doctorId, from, to, status }) {
    const actor = currentActor(auth);
    const { start, end } = windowTo(from, to);
    const where = { tenant_id: tenantId, deleted_at: null };
    if (actor.role === "doctor") {
      if (!actor.doctorId || (doctorId && String(doctorId) !== String(actor.doctorId))) throw new AppError(403, "SLOT_ACCESS_FORBIDDEN", "Slot access denied");
      where.doctor_id = actor.doctorId;
    } else if (doctorId) {
      await doctorInTenant(doctorId, tenantId);
      where.doctor_id = doctorId;
    }
    if (start) where.starts_at = { ...(where.starts_at || {}), [Op.gte]: start };
    if (end) where.starts_at = { ...(where.starts_at || {}), [Op.lt]: end };
    if (status && SLOT_VIEW_CODES[status]) where.status = status;
    const rows = await AppointmentSlot.findAll({ where, order: [["starts_at", "ASC"]], raw: true });
    if (actor.role === "patient") return rows.filter((r) => r.status === "open").map((r) => ({ id: String(r.id), startsAt: r.starts_at, endsAt: r.ends_at, durationMin: r.duration_min, doctorId: String(r.doctor_id), status: r.status }));
    return Promise.all(rows.map(async (r) => {
      let appointment = null;
      if (r.appointment_id) appointment = await Appointment.findOne({ where: { id: r.appointment_id, tenant_id: tenantId }, raw: true });
      let patientName = null;
      if (r.appointment_id && appointment) {
        const p = await Patient.findOne({ where: { id: appointment.patient_id, tenant_id: tenantId }, raw: true });
        patientName = p?.full_name || p?.name || null;
      }
      return { id: String(r.id), startsAt: r.starts_at, endsAt: r.ends_at, durationMin: r.duration_min, doctorId: String(r.doctor_id), status: r.status, seriesRef: r.series_ref, appointmentId: r.appointment_id ? String(r.appointment_id) : null, patientId: appointment ? String(appointment.patient_id) : null, patientName };
    }));
  },

  async book({ tenantId, auth, id, body, ip }) {
    const actor = currentActor(auth);
    if (actor.role !== "patient") throw new AppError(403, "BOOKING_FORBIDDEN", "Only patients may book appointments");
    const patientId = actor.patientId;
    if (!patientId) throw new AppError(422, "BOOKING_VALIDATION_ERROR", "patientId is required");
    const notes = body.notes ? String(body.notes).slice(0, 2000) : null;
    return sequelize.transaction(async (transaction) => {
      await patientInTenant(patientId, tenantId, transaction);
      const row = await slot(id, tenantId, transaction, true);
      if (!row) throw new AppError(404, "SLOT_NOT_FOUND", "Slot not found");
      if (row.status !== "open") throw new AppError(409, "SLOT_UNAVAILABLE", "This slot has just been booked by another patient");
      if (new Date(row.ends_at || row.starts_at).getTime() <= Date.now()) throw new AppError(422, "SLOT_IN_PAST", "This slot has already passed");

      const { legacy, state } = await entitlementService.requireEntitlement({ tenantId, patientId, code: "live_session", transaction });
      if (!legacy) {
        const quota = await entitlementService.sessionQuota({ tenantId, patientId, transaction });
        if (quota.entitled && quota.limit != null && quota.remaining != null && quota.remaining <= 0)
          throw new AppError(403, "ENTITLEMENT_LIMIT_REACHED", `Session quota used up (${quota.limit} per ${quota.periodUnit === "month" ? "month" : "week"})`);
        if (quota.oneTime) await entitlementService.useEntitlement({ tenantId, patientId, code: "live_session", amount: 1, transaction });
      }

      const appointment = await Appointment.create({
        tenant_id: tenantId, patient_id: patientId, doctor_id: row.doctor_id,
        service_id: body.serviceId || null, type: body.type || "online", status: "confirmed",
        scheduled_start_at: row.starts_at, scheduled_end_at: row.ends_at, duration_min: row.duration_min,
        branch_ref: body.branchRef || row.branch_ref || null, notes,
      }, { transaction });

      row.status = "booked";
      row.appointment_id = appointment.id;
      await AppointmentSlot.update({ status: "booked", appointment_id: appointment.id }, { where: { id: row.id, tenant_id: tenantId, status: "open" }, transaction });

      await auditService.record({ tenantId, action: "booking.booked", entity: "appointment", entityRef: String(appointment.id), metadata: { slotId: String(row.id), doctorId: String(row.doctor_id), type: appointment.type }, actorType: "patient", actorId: actor.userId, ip, transaction });

      await notificationService.emitForPatient({ tenantId, patientId, type: "appointment_confirmed", relatedEntity: "appointment", relatedRef: String(appointment.id), transaction });
      await notificationService.emitForDoctor({ tenantId, doctorId: row.doctor_id, type: "appointment_booked", relatedEntity: "appointment", relatedRef: String(appointment.id), transaction });

      return { id: String(appointment.id), status: appointment.status, scheduledStartAt: appointment.scheduled_start_at, scheduledEndAt: appointment.scheduled_end_at, slotId: String(row.id), quota: state?.subscription ? await entitlementService.sessionQuota({ tenantId, patientId, transaction }) : null };
    });
  },

  async cancel({ tenantId, auth, id, ip }) {
    const actor = currentActor(auth);
    if (actor.role !== "doctor") throw new AppError(403, "SLOT_WRITE_FORBIDDEN", "Only doctors may cancel slots");
    return sequelize.transaction(async (transaction) => {
      const row = await slot(id, tenantId, transaction, true);
      if (!row) throw new AppError(404, "SLOT_NOT_FOUND", "Slot not found");
      if (String(row.doctor_id) !== String(actor.doctorId)) throw new AppError(403, "SLOT_ACCESS_FORBIDDEN", "Slot access denied");
      const updates = { status: "cancelled" };
      if (row.appointment_id) {
        const appt = await Appointment.findOne({ where: { id: row.appointment_id, tenant_id: tenantId }, transaction, lock: transaction.LOCK.UPDATE, raw: true });
        if (appt && !["cancelled", "completed"].includes(appt.status)) {
          await Appointment.update({ status: "cancelled" }, { where: { id: appt.id, tenant_id: tenantId, status: { [Op.ne]: "cancelled" } }, transaction });
          await notificationService.emitForPatient({ tenantId, patientId: appt.patient_id, type: "appointment_cancelled", relatedEntity: "appointment", relatedRef: String(appt.id), transaction });
        }
      }
      await AppointmentSlot.update(updates, { where: { id: row.id, tenant_id: tenantId, status: { [Op.in]: ["open", "booked"] } }, transaction });
      await auditService.record({ tenantId, action: "booking.slot_cancelled", entity: "appointment_slot", entityRef: String(row.id), metadata: { appointmentId: row.appointment_id ? String(row.appointment_id) : null }, actorType: "doctor", actorId: actor.userId, ip, transaction });
      return { id: String(row.id), status: "cancelled" };
    });
  },
};

export default bookingService;
