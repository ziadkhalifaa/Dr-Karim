import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { nutritionPlanController, exercisePlanController } from "../controllers/plan.controller.js";

function routerFor(controller) {
  const router = express.Router();
  router.use(requireAuth);
  router.post("/", requireRole("doctor"), controller.create);
  router.get("/:id", requireRole("doctor", "staff"), controller.get);
  router.post("/:id/versions", requireRole("doctor"), controller.version);
  router.post("/:id/notes", requireRole("doctor"), controller.note);
  return router;
}

export function nutritionPlanRouter() { return routerFor(nutritionPlanController); }
export function exercisePlanRouter() { return routerFor(exercisePlanController); }

export function patientPlanRouter(controller) {
  const router = express.Router();
  router.use(requireAuth, requireRole("doctor", "staff", "patient"));
  router.get("/:id/nutrition-plan", controller.patient);
  return router;
}
