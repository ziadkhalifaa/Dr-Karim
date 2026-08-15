import { createApp } from "./app.js";
import { sequelize } from "./config/database.js";
import { logger } from "./utils/logger.js";
import env from "./config/env.js";
import { ensureDatabaseSync } from "./db-bootstrap.js";

const app = createApp();

let server = null;
let shuttingDown = false;

async function start() {
  try {
    if (env.IS_PRODUCTION) {
      if (!env.AUTH_TOKEN_SECRET || env.AUTH_TOKEN_SECRET.length < 32) throw new Error("AUTH_TOKEN_SECRET must be configured with at least 32 characters in production");
      if (!env.CORS_ORIGINS.length || env.CORS_ORIGINS.some((origin) => /localhost|127\.0\.0\.1/iu.test(origin))) throw new Error("CORS_ORIGINS must contain the production frontend origin in production");
      if (env.DAILY_PROVIDER_MODE === "daily" && !env.DAILY_API_KEY) throw new Error("DAILY_API_KEY must be configured when Daily mode is enabled in production");
    }
    logger.info("starting", { version: "1.0.0", node: process.version });
    if (env.DB_AUTO_SYNC) {
      // Additive, idempotent migrate + seed so every deploy converges the DB
      // catalog with the frontend single-source files (never deletes data).
      await ensureDatabaseSync();
    }
    await sequelize.authenticate();
    logger.info("database connected", { host: env.HOST, port: env.PORT });

    server = app.listen(env.PORT, env.HOST, () => {
      logger.info("http server listening", { port: env.PORT, host: env.HOST });
    });
  } catch (err) {
    logger.error("startup failed", { errorMessage: err.message });
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("shutdown initiated", { signal });

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    logger.info("http server closed");
  }
  await sequelize.close();
  logger.info("database connection closed");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
