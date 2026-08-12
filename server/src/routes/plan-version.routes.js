import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { nutritionPlanController, exercisePlanController } from "../controllers/plan.controller.js";

function routerFor(controller) {
  const router = express.Router();
  router.use(requireAuth, requireRole("doctor"));
  router.post("/:id/submit-review", controller.submitReview);
  router.post("/:id/approve", controller.approve);
  router.post("/:id/activate", controller.activate);
  router.post("/:id/archive", controller.archive);
  return router;
}

export function nutritionPlanVersionRouter() { return routerFor(nutritionPlanController); }
export function exercisePlanVersionRouter() { return routerFor(exercisePlanController); }
