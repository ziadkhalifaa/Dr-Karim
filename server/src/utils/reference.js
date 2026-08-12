import crypto from "node:crypto";

// Server-side reference number generation (spec §17): DK-YYYY-XXXXXX
// 6 chars from an unambiguous alphabet (no I/L/O/0). Generated with crypto.
// Never trust client-supplied reference numbers.
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const recentReferences = new Set();

export function generateReferenceNumber(now = new Date()) {
  const year = now.getFullYear();
  let tail;
  do {
    tail = "";
    for (let i = 0; i < 6; i += 1) tail += REF_ALPHABET[crypto.randomInt(0, REF_ALPHABET.length)];
  } while (recentReferences.has(`${year}-${tail}`));
  recentReferences.add(`${year}-${tail}`);
  if (recentReferences.size > 10000) recentReferences.delete(recentReferences.values().next().value);
  return `DK-${year}-${tail}`;
}
export function isReferenceNumber(value) {
  return typeof value === "string" && /^DK-[0-9]{4}-[A-HJKMNP-Z2-9]{6}$/u.test(value);
}



