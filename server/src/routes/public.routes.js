import { Router } from "express";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth.js";
import {
  listServices,
  getService,
  getPublicSettings,
  submitContact,
  listContacts,
  markContactRead,
  listPackages,
} from "../controllers/public.controller.js";

const router = Router();

// ===== PUBLIC (no auth needed) =====
router.get("/services", listServices);
router.get("/services/:code", getService);
router.get("/packages", listPackages);
router.get("/settings", getPublicSettings);
router.post("/contact", submitContact);

// ===== DOCTOR protected =====
router.get(
  "/doctor/contacts",
  authenticateOptional, requireAuth, requireRole("doctor", "admin"),
  listContacts
);
router.patch(
  "/doctor/contacts/:id/read",
  authenticateOptional, requireAuth, requireRole("doctor", "admin"),
  markContactRead
);

export default router;
