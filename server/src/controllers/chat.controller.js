/**
 * chat.controller.js
 * Patient: GET  /api/v1/chat/session         → get or create session + last messages
 *          POST /api/v1/chat/messages         → send a message
 *          GET  /api/v1/chat/messages         → list messages (paginated)
 *          POST /api/v1/chat/messages/:id/read → mark all as read
 * Doctor:  GET  /api/v1/chat/sessions        → list all patient sessions with unread counts
 *          GET  /api/v1/chat/sessions/:sid/messages → messages in a specific session
 *          POST /api/v1/chat/sessions/:sid/messages → reply in a session
 */
import { Op } from "sequelize";
import { ChatSession, ChatMessage } from "../models/22_messaging.js";
import { ok } from "../middleware/api-response.js";
import { AppError } from "../utils/errors.js";

function tenantId(req) { return req.tenant?.id || 1; }

function requireAuth(req) {
  if (!req.auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
}

function requireDoctor(req) {
  requireAuth(req);
  const role = req.auth.membership?.role;
  if (!["doctor", "staff"].includes(role))
    throw new AppError(403, "FORBIDDEN", "Doctors only");
}

function requirePatient(req) {
  requireAuth(req);
  if (req.auth.membership?.role !== "patient")
    throw new AppError(403, "FORBIDDEN", "Patients only");
}

// ─── PATIENT ───────────────────────────────────────────────

// GET /api/v1/chat/session  — get (or auto-create) the patient's chat session
export async function getOrCreateSession(req, res, next) {
  try {
    requirePatient(req);
    const tid = tenantId(req);
    const patientId = req.auth.user.patient_id;
    if (!patientId) throw new AppError(400, "NO_PATIENT", "Patient ID not found");

    let session = await ChatSession.findOne({ where: { tenant_id: tid, patient_id: patientId } });
    if (!session) {
      session = await ChatSession.create({ tenant_id: tid, patient_id: patientId });
    }

    // Get last 30 messages
    const messages = await ChatMessage.findAll({
      where: { session_id: session.id },
      order: [["created_at", "DESC"]],
      limit: 30,
    });

    // Reset patient unread
    await session.update({ unread_patient: 0 });

    return ok(res, 200, { session, messages: messages.reverse() });
  } catch (e) { return next(e); }
}

// POST /api/v1/chat/messages — patient sends message
export async function patientSend(req, res, next) {
  try {
    requirePatient(req);
    const tid = tenantId(req);
    const patientId = req.auth.user.patientId || req.auth.membership?.patient_id;
    if (!patientId) throw new AppError(400, "NO_PATIENT", "Patient ID not found");

    const { content, attachment_url, attachment_type } = req.body;
    if (!content && !attachment_url)
      throw new AppError(400, "VALIDATION_ERROR", "content or attachment_url is required");

    let session = await ChatSession.findOne({ where: { tenant_id: tid, patient_id: patientId } });
    if (!session) {
      session = await ChatSession.create({ tenant_id: tid, patient_id: patientId });
    }

    const msg = await ChatMessage.create({
      tenant_id: tid,
      session_id: session.id,
      sender_id: req.auth.user.id,
      sender_role: "patient",
      content: content || null,
      attachment_url: attachment_url || null,
      attachment_type: attachment_type || null,
    });

    // Bump unread count for doctor
    await session.update({
      last_message_at: new Date(),
      unread_doctor: session.unread_doctor + 1,
    });

    return ok(res, 201, msg);
  } catch (e) { return next(e); }
}

// ─── DOCTOR ────────────────────────────────────────────────

// GET /api/v1/chat/sessions — list all patient sessions
export async function listSessions(req, res, next) {
  try {
    requireDoctor(req);
    const sessions = await ChatSession.findAll({
      where: { tenant_id: tenantId(req) },
      order: [["last_message_at", "DESC"]],
    });
    return ok(res, 200, sessions);
  } catch (e) { return next(e); }
}

// GET /api/v1/chat/sessions/:sid/messages — messages in a session
export async function sessionMessages(req, res, next) {
  try {
    requireDoctor(req);
    const session = await ChatSession.findOne({
      where: { id: req.params.sid, tenant_id: tenantId(req) },
    });
    if (!session) throw new AppError(404, "NOT_FOUND", "Session not found");

    const before = req.query.before; // pagination cursor
    const whereClause = { session_id: session.id };
    if (before) whereClause.id = { [Op.lt]: before };

    const messages = await ChatMessage.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    // Reset doctor unread
    await session.update({ unread_doctor: 0 });

    return ok(res, 200, messages.reverse());
  } catch (e) { return next(e); }
}

// POST /api/v1/chat/sessions/:sid/messages — doctor replies
export async function doctorReply(req, res, next) {
  try {
    requireDoctor(req);
    const tid = tenantId(req);
    const session = await ChatSession.findOne({ where: { id: req.params.sid, tenant_id: tid } });
    if (!session) throw new AppError(404, "NOT_FOUND", "Session not found");

    const { content, attachment_url, attachment_type } = req.body;
    if (!content && !attachment_url)
      throw new AppError(400, "VALIDATION_ERROR", "content or attachment_url is required");

    const msg = await ChatMessage.create({
      tenant_id: tid,
      session_id: session.id,
      sender_id: req.auth.user.id,
      sender_role: req.auth.membership?.role,
      content: content || null,
      attachment_url: attachment_url || null,
      attachment_type: attachment_type || null,
    });

    await session.update({
      last_message_at: new Date(),
      unread_patient: session.unread_patient + 1,
    });

    return ok(res, 201, msg);
  } catch (e) { return next(e); }
}

export const chatController = {
  getOrCreateSession,
  patientSend,
  listSessions,
  sessionMessages,
  doctorReply,
};
