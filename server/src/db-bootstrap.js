// Additive DB sync at app startup (deploy-time automatic migrate + seed).
//
// Runs the SAME scripts exposed as `db:migrate` / `db:seed` in server/package.json
// (they manage their own connections and close them). Guarantees:
//   - Never deletes data: migrations are forward-only; the seed is additive
//     (creates/updates derived rows, never removes).
//   - Idempotent and cheap, so running on every deploy/restart is safe.
//   - Fails fast: if the schema or seed cannot converge, the app refuses to
//     start instead of serving against a stale catalog.
//
// Enabled via env DB_AUTO_SYNC (default: on in production).

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(__dirname, "..");
const SCRIPTS = ["scripts/migrate.js", "scripts/seed.js"];

export function ensureDatabaseSync() {
  for (const script of SCRIPTS) {
    logger.info("db sync starting", { step: script });
    execFileSync(process.execPath, [script], {
      cwd: SERVER_DIR,
      stdio: "inherit",
      env: process.env,
    });
    logger.info("db sync done", { step: script });
  }
}