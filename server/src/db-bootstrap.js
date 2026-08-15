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

import { logger } from "./utils/logger.js";
import { runMigration } from "../../scripts/migrate.js";
import { runSeed } from "../../scripts/seed.js";

export async function ensureDatabaseSync() {
  try {
    logger.info("db sync starting", { step: "scripts/migrate.js" });
    await runMigration(false);
    logger.info("db sync done", { step: "scripts/migrate.js" });

    logger.info("db sync starting", { step: "scripts/seed.js" });
    await runSeed();
    logger.info("db sync done", { step: "scripts/seed.js" });
  } catch (err) {
    logger.error("db sync failed", { errorMessage: err.message, stack: err.stack });
    throw err;
  }
}