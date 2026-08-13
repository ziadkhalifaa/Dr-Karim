import { Router } from "express";
import { sequelize } from "../config/database.js";
import { ok } from "../middleware/api-response.js";
import { AppError, ERROR_CODES } from "../utils/errors.js";
import { models } from "../models/index.js";
import { hashPassword, randomToken } from "../utils/auth-crypto.js";
import env from "../config/env.js";

export function healthRouter() {
  const r = Router();
  r.get("/", async (_req, res, next) => {
    try {
      await sequelize.query("SELECT 1");
      ok(res, 200, { status: "ok", db: "up", timestamp: new Date().toISOString(), version: "1" });
    } catch {
      next(new AppError(503, ERROR_CODES.DB_UNAVAILABLE, "Database unavailable"));
    }
  });

  // One-time doctor account creation. Disabled unless AUTH_SETUP_TOKEN is set,
  // and requires Authorization: Bearer <AUTH_SETUP_TOKEN>. Generates a random
  // password returned once to the caller. Delete the token from env after use.
  r.get("/init-doctor", async (req, res, next) => {
    try {
      if (!env.AUTH_SETUP_TOKEN) {
        return next(new AppError(404, ERROR_CODES.NOT_FOUND, "Setup endpoint is disabled"));
      }
      const supplied = String(req.headers.authorization || "").replace(/^Bearer\s+/iu, "");
      if (!supplied || supplied !== env.AUTH_SETUP_TOKEN) {
        return next(new AppError(403, "SETUP_FORBIDDEN", "Setup token is missing or invalid"));
      }

      const { AuthUser, AuthUserTenant, Doctor, Tenant } = models;

      const tenant = await Tenant.findOne({ where: { slug: "dr-kareem" } });
      if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found. Run migrations and seed first." });

      const doctor = await Doctor.findOne({ where: { tenant_id: tenant.id } });
      if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found. Run migrations and seed first." });

      const email = doctor.email || "drkareemeliethy@gmail.com";

      const existing = await AuthUser.findOne({ where: { email } });
      if (existing) {
        return res.json({ success: true, message: "Account already exists.", email, note: "Use the password you set." });
      }

      const password = randomToken(18);
      const password_hash = await hashPassword(password);
      const authUser = await AuthUser.create({
        email,
        password_hash,
        user_type: "doctor",
        doctor_id: doctor.id,
        status: "enabled",
      });

      await AuthUserTenant.create({
        user_id: authUser.id,
        tenant_id: tenant.id,
        role: "doctor",
        active: true,
      });

      res.json({
        success: true,
        message: "Doctor account created successfully!",
        credentials: { email, password, note: "Change your password after first login!" }
      });
    } catch (err) {
      next(err);
    }
  });

  return r;
}

export default healthRouter;