import { ok } from "../middleware/api-response.js";
import { planService } from "../services/plan.service.js";

function controller(domain) {
  return {
    async create(req, res, next) { try { return ok(res, 201, await planService.create(domain, { tenantId: req.tenant.id, auth: req.auth, body: req.body || {} })); } catch (err) { return next(err); } },
    async get(req, res, next) { try { return ok(res, 200, await planService.get(domain, { planId: req.params.id, tenantId: req.tenant.id, auth: req.auth })); } catch (err) { return next(err); } },
    async patient(req, res, next) { try { return ok(res, 200, await planService.getPatient(domain, { patientId: req.params.id, tenantId: req.tenant.id, auth: req.auth })); } catch (err) { return next(err); } },
    async version(req, res, next) { try { return ok(res, 201, await planService.createVersion(domain, { planId: req.params.id, tenantId: req.tenant.id, auth: req.auth, body: req.body || {} })); } catch (err) { return next(err); } },
    async submitReview(req, res, next) { try { return ok(res, 200, await planService.submitReview(domain, { versionId: req.params.id, tenantId: req.tenant.id, auth: req.auth })); } catch (err) { return next(err); } },
    async approve(req, res, next) { try { return ok(res, 200, await planService.approve(domain, { versionId: req.params.id, tenantId: req.tenant.id, auth: req.auth })); } catch (err) { return next(err); } },
    async activate(req, res, next) { try { return ok(res, 200, await planService.activate(domain, { versionId: req.params.id, tenantId: req.tenant.id, auth: req.auth })); } catch (err) { return next(err); } },
    async archive(req, res, next) { try { return ok(res, 200, await planService.archive(domain, { versionId: req.params.id, tenantId: req.tenant.id, auth: req.auth })); } catch (err) { return next(err); } },
    async note(req, res, next) { try { return ok(res, 201, await planService.addNote(domain, { planId: req.params.id, tenantId: req.tenant.id, auth: req.auth, body: req.body?.body, visibility: req.body?.visibility })); } catch (err) { return next(err); } },
  };
}

export const nutritionPlanController = controller("nutrition");
export const exercisePlanController = controller("exercise");
