import crypto from "node:crypto";

// sha256 hex of a string (used for assessment_snapshot.payload_hash, §2).
export function sha256Hex(input) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

// Deterministic JSON string for hashing (stable key order via sorted keys).
export function canonicalJsonString(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = sortKeys(value[k]);
    return out;
  }
  return value;
}
