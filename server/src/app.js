import express from "express";
import { security } from "./middleware/security.js";
import { requestId } from "./middleware/request-id.js";
import { requestLogger } from "./middleware/request-logger.js";
import { routes } from "./routes/index.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();
  security(app);
  app.use(requestId);
  app.use(requestLogger);
  // Tenant resolution is applied to /api/v1/* inside routes (health first, then tenant)
  routes(app);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp;