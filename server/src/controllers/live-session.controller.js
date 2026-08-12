import { ok } from "../middleware/api-response.js";
import { liveSessionService } from "../services/live-session.service.js";

export const liveSessionController = {
  async create(req, res, next) { try { return ok(res, 201, await liveSessionService.create({ tenantId: req.tenant.id, appointmentId: req.params.id, auth: req.auth, ip: req.ip })); } catch (err) { return next(err); } },
  async get(req, res, next) { try { return ok(res, 200, await liveSessionService.get({ tenantId: req.tenant.id, id: req.params.id, auth: req.auth })); } catch (err) { return next(err); } },
  async join(req, res, next) { try { return ok(res, 200, await liveSessionService.join({ tenantId: req.tenant.id, id: req.params.id, auth: req.auth })); } catch (err) { return next(err); } },
  async end(req, res, next) { try { return ok(res, 200, await liveSessionService.end({ tenantId: req.tenant.id, id: req.params.id, auth: req.auth, ip: req.ip })); } catch (err) { return next(err); } },
  async addNote(req, res, next) { try { return ok(res, 201, await liveSessionService.addNote({ tenantId: req.tenant.id, id: req.params.id, auth: req.auth, body: req.body?.body, visibility: req.body?.visibility, parentNoteId: req.body?.parentNoteId, correctionReason: req.body?.correctionReason, ip: req.ip })); } catch (err) { return next(err); } },
  async notes(req, res, next) { try { return ok(res, 200, await liveSessionService.notes({ tenantId: req.tenant.id, id: req.params.id, auth: req.auth })); } catch (err) { return next(err); } },
};
