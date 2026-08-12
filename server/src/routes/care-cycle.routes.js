import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { checkinController } from "../controllers/checkin.controller.js";
import { appointmentController } from "../controllers/appointment.controller.js";
import { liveSessionController } from "../controllers/live-session.controller.js";

export function careCycleRouter() {
  const router = express.Router();
  router.use(requireAuth);
  router.post("/patients/:id/checkins", requireRole("patient", "doctor"), checkinController.create);
  router.get("/patients/:id/checkins", requireRole("patient", "doctor", "staff"), checkinController.list);
  router.get("/patients/:id/checkins/:checkinId", requireRole("patient", "doctor", "staff"), checkinController.get);
  router.post("/checkins/:id/review", requireRole("doctor"), checkinController.review);

  router.post("/appointments", requireRole("patient", "doctor"), appointmentController.create);
  router.get("/appointments/:id", requireRole("patient", "doctor", "staff"), appointmentController.get);
  router.get("/patients/:id/appointments", requireRole("patient", "doctor", "staff"), appointmentController.patientList);
  router.get("/doctors/:id/appointments", requireRole("doctor", "staff"), appointmentController.doctorList);
  router.post("/appointments/:id/confirm", requireRole("doctor"), (req, res, next) => { req.transition = "confirmed"; return appointmentController.transition(req, res, next); });
  router.post("/appointments/:id/cancel", requireRole("doctor"), (req, res, next) => { req.transition = "cancelled"; return appointmentController.transition(req, res, next); });
  router.post("/appointments/:id/complete", requireRole("doctor"), (req, res, next) => { req.transition = "completed"; return appointmentController.transition(req, res, next); });
  router.post("/appointments/:id/no-show", requireRole("doctor"), (req, res, next) => { req.transition = "no_show"; return appointmentController.transition(req, res, next); });

  router.post("/appointments/:id/live-session", requireRole("doctor"), liveSessionController.create);
  router.get("/live-sessions/:id", requireRole("patient", "doctor", "staff"), liveSessionController.get);
  router.post("/live-sessions/:id/join", requireRole("patient", "doctor"), liveSessionController.join);
  router.post("/live-sessions/:id/end", requireRole("doctor"), liveSessionController.end);
  router.post("/live-sessions/:id/notes", requireRole("doctor"), liveSessionController.addNote);
  router.get("/live-sessions/:id/notes", requireRole("patient", "doctor", "staff"), liveSessionController.notes);
  return router;
}

export default careCycleRouter;
