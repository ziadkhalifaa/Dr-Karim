import { ok } from "../middleware/api-response.js";
import { checkinService } from "../services/checkin.service.js";

export const checkinController = {
  async create(req, res, next) { try { return ok(res, 201, await checkinService.create({ tenantId: req.tenant.id, patientId: req.params.id, auth: req.auth, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async list(req, res, next) { try { return ok(res, 200, await checkinService.list({ tenantId: req.tenant.id, patientId: req.params.id, auth: req.auth })); } catch (err) { return next(err); } },
  async get(req, res, next) { try { return ok(res, 200, await checkinService.get({ tenantId: req.tenant.id, patientId: req.params.id, checkinId: req.params.checkinId, auth: req.auth })); } catch (err) { return next(err); } },
  async review(req, res, next) { try { return ok(res, 200, await checkinService.review({ tenantId: req.tenant.id, checkinId: req.params.id, auth: req.auth, doctorNote: req.body?.doctorNote })); } catch (err) { return next(err); } },
};
