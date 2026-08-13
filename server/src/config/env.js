import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const NODE_ENV = process.env.NODE_ENV || "development";

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const DEFAULT_DEV_ORIGINS = ["http://localhost:5173", "http://localhost:4173"];

export const env = {
  NODE_ENV,
  IS_PRODUCTION: NODE_ENV === "production",
  PORT: Number(process.env.PORT || 4000),
  HOST: process.env.HOST || "0.0.0.0",
  CORS_ORIGINS: CORS_ORIGINS.length ? CORS_ORIGINS : DEFAULT_DEV_ORIGINS,
  DEFAULT_TENANT_SLUG: process.env.DEFAULT_TENANT_SLUG || "dr-kareem",
  TRUST_PROXY: process.env.TRUST_PROXY === "true",
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || "256kb",
  API_VERSION: "v1",
  CONSENT_POLICY_VERSION: "1.0",
  AUTH_REQUIRED: process.env.AUTH_REQUIRED === undefined ? NODE_ENV === "production" : process.env.AUTH_REQUIRED === "true",
  AUTH_TOKEN_SECRET: process.env.AUTH_TOKEN_SECRET || (NODE_ENV === "production" ? null : "development-only-change-me"),
  ACCESS_TOKEN_TTL_SECONDS: Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900),
  REFRESH_TOKEN_TTL_SECONDS: Number(process.env.REFRESH_TOKEN_TTL_SECONDS || 2592000),
  AUTH_MAX_FAILED_LOGINS: Number(process.env.AUTH_MAX_FAILED_LOGINS || 5),
  AUTH_LOCKOUT_SECONDS: Number(process.env.AUTH_LOCKOUT_SECONDS || 900),
  PASSWORD_RESET_TTL_SECONDS: Number(process.env.PASSWORD_RESET_TTL_SECONDS || 900),
  AUTH_SETUP_TOKEN: process.env.AUTH_SETUP_TOKEN || null,
  DAILY_PROVIDER_MODE: process.env.DAILY_PROVIDER_MODE || (NODE_ENV === "production" ? "daily" : "mock"),
  DAILY_API_KEY: process.env.DAILY_API_KEY || null,
  DAILY_API_BASE_URL: process.env.DAILY_API_BASE_URL || "https://api.daily.co/v1",
  DAILY_ROOM_TTL_SECONDS: Number(process.env.DAILY_ROOM_TTL_SECONDS || 7200),
  DAILY_TOKEN_TTL_SECONDS: Number(process.env.DAILY_TOKEN_TTL_SECONDS || 3600),
};

export default env;
