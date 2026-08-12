import express from "express";
import { doctorReviewController } from "../controllers/doctor-review.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export function doctorReviewRouter() {
  const router = express.Router();
  router.use(requireAuth, requireRole("doctor", "staff"));
  router.get("/", doctorReviewController.list);
  router.get("/:id", doctorReviewController.get);
  router.get("/:id/events", doctorReviewController.events);
  router.post("/:id/assign", doctorReviewController.assign);
  router.post("/:id/open", doctorReviewController.open);
  router.post("/:id/clarification", doctorReviewController.clarification);
  router.post("/:id/approve", doctorReviewController.approve);
  router.post("/:id/reject", doctorReviewController.reject);
  router.post("/:id/notes", doctorReviewController.addNote);
  return router;
}

export default doctorReviewRouter;
