import { Router } from "express";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth.js";
import * as servicesController from "../controllers/services.controller.js";

const router = Router();

// ===== DOCTOR (protected) =====
router.get("/doctor/services", authenticateOptional, requireAuth, requireRole("doctor", "admin"), servicesController.listAllServices);
router.post("/doctor/services", authenticateOptional, requireAuth, requireRole("doctor", "admin"), servicesController.createService);
router.patch("/doctor/services/:id", authenticateOptional, requireAuth, requireRole("doctor", "admin"), servicesController.updateService);
router.delete("/doctor/services/:id", authenticateOptional, requireAuth, requireRole("doctor", "admin"), servicesController.deleteService);

export default router;
