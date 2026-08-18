import { ok } from "../middleware/api-response.js";
import { doctorStatsService } from "../services/doctor-stats.service.js";

export const doctorStatsController = {
  async overview(req, res, next) {
    try {
      const data = await doctorStatsService.overview({ tenantId: req.tenant.id, auth: req.auth });
      return ok(res, 200, data);
    } catch (err) {
      return next(err);
    }
  },
};

export default doctorStatsController;