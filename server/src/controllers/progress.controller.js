import { ok } from "../middleware/api-response.js";
import { progressMeasurementService } from "../services/progress-measurement.service.js";
import { progressGoalService } from "../services/progress-goal.service.js";
import { progressService } from "../services/progress.service.js";

// Phase 6C — Progress & Measurements.
export const progressController = {
  // Measurements
  async listMeasurements(req, res, next) { try { return ok(res, 200, await progressMeasurementService.list({ tenantId: req.tenant.id, auth: req.auth, patientId: req.query.patientId, query: req.query })); } catch (err) { return next(err); } },
  async recordMeasurement(req, res, next) { try { return ok(res, 201, await progressMeasurementService.record({ tenantId: req.tenant.id, auth: req.auth, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async correctMeasurement(req, res, next) { try { return ok(res, 201, await progressMeasurementService.correct({ tenantId: req.tenant.id, auth: req.auth, measurementId: req.params.id, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async measurementSummary(req, res, next) { try { return ok(res, 200, await progressMeasurementService.summaryForType({ tenantId: req.tenant.id, auth: req.auth, patientId: req.query.patientId, type: req.params.type })); } catch (err) { return next(err); } },

  // Progress dashboard
  async dashboard(req, res, next) { try { return ok(res, 200, await progressService.dashboard({ tenantId: req.tenant.id, auth: req.auth, patientId: req.query.patientId })); } catch (err) { return next(err); } },

  // Cadence context
  async getContext(req, res, next) { try { return ok(res, 200, await progressMeasurementService.getContext({ tenantId: req.tenant.id, auth: req.auth, patientId: req.query.patientId })); } catch (err) { return next(err); } },
  async updateContext(req, res, next) { try { return ok(res, 200, await progressMeasurementService.updateContext({ tenantId: req.tenant.id, auth: req.auth, patientId: req.query.patientId, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },

  // Goals (doctor-managed)
  async listGoals(req, res, next) { try { return ok(res, 200, await progressGoalService.list({ tenantId: req.tenant.id, auth: req.auth, patientId: req.query.patientId, status: req.query.status })); } catch (err) { return next(err); } },
  async getGoal(req, res, next) { try { return ok(res, 200, await progressGoalService.get({ tenantId: req.tenant.id, auth: req.auth, goalId: req.params.id })); } catch (err) { return next(err); } },
  async createGoal(req, res, next) { try { return ok(res, 201, await progressGoalService.create({ tenantId: req.tenant.id, auth: req.auth, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async activateGoal(req, res, next) { try { return ok(res, 200, await progressGoalService.activate({ tenantId: req.tenant.id, auth: req.auth, goalId: req.params.id, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async addGoalVersion(req, res, next) { try { return ok(res, 201, await progressGoalService.addVersion({ tenantId: req.tenant.id, auth: req.auth, goalId: req.params.id, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async closeGoal(req, res, next) { try { return ok(res, 200, await progressGoalService.close({ tenantId: req.tenant.id, auth: req.auth, goalId: req.params.id, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
};

export default progressController;