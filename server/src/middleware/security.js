import helmet from "helmet";
import cors from "cors";
import express from "express";
import env from "../config/env.js";
import { AppError, ERROR_CODES } from "../utils/errors.js";

// Security middleware assembly (architecture §15):
//   - helmet for protective HTTP headers
//   - restrictive CORS to known frontend origins
//   - JSON body parser with a size limit (256kb default)
//   - trust proxy for correct req.ip when behind Hostinger reverse proxy
//   - Cache-Control: no-store on /api/* responses (PHI-bearing API)

function originFn(origin, callback) {
  if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
  return callback(new AppError(403, ERROR_CODES.CORS_ORIGIN_NOT_ALLOWED, "Origin not allowed"));
}

export function security(app) {
  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: originFn,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-Slug", "X-Request-Id"],
      credentials: false,
      maxAge: 600,
    })
  );

  // The payment-receipt upload carries a base64 data URL far larger than the
  // default JSON limit; that route applies its own dedicated limit.
  const RECEIPT_UPLOAD = /^\/api\/v1\/payments\/[^/]+\/receipt\/?$/u;
  app.use((req, res, next) => {
    if (req.method === "POST" && RECEIPT_UPLOAD.test(req.path)) return next();
    return express.json({ limit: env.JSON_BODY_LIMIT })(req, res, next);
  });

  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
}
