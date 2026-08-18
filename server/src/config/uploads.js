import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Project-local fallback (inside the repo, gitignored) used only when no
// persistent location is available.
const PROJECT_UPLOADS = path.resolve(__dirname, "../../uploads");

function ensure(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

// Uploaded files live OUTSIDE the deployed project directory so they survive
// redeploys that wipe untracked files. Resolution order:
//   1. UPLOADS_DIR env override (Hostinger: set a custom absolute path)
//   2. ~/.dr-kareem/uploads (home dir persists across deploys)
//   3. project-local server/uploads (fallback)
function pickUploadsRoot() {
  const candidates = [];
  const envDir = process.env.UPLOADS_DIR;
  if (envDir && envDir.trim()) candidates.push(path.resolve(envDir.trim()));
  try {
    const home = os.homedir();
    if (home && home.trim()) candidates.push(path.join(home, ".dr-kareem", "uploads"));
  } catch {
    /* ignore */
  }
  candidates.push(PROJECT_UPLOADS);
  for (const dir of candidates) {
    if (ensure(dir)) return dir;
  }
  return PROJECT_UPLOADS;
}

export const uploadsRoot = pickUploadsRoot();
export const coversDir = path.join(uploadsRoot, "covers");
ensure(coversDir);
