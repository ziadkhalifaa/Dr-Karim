import { ok } from "../middleware/api-response.js";
import { patientService } from "../services/patient.service.js";

export const patientController = {
  async list(req, res, next) { try { return ok(res, 200, await patientService.list({ tenantId: req.tenant.id, auth: req.auth, query: req.query })); } catch (e) { return next(e); } },
  async get(req, res, next) { try { return ok(res, 200, await patientService.get({ tenantId: req.tenant.id, auth: req.auth, patientId: req.params.id })); } catch (e) { return next(e); } },
  async planVersions(req, res, next) { try { return ok(res, 200, await patientService.planVersions({ tenantId: req.tenant.id, auth: req.auth, patientId: req.params.id })); } catch (e) { return next(e); } },
  async home(req, res, next) { try { return ok(res, 200, await patientService.home({ tenantId: req.tenant.id, auth: req.auth })); } catch (e) { return next(e); } },
  async meSubscription(req, res, next) { try { return ok(res, 200, await patientService.meSubscription({ tenantId: req.tenant.id, auth: req.auth })); } catch (e) { return next(e); } },
};

export default patientController;