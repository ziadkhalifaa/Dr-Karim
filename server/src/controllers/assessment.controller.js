import { ok } from "../middleware/api-response.js";
import { assessmentService } from "../services/assessment.service.js";

export const assessmentController = {
  async submit(req, res, next) {
    try {
      const result = await assessmentService.submit(req.body, { tenant: req.tenant, ip: req.ip });
      ok(res, 201, {
        referenceNumber: result.referenceNumber,
        overallTier: result.overallTier,
        reviewState: result.reviewState,
        nextStep: result.nextStep,
      });
    } catch (err) {
      next(err);
    }
  },
};