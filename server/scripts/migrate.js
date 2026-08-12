// Forward-only migration runner (architecture §21).
//
// Behavior:
//   - Applies migrations in strict numbered (³ prefix, ascending) order.
//   - Tracks each applied migration in `schema_migrations` by name + sha256.
//   - REFUSES to re-run a migration whose checksum changed (forward-only; a
//     changed applied migration is a deployment error, fixed via a corrective
//     migration — never by editing history).
//   - Has NO destructive rollback. Corrections are new forward migrations.
//   - Structural migrations and seed data are separated (seeds never here).
//
// Usage: node scripts/migrate.js            (apply pending)
//        node scripts/migrate.js --status   (report, apply nothing)

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { sequelize } from "../src/config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../src/migrations");
const TABLE = "schema_migrations";

async function ensureMeta(queryInterface) {
  await queryInterface.createTable(TABLE, {
    name: { type: "VARCHAR(255)", allowNull: false, primaryKey: true },
    checksum: { type: "CHAR(64)", allowNull: false },
    applied_at: { type: "DATETIME", allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
  }, {});
}

async function appliedRows(queryInterface) {
  const rows = await queryInterface.sequelize.query(`SELECT name, checksum FROM ${TABLE}`, {
    type: queryInterface.sequelize.QueryTypes.SELECT,
  });
  return new Map(rows.map((r) => [r.name, r.checksum]));
}

function listMigrations() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.*\.js$/u.test(f))
    .map((f) => ({ name: f.replace(/\.js$/u, ""), file: path.join(MIGRATIONS_DIR, f) }))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

function checksum(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

async function run() {
  const statusOnly = process.argv.includes("--status");
  const queryInterface = sequelize.getQueryInterface();

  try {
    await sequelize.authenticate();
    await ensureMeta(queryInterface);
    const applied = await appliedRows(queryInterface);
    const migrations = listMigrations();

    if (statusOnly) {
      console.log("Migration status:");
      for (const m of migrations) {
        const state = applied.has(m.name) ? "APPLIED" : "pending";
        console.log(`  ${state.padEnd(8)} ${m.name}`);
      }
      return;
    }

    for (const m of migrations) {
      const prev = applied.get(m.name);
      const sum = checksum(m.file);
      if (prev) {
        if (prev !== sum) {
          throw new Error(
            `REFUSING to proceed: applied migration ${m.name} no longer matches its checksum. ` +
              "Forward-only. Create a corrective migration instead of editing the applied one."
          );
        }
        continue;
      }
      const { up } = await import(pathToFileURL(m.file).href);
      console.log(`>> ${m.name}`);
      await up(queryInterface, sequelize);
      await sequelize.query(`INSERT INTO ${TABLE} (name, checksum) VALUES (:name, :checksum)`, {
        replacements: { name: m.name, checksum: sum },
      });
    }
    console.log("All migrations applied.");
  } finally {
    await sequelize.close();
  }
}

run().catch((err) => {
  console.error("Migrate failed:", err.message);
  process.exit(1);
});
