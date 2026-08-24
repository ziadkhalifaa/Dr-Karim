// Audits frontend API calls against server route definitions.
// Usage: node scripts/audit-endpoints.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const clientFiles = walk(join(root, "src"));
const serverRouteFiles = walk(join(root, "server", "src")).filter((f) => f.includes("routes"));

const callRe = /api\.(get|post|patch|put|delete)\(\s*`([^`]+)`/g;
const calls = new Set();
for (const f of clientFiles) {
  const text = readFileSync(f, "utf8");
  let m;
  while ((m = callRe.exec(text))) {
    const raw = m[2];
    const norm = raw
      .split("?")[0]
      .split("/")
      .map((seg) => (seg.includes("${") || seg.startsWith(":") ? ":p" : seg))
      .filter((seg) => seg && seg !== ":p" || seg === ":p")
      .join("/");
    calls.add(`${m[1].toUpperCase()} /${norm.replace(/^\/+/, "")}`);
  }
}

// Mount prefixes from server/src/routes/index.js — a frontend call is OK if it
// matches (prefix + routePath) for any known prefix.
const MOUNTS = [
  "", "/content", "/public", "/monetization/packages", "/services", "/health",
  "/auth", "/assessment", "/doctor/reviews", "/nutrition-plans", "/exercise-plans",
  "/nutrition-plan-versions", "/exercise-plan-versions", "/patients", "/food",
];

const routeRe = /\b[a-zA-Z_$][\w$]*\.(get|post|patch|put|delete)\(\s*["'`](\/[^"'`]*)["'`]/g;
const routes = new Set();
for (const f of serverRouteFiles) {
  const text = readFileSync(f, "utf8");
  let m;
  while ((m = routeRe.exec(text))) {
    const norm = m[2]
      .split("?")[0]
      .split("/")
      .map((seg) => (seg.startsWith(":") ? ":p" : seg))
      .join("/");
    const p = norm.startsWith("/") ? norm : "/" + norm;
    for (const prefix of MOUNTS) routes.add(`${m[1].toUpperCase()} ${(prefix + p).replace(/\/$/, "")}`);
  }
}

console.log(`FRONTEND CALLS: ${calls.size}, BACKEND ROUTES: ${routes.size}\n`);

function match(callPath, routePath) {
  const a = callPath.split("/").filter(Boolean);
  const b = routePath.split("/").filter(Boolean);
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (b[i] === ":p" || a[i] === ":p") continue;
    return false;
  }
  return true;
}

const routeList = [...routes];
const missing = [];
for (const c of [...calls].sort()) {
  const [method, path] = c.split(" ");
  if (![...routeList].some((r) => r.startsWith(method + " ") && match(path, r.split(" ")[1]))) missing.push(c);
}
if (missing.length) {
  console.log("MISSING ON SERVER (frontend calls with no matching route):");
  for (const x of missing) console.log("  ✗", x);
} else {
  console.log("All frontend API calls have matching backend routes ✓");
}
