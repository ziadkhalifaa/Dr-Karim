import { Op } from "sequelize";
import { models, sequelize } from "../models/index.js";
import env from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { auditService } from "./audit.service.js";
import { dailyProvider } from "./daily.provider.js";
import { notificationService } from "./notification.service.js";

const { Appointment, Patient, Doctor, LiveSession, VideoMeeting, VideoMeetingProvider, SessionNote, SessionNoteClarification } = models;

function actor(auth) { if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required"); return { role: auth.membership.role, userId: String(auth.user.id), doctorId: auth.user.doctor_id ? String(auth.user.doctor_id) : null, patientId: auth.user.patient_id ? String(auth.user.patient_id) : null }; }
async function loadLive(id, tenantId, transaction, lock = false) { const row = await LiveSession.findOne({ where: { id, tenant_id: tenantId }, transaction, lock: lock ? transaction.LOCK.UPDATE : undefined, raw: true }); if (!row) throw new AppError(404, "LIVE_SESSION_NOT_FOUND", "Live session not found"); return row; }
function participantAllowed(row, current, write = false) { if (current.role === "doctor" && String(row.doctor_id) === String(current.doctorId)) return; if (current.role === "patient" && String(row.patient_id) === String(current.patientId)) return; if (!write && current.role === "staff") return; throw new AppError(403, "LIVE_SESSION_ACCESS_FORBIDDEN", "Live session access denied"); }
async function meeting(row, tenantId, transaction) { return VideoMeeting.findOne({ where: { live_session_id: row.id, tenant_id: tenantId }, order: [["id", "DESC"]], transaction, raw: true }); }
function sessionPayload(row, vm) { return { ...row, videoMeeting: vm ? { id: vm.id, providerId: vm.provider_id, status: vm.status } : null }; }

export const liveSessionService = {
  async create({ tenantId, appointmentId, auth, ip }) {
    const current = actor(auth); if (current.role !== "doctor" || !current.doctorId) throw new AppError(403, "LIVE_SESSION_WRITE_FORBIDDEN", "Only the assigned doctor may create a live session");
    let failure = null; let result;
    result = await sequelize.transaction(async (transaction) => {
      const appointment = await Appointment.findOne({ where: { id: appointmentId, tenant_id: tenantId, deleted_at: null }, transaction, lock: transaction.LOCK.UPDATE, raw: true });
      if (!appointment) throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Appointment not found");
      if (appointment.type !== "online") throw new AppError(409, "LIVE_SESSION_REQUIRES_ONLINE", "Live sessions require online appointments");
      if (appointment.status !== "confirmed") throw new AppError(409, "LIVE_SESSION_REQUIRES_CONFIRMED", "Appointment must be confirmed before creating a live session");
      if (String(appointment.doctor_id) !== String(current.doctorId)) throw new AppError(403, "LIVE_SESSION_ACCESS_FORBIDDEN", "Only the assigned doctor may create this session");
      const existing = await LiveSession.findOne({ where: { appointment_id: appointment.id, tenant_id: tenantId, status: { [Op.notIn]: ["failed", "ended"] } }, transaction, raw: true });
      if (existing) throw new AppError(409, "LIVE_SESSION_ALREADY_EXISTS", "An active live session already exists for this appointment");
      const session = await LiveSession.create({ tenant_id: tenantId, appointment_id: appointment.id, patient_id: appointment.patient_id, doctor_id: appointment.doctor_id, scheduled_at: appointment.scheduled_start_at, status: "not_started" }, { transaction });
      const [provider] = await VideoMeetingProvider.findOrCreate({ where: { code: "daily" }, defaults: { name: "Daily.co", enabled: true }, transaction });
      const vm = await VideoMeeting.create({ tenant_id: tenantId, live_session_id: session.id, provider_id: provider.id, status: "pending" }, { transaction });
      try {
        const room = await dailyProvider.createRoom({ name: `tenant-${tenantId}-live-${session.id}`, expiresAt: new Date(Date.now() + env.DAILY_ROOM_TTL_SECONDS * 1000) });
        await VideoMeeting.update({ external_room_ref: room.externalRoomRef, external_room_url: room.externalRoomUrl, external_session_ref: room.externalSessionRef, status: "created" }, { where: { id: vm.id }, transaction });
      } catch (error) {
        failure = error;
        await LiveSession.update({ status: "failed" }, { where: { id: session.id }, transaction });
        await VideoMeeting.update({ status: "failed" }, { where: { id: vm.id }, transaction });
      }
      await auditService.record({ tenantId, action: failure ? "live_session.failed" : "live_session.created", entity: "live_session", entityRef: String(session.id), metadata: { appointmentId: String(appointment.id), provider: "daily" }, actorType: current.role, actorId: current.userId, ip, transaction });
      await notificationService.emitForPatient({ tenantId, patientId: appointment.patient_id, type: failure ? "live_session_failed" : "live_session_ready", relatedEntity: "live_session", relatedRef: String(session.id), transaction });
      return { session: session.toJSON(), meeting: await VideoMeeting.findByPk(vm.id, { transaction, raw: true }) };
    });
    if (failure) throw new AppError(failure.status || 502, "LIVE_PROVIDER_FAILURE", "Video provider unavailable; appointment remains confirmed");
    return sessionPayload(result.session, result.meeting);
  },
  async get({ tenantId, id, auth }) { const current = actor(auth); const row = await loadLive(id, tenantId); participantAllowed(row, current); return sessionPayload(row, await meeting(row, tenantId)); },
  async join({ tenantId, id, auth }) {
    const current = actor(auth); const row = await loadLive(id, tenantId); participantAllowed(row, current, true); if (!["not_started", "waiting", "active"].includes(row.status)) throw new AppError(409, "LIVE_SESSION_NOT_JOINABLE", "Live session is not joinable"); const vm = await meeting(row, tenantId); if (!vm?.external_room_ref || vm.status !== "created") throw new AppError(409, "LIVE_SESSION_NOT_READY", "Live provider room is not ready");
    const [person] = current.role === "doctor" ? await Doctor.findAll({ where: { id: row.doctor_id, tenant_id: tenantId }, limit: 1, raw: true }) : await Patient.findAll({ where: { id: row.patient_id, tenant_id: tenantId }, limit: 1, raw: true });
    const expiresAt = new Date(Date.now() + env.DAILY_TOKEN_TTL_SECONDS * 1000); const credential = await dailyProvider.createJoinToken({ roomName: vm.external_room_ref, userId: current.userId, userName: person?.name || person?.full_name || "Participant", isOwner: current.role === "doctor", expiresAt });
    const nextStatus = current.role === "doctor" ? "active" : row.status === "not_started" ? "waiting" : row.status;
    if (nextStatus !== row.status) await LiveSession.update({ status: nextStatus, started_at: nextStatus === "active" ? new Date() : null }, { where: { id: row.id, tenant_id: tenantId, status: row.status } });
    if (!vm.external_room_url) throw new AppError(409, "LIVE_SESSION_URL_UNAVAILABLE", "Live provider join URL is unavailable"); return { liveSessionId: String(row.id), joinUrl: vm.external_room_url, token: credential.token, expiresAt: credential.expiresAt, status: nextStatus };
  },
  async end({ tenantId, id, auth, ip }) {
    const current = actor(auth); if (current.role !== "doctor") throw new AppError(403, "LIVE_SESSION_WRITE_FORBIDDEN", "Only the assigned doctor may end a session");
    return sequelize.transaction(async (transaction) => {
      const row = await loadLive(id, tenantId, transaction, true); participantAllowed(row, current, true); if (!["waiting", "active"].includes(row.status)) throw new AppError(409, "LIVE_SESSION_INVALID_TRANSITION", `Cannot end live session from ${row.status}`);
      const ended = new Date(); const duration = row.started_at ? Math.max(0, Math.floor((ended - new Date(row.started_at)) / 1000)) : null;
      await LiveSession.update({ status: "ended", ended_at: ended, duration_actual_sec: duration }, { where: { id: row.id, tenant_id: tenantId, status: row.status }, transaction });
      const vm = await meeting(row, tenantId, transaction); if (vm) { await VideoMeeting.update({ status: "ended", ended_at: ended, duration_sec: duration }, { where: { id: vm.id }, transaction }); try { await dailyProvider.endRoom(vm.external_room_ref); } catch { /* provider cleanup failure does not alter local completion */ } }
      await auditService.record({ tenantId, action: "live_session.ended", entity: "live_session", entityRef: String(row.id), metadata: { durationSec: duration }, actorType: current.role, actorId: current.userId, ip, transaction });
      const patient = await Patient.findByPk(row.patient_id, { transaction, raw: true }); const cadence = patient?.followup_cadence_days || 7;
      return { ...row, status: "ended", ended_at: ended, duration_actual_sec: duration, nextFollowupSuggestedAt: new Date(ended.getTime() + cadence * 86400000) };
    });
  },
  async addNote({ tenantId, id, auth, body, visibility, parentNoteId, correctionReason, ip }) {
    const current = actor(auth); if (current.role !== "doctor" || !current.doctorId) throw new AppError(403, "SESSION_NOTE_WRITE_FORBIDDEN", "Only the assigned doctor may add session notes");
    const row = await loadLive(id, tenantId); participantAllowed(row, current, true); if (!body || body.length > 10000) throw new AppError(422, "SESSION_NOTE_VALIDATION_ERROR", "A note body is required");
    return sequelize.transaction(async (transaction) => {
      if (parentNoteId) { const parent = await SessionNote.findOne({ where: { id: parentNoteId, live_session_id: row.id, tenant_id: tenantId }, transaction, raw: true }); if (!parent) throw new AppError(404, "SESSION_NOTE_NOT_FOUND", "Parent note not found"); }
      const note = await SessionNote.create({ tenant_id: tenantId, patient_id: row.patient_id, doctor_id: row.doctor_id, appointment_id: row.appointment_id, live_session_id: row.id, parent_note_id: parentNoteId || null, visibility: visibility || "doctor_private", body }, { transaction });
      if (parentNoteId) await SessionNoteClarification.create({ tenant_id: tenantId, note_id: note.id, original_note_id: parentNoteId, reason: correctionReason || null }, { transaction });
      await auditService.record({ tenantId, action: "session_note.created", entity: "session_note", entityRef: String(note.id), metadata: { visibility: visibility || "doctor_private", corrected: Boolean(parentNoteId) }, actorType: current.role, actorId: current.userId, ip, transaction });
      return note.toJSON();
    });
  },
  async notes({ tenantId, id, auth }) { const current = actor(auth); const row = await loadLive(id, tenantId); participantAllowed(row, current); return SessionNote.findAll({ where: { tenant_id: tenantId, live_session_id: row.id, ...(current.role === "patient" ? { visibility: "patient_visible" } : {}) }, order: [["id", "ASC"]], raw: true }); },
};

export default liveSessionService;
