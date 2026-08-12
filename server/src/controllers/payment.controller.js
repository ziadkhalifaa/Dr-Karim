import { ok } from "../middleware/api-response.js";
import { paymentService } from "../services/payment.service.js";
export const paymentController = {
  async packages(req, res, next) { try { return ok(res, 200, await paymentService.packages({ tenantId: req.tenant.id })); } catch (e) { return next(e); } },
  async package(req, res, next) { try { return ok(res, 200, await paymentService.package({ tenantId: req.tenant.id, id: req.params.id })); } catch (e) { return next(e); } },
  async settings(req, res, next) { try { return ok(res, 200, await paymentService.settings({ tenantId: req.tenant.id })); } catch (e) { return next(e); } },
  async create(req, res, next) { try { return ok(res, 201, await paymentService.create({ tenantId: req.tenant.id, auth: req.auth, body: req.body || {}, ip: req.ip })); } catch (e) { return next(e); } },
  async list(req, res, next) { try { return ok(res, 200, await paymentService.list({ tenantId: req.tenant.id, auth: req.auth })); } catch (e) { return next(e); } },
  async doctorList(req, res, next) { try { return ok(res, 200, await paymentService.list({ tenantId: req.tenant.id, auth: req.auth, doctor: true })); } catch (e) { return next(e); } },
  async get(req, res, next) { try { return ok(res, 200, await paymentService.get({ tenantId: req.tenant.id, auth: req.auth, id: req.params.id })); } catch (e) { return next(e); } },
  async doctorGet(req, res, next) { try { return ok(res, 200, await paymentService.get({ tenantId: req.tenant.id, auth: req.auth, id: req.params.id, doctor: true })); } catch (e) { return next(e); } },
  async receipt(req, res, next) { try { return ok(res, 201, await paymentService.receipt({ tenantId: req.tenant.id, auth: req.auth, id: req.params.id, body: req.body || {}, ip: req.ip })); } catch (e) { return next(e); } },
  async receiptFile(req, res, next) { try { const file = await paymentService.receiptFile({ tenantId: req.tenant.id, auth: req.auth, id: req.params.id }); res.type(file.mimeType).setHeader("Content-Disposition", `inline; filename="${file.name}"`).send(file.file); } catch (e) { return next(e); } },
  async approve(req, res, next) { try { return ok(res, 200, await paymentService.review({ tenantId: req.tenant.id, auth: req.auth, id: req.params.id, decision: "approved", ip: req.ip })); } catch (e) { return next(e); } },
  async reject(req, res, next) { try { return ok(res, 200, await paymentService.review({ tenantId: req.tenant.id, auth: req.auth, id: req.params.id, decision: "rejected", reason: req.body?.reason, ip: req.ip })); } catch (e) { return next(e); } },
  async entitlements(req, res, next) { try { return ok(res, 200, await paymentService.entitlements({ tenantId: req.tenant.id, auth: req.auth })); } catch (e) { return next(e); } },
};
