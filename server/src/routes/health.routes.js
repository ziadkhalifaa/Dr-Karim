import { Router } from "express";
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
  return r;
}

export default healthRouter;