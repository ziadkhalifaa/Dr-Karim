import { Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sequelize } from "../config/database.js";
import { ok } from "../middleware/api-response.js";
import { AppError, ERROR_CODES } from "../utils/errors.js";

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

  return r;
}

export default healthRouter;