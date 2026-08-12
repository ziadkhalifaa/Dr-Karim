import { ok } from "../middleware/api-response.js";
import { appointmentService } from "../services/appointment.service.js";

export const appointmentController = {
  async create(req, res, next) { try { return ok(res, 201, await appointmentService.create({ tenantId: req.tenant.id, auth: req.auth, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async get(req, res, next) { try { return ok(res, 200, await appointmentService.get({ tenantId: req.tenant.id, id: req.params.id, auth: req.auth })); } catch (err) { return next(err); } },
  async patientList(req, res, next) { try { return ok(res, 200, await appointmentService.listPatient({ tenantId: req.tenant.id, patientId: req.params.id, auth: req.auth })); } catch (err) { return next(err); } },
  async doctorList(req, res, next) { try { return ok(res, 200, await appointmentService.listDoctor({ tenantId: req.tenant.id, doctorId: req.params.id, auth: req.auth })); } catch (err) { return next(err); } },
  async transition(req, res, next) { try { return ok(res, 200, await appointmentService.transition({ tenantId: req.tenant.id, id: req.params.id, auth: req.auth, to: req.body?.status || req.transition, ip: req.ip })); } catch (err) { return next(err); } },
};
