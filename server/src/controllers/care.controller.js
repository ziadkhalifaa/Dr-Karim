import { ok } from "../middleware/api-response.js";
import { careProgramService } from "../services/care-program.service.js";
import { careService } from "../services/care.service.js";
import { careExecutionService } from "../services/care-execution.service.js";
import { carePointsService } from "../services/care-points.service.js";

export const careController = {
  // Doctor authoring
  async create(req, res, next) { try { return ok(res, 201, await careProgramService.create({ tenantId: req.tenant.id, auth: req.auth, body: req.body || {} })); } catch (err) { return next(err); } },
  async list(req, res, next) { try { return ok(res, 200, await careProgramService.list({ tenantId: req.tenant.id, auth: req.auth, query: req.query })); } catch (err) { return next(err); } },
  async get(req, res, next) { try { return ok(res, 200, await careProgramService.get({ tenantId: req.tenant.id, programId: req.params.id, auth: req.auth })); } catch (err) { return next(err); } },
  async createVersion(req, res, next) { try { return ok(res, 201, await careProgramService.createVersion({ tenantId: req.tenant.id, programId: req.params.id, auth: req.auth, body: req.body || {} })); } catch (err) { return next(err); } },
  async addDefinitions(req, res, next) { try { return ok(res, 201, await careProgramService.addDefinitions({ tenantId: req.tenant.id, programId: req.params.id, auth: req.auth, body: req.body || {} })); } catch (err) { return next(err); } },
  async activate(req, res, next) { try { return ok(res, 200, await careProgramService.activate({ tenantId: req.tenant.id, programId: req.params.id, auth: req.auth, versionNo: req.query.versionNo })); } catch (err) { return next(err); } },
  async delete(req, res, next) { try { return ok(res, 200, await careProgramService.delete({ tenantId: req.tenant.id, programId: req.params.id, auth: req.auth })); } catch (err) { return next(err); } },

  // Patient dashboard / summaries
  async dashboard(req, res, next) { try { return ok(res, 200, await careService.dashboard({ tenantId: req.tenant.id, auth: req.auth })); } catch (err) { return next(err); } },
  async day(req, res, next) { try { return ok(res, 200, await careService.day({ tenantId: req.tenant.id, dayId: req.params.dayId, auth: req.auth })); } catch (err) { return next(err); } },
  async programSummary(req, res, next) { try { return ok(res, 200, await careService.programSummary({ tenantId: req.tenant.id, programId: req.params.id, auth: req.auth, from: req.query.from, to: req.query.to })); } catch (err) { return next(err); } },

  // Patient execution recording
  async record(req, res, next) { try { return ok(res, 201, await careExecutionService.record({ tenantId: req.tenant.id, instanceId: req.params.instanceId, auth: req.auth, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async correct(req, res, next) { try { return ok(res, 201, await careExecutionService.correct({ tenantId: req.tenant.id, executionId: req.params.executionId, auth: req.auth, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async checkin(req, res, next) { try { return ok(res, 201, await careExecutionService.checkin({ tenantId: req.tenant.id, dayId: req.params.dayId, auth: req.auth, body: req.body || {}, ip: req.ip })); } catch (err) { return next(err); } },
  async checkinsForDay(req, res, next) { try { return ok(res, 200, await careExecutionService.checkinsForDay({ tenantId: req.tenant.id, dayId: req.params.dayId, auth: req.auth })); } catch (err) { return next(err); } },

  // Points & rewards
  async balance(req, res, next) { try { return ok(res, 200, await carePointsService.getBalance(String(req.auth.user.patient_id), req.tenant.id, req.query.programId)); } catch (err) { return next(err); } },
  async leaderboard(req, res, next) { try { return ok(res, 200, await carePointsService.getLeaderboard(req.tenant.id, req.query.programId)); } catch (err) { return next(err); } },
  async redeem(req, res, next) { try { return ok(res, 201, await carePointsService.redeem({ tenantId: req.tenant.id, patientId: String(req.auth.user.patient_id), programId: req.body.programId, productId: req.body.productId, pointsToSpend: Number(req.body.pointsToSpend), transaction: null })); } catch (err) { return next(err); } },
};

export default careController;