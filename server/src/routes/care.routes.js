import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { careController } from "../controllers/care.controller.js";

// Phase 6B — Daily Care Program.
// Authoring is doctor-only; recording is patient/doctor; reads are
// patient-own or doctor/staff. Each service re-verifies role ownership.
export function careRouter() {
  const router = express.Router();
  router.use(requireAuth);

  // Doctor authoring
  router.post("/care/programs", careController.create);
  router.get("/care/programs", careController.list);
  router.get("/care/programs/:id", careController.get);
  router.post("/care/programs/:id/versions", careController.createVersion);
  router.post("/care/programs/:id/definitions", careController.addDefinitions);
  router.post("/care/programs/:id/activate", careController.activate);
  router.get("/care/programs/:id/summary", careController.programSummary);

  // Patient daily care
  router.get("/care/dashboard", careController.dashboard);
  router.get("/care/days/:dayId", careController.day);
  router.post("/care/days/:dayId/checkin", careController.checkin);
  router.get("/care/days/:dayId/checkins", careController.checkinsForDay);

  // Execution recording
  router.post("/care/instances/:instanceId/record", careController.record);
  router.post("/care/executions/:executionId/correct", careController.correct);

  return router;
}

export default careRouter;