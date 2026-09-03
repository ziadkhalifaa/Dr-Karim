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

  async create(req, res, next) {
    try {
      if (req.auth.role !== "doctor" && req.auth.role !== "admin") {
        return ok(res, 403, { message: "غير مصرح لك بإضافة أصناف طعام" });
      }
      return ok(res, 201, await foodService.create(req.body));
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      if (req.auth.role !== "doctor" && req.auth.role !== "admin") {
        return ok(res, 403, { message: "غير مصرح لك بتعديل أصناف طعام" });
      }
      return ok(res, 200, await foodService.update(req.params.id, req.body));
    } catch (err) {
      return next(err);
    }
  },

  async remove(req, res, next) {
    try {
      if (req.auth.role !== "doctor" && req.auth.role !== "admin") {
        return ok(res, 403, { message: "غير مصرح لك بحذف أصناف طعام" });
      }
      return ok(res, 200, await foodService.remove(req.params.id));
    } catch (err) {
      return next(err);
    }
  },
};

export default foodController;
