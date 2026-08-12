// Reference number format (spec §17): DK-2026-XXXXXX
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/L/O/0

export function generateReferenceNumber(date = new Date()) {
  const year = date.getFullYear();
  let tail = "";
  for (let i = 0; i < 6; i += 1) {
    tail += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `DK-${year}-${tail}`;
}

export function nowIso() {
  return new Date().toISOString();
}