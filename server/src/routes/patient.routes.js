import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { patientController } from "../controllers/patient.controller.js";

// /patients — Phase 6D directory: doctor/staff list + detail aggregate, and the
// patient's own state-driven home aggregate.
export function patientRouter() {
  const r = Router();
  r.use(requireAuth);
  r.get("/", requireRole("doctor", "staff"), patientController.list);
  r.get("/me/home", requireRole("patient"), patientController.home);
  r.get("/:id/plan-versions", requireRole("doctor", "staff"), patientController.planVersions);
  r.get("/:id", requireRole("doctor", "staff", "patient"), patientController.get);
  return r;
}

export default patientRouter;