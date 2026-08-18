import { ok } from "../middleware/api-response.js";
import { bookingService } from "../services/booking.service.js";

export const bookingController = {
  async createSlots(req, res, next) { try { return ok(res, 201, await bookingService.createSlots({ tenantId: req.tenant.id, auth: req.auth, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async list(req, res, next) { try { return ok(res, 200, await bookingService.list({ tenantId: req.tenant.id, auth: req.auth, doctorId: req.query.doctorId || null, from: req.query.from || null, to: req.query.to || null, status: req.query.status || null })); } catch (err) { return next(err); } },
  async book(req, res, next) { try { return ok(res, 201, await bookingService.book({ tenantId: req.tenant.id, auth: req.auth, id: req.params.id, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async cancel(req, res, next) { try { return ok(res, 200, await bookingService.cancel({ tenantId: req.tenant.id, auth: req.auth, id: req.params.id, ip: req.ip })); } catch (err) { return next(err); } },
};

export default bookingController;