import { ok } from "../middleware/api-response.js";
import { doctorReviewService } from "../services/doctor-review.service.js";

export const doctorReviewController = {
  async list(req, res, next) { try { return ok(res, 200, await doctorReviewService.list({ tenantId: req.tenant.id, status: req.query.status, limit: req.query.limit })); } catch (err) { return next(err); } },
  async get(req, res, next) { try { return ok(res, 200, await doctorReviewService.get({ reviewId: req.params.id, tenantId: req.tenant.id })); } catch (err) { return next(err); } },
  async events(req, res, next) { try { return ok(res, 200, await doctorReviewService.events({ reviewId: req.params.id, tenantId: req.tenant.id })); } catch (err) { return next(err); } },
  async assign(req, res, next) { try { return ok(res, 200, await doctorReviewService.assign({ reviewId: req.params.id, tenantId: req.tenant.id, auth: req.auth, doctorId: req.body?.doctorId, note: req.body?.note })); } catch (err) { return next(err); } },
  async open(req, res, next) { try { return ok(res, 200, await doctorReviewService.open({ reviewId: req.params.id, tenantId: req.tenant.id, auth: req.auth })); } catch (err) { return next(err); } },
  async clarification(req, res, next) { try { return ok(res, 200, await doctorReviewService.clarify({ reviewId: req.params.id, tenantId: req.tenant.id, auth: req.auth, note: req.body?.note })); } catch (err) { return next(err); } },
  async approve(req, res, next) { try { return ok(res, 200, await doctorReviewService.approve({ reviewId: req.params.id, tenantId: req.tenant.id, auth: req.auth, note: req.body?.note, profile: req.body?.profile })); } catch (err) { return next(err); } },
  async reject(req, res, next) { try { return ok(res, 200, await doctorReviewService.reject({ reviewId: req.params.id, tenantId: req.tenant.id, auth: req.auth, reason: req.body?.reason })); } catch (err) { return next(err); } },
  async addNote(req, res, next) { try { return ok(res, 201, await doctorReviewService.addNote({ reviewId: req.params.id, tenantId: req.tenant.id, auth: req.auth, body: req.body?.body, visibility: req.body?.visibility, parentNoteId: req.body?.parentNoteId, correctionReason: req.body?.correctionReason })); } catch (err) { return next(err); } },
};
