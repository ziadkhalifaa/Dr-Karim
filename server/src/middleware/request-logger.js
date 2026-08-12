import { logger } from "../utils/logger.js";

// Request logger that records NO PHI: only method, pathname (no query),
// status, duration, and the correlation id. Body/headers are never logged.
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - start) / 1e6) || 0;
    const path = req.originalUrl ? req.originalUrl.split("?")[0] : req.path;
    logger.info(`${req.method} ${path} ${res.statusCode}`, {
      requestId: req.id,
      method: req.method,
      path,
      status: res.statusCode,
      durationMs,
    });
  });
  next();
}
