import { ok } from "../middleware/api-response.js";
import { foodService } from "../services/food.service.js";

export const foodController = {
  async list(req, res, next) {
    try {
      return ok(res, 200, await foodService.list({ tenantId: req.tenant.id, auth: req.auth, query: req.query }));
    } catch (err) {
      return next(err);
    }
  },
};

export default foodController;
