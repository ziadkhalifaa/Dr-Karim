import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import {
  authenticateOptional,
  requireAuth,
  requireTenantAccess,
} from "../middleware/auth.js";
import { simpleRateLimit } from "../utils/rate-limit.js";

export function authRouter() {
  const r = Router();
  const loginLimit = simpleRateLimit({ windowMs: 60000, max: 10, key: (req) => `${req.ip}:${String(req.body?.identifier || "").toLowerCase()}` });
  r.post("/register", simpleRateLimit({ windowMs: 60000, max: 10 }), authController.register);
  r.post("/login", loginLimit, authController.login);
  r.post("/refresh", simpleRateLimit({ max: 20 }), authController.refresh);
  r.post("/logout", authenticateOptional, authController.logout);
r.get(
  "/me",
  authenticateOptional,
  requireAuth,
  requireTenantAccess,
  authController.me,
);
  r.post("/password-reset/request", simpleRateLimit({ max: 5 }), authController.requestReset);
  r.post("/password-reset/confirm", simpleRateLimit({ max: 5 }), authController.confirmReset);
  return r;
}
