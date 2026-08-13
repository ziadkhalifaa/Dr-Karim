import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { progressController } from "../controllers/progress.controller.js";

// Phase 6C — Progress & Measurements.
// Goals & cadence configuration are doctor-only; measurements & dashboard reads
// are patient-own or doctor/scoped-by-patient. Each service re-verifies roles.
export function progressRouter() {
  const router = express.Router();
  router.use(requireAuth);

  // Measurements (immutable timeline) §26
  router.get("/progress/measurements", progressController.listMeasurements);
  router.post("/progress/measurements", progressController.recordMeasurement);
  router.get("/progress/measurements/:type/summary", progressController.measurementSummary);
  router.post("/progress/measurements/:id/correct", progressController.correctMeasurement);

  // Dashboard + cadence context
  router.get("/progress/dashboard", progressController.dashboard);
  router.get("/progress/context", progressController.getContext);
  router.put("/progress/context", progressController.updateContext);

  // Goals (doctor-managed, versioned) §26
  router.get("/progress/goals", progressController.listGoals);
  router.get("/progress/goals/:id", progressController.getGoal);
  router.post("/progress/goals", progressController.createGoal);
  router.post("/progress/goals/:id/versions", progressController.addGoalVersion);
  router.post("/progress/goals/:id/activate", progressController.activateGoal);
  router.post("/progress/goals/:id/close", progressController.closeGoal);

  return router;
}

export default progressRouter;