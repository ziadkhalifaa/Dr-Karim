import { Router } from "express";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth.js";
import * as packageController from "../controllers/package.controller.js";

const router = Router();

// ===== DOCTOR (protected) =====
router.get("/", authenticateOptional, requireAuth, requireRole("doctor", "admin"), packageController.listPackages);
router.post("/", authenticateOptional, requireAuth, requireRole("doctor", "admin"), packageController.createPackage);
router.patch("/:id", authenticateOptional, requireAuth, requireRole("doctor", "admin"), packageController.updatePackage);
router.delete("/:id", authenticateOptional, requireAuth, requireRole("doctor", "admin"), packageController.deletePackage);

export default router;
