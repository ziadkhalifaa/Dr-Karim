import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { security } from "./middleware/security.js";
import { requestId } from "./middleware/request-id.js";
import { requestLogger } from "./middleware/request-logger.js";
import { routes } from "./routes/index.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import env from "./config/env.js";
import { uploadsRoot } from "./config/uploads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dist/ is built at project root → two levels up from server/src/
const DIST_PATH = path.resolve(__dirname, "../../dist");

export function createApp() {
  const app = express();
  security(app);
  app.use(requestId);
  app.use(requestLogger);

  // Tenant resolution is applied to /api/v1/* inside routes (health first, then tenant)
  routes(app);

  // Serve uploaded files (article covers, etc.) from the persistent uploads dir
  app.use("/uploads", express.static(uploadsRoot, { maxAge: "7d" }));


  if (env.IS_PRODUCTION) {
    // Serve hashed static assets with long-lived cache
    app.use(
      express.static(DIST_PATH, {
        maxAge: "1y",
        etag: true,
        index: false, // SPA catch-all handles the root
      })
    );
    // SPA catch-all: any non-API GET returns index.html so client-side routing works
    app.get(/^(?!\/api\/).*/u, (_req, res) => {
      res.sendFile(path.join(DIST_PATH, "index.html"));
    });
  }

  // API 404 handler — only reached if no route matched an /api/* path
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp;