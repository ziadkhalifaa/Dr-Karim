import { Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sequelize } from "../config/database.js";
import { ok } from "../middleware/api-response.js";
import { AppError, ERROR_CODES } from "../utils/errors.js";
import { models } from "../models/index.js";
import { hashPassword } from "../utils/auth-crypto.js";

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

  r.get("/setup", async (_req, res, next) => {
    try {
      import("child_process").then(({ exec }) => {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const migratePath = path.resolve(__dirname, "../../scripts/migrate.js");
        const seedPath = path.resolve(__dirname, "../../scripts/seed.js");
        const cmd = `"${process.execPath}" "${migratePath}" && "${process.execPath}" "${seedPath}"`;
        
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            res.status(500).json({ success: false, message: "Migration failed", error: error.message, stderr, stdout });
            return;
          }
          res.json({ success: true, message: "Database migrated and seeded successfully!", output: stdout });
        });
      });
    } catch (err) {
      next(err);
    }
  });

  // One-time doctor account creation — use once then remove or protect
  r.get("/init-doctor", async (req, res, next) => {
    try {
      const { AuthUser, AuthUserTenant, Doctor, Tenant } = models;
      
      const tenant = await Tenant.findOne({ where: { slug: "dr-kareem" } });
      if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found. Run /setup first." });
      
      const doctor = await Doctor.findOne({ where: { tenant_id: tenant.id } });
      if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found. Run /setup first." });

      const email = doctor.email || "drkareemeliethy@gmail.com";
      const password = "DrKareem@2026!";

      // Check if account already exists
      const existing = await AuthUser.findOne({ where: { email } });
      if (existing) {
        return res.json({ success: true, message: "Account already exists.", email, note: "Use the password you set." });
      }

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