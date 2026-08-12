// Centralized, deterministic Egyptian phone normalization (architecture §6.1).
//
// Storage contract (every phone column):
//   - phone_canonical: `+20` + national significant number, digits only.
//   - phone_display:    the verbatim string the patient typed (source of truth
//                       for display / re-contact).
//
// Rules (policy, not a legal claim):
//   - Local Egyptian `01x…` (11 digits, starts `01`) -> `+20` + remaining 10.
//   - International `+20…` (12 digits, starts `+20`) -> kept as-is.
//   - Any other input is rejected -> caller surfaces a validation error; the
//     value is NEVER silently rewritten.
//
// This phase ships the canonical helper only (write-time call sites belong to
// the future API phase). Phone is intentionally NOT globally unique (§6).

const LOCAL_PATTERN = /^01[0125][0-9]{8}$/; // 11 digits, e.g. 01012345678
const INTL_20_PATTERN = /^\+20[0-9]{10}$/; // 12 digits, e.g. +201012345678

/**
 * Normalize a user-supplied Egyptian phone into its canonical form.
 * @param {string|number} input
 * @returns {string} canonical `+20…` form
 * @throws {Error} when the input is not a parseable Egyptian number
 */
export function canonicalizeEgyptianPhone(input) {
  if (input === null || input === undefined || input === "") {
    throw new Error("phone_required");
  }
  const raw = String(input).trim();
  // Keep only digits and a leading "+"; whitespace/punct handled below.
  if (/[^\d+]/u.test(raw)) {
    throw new Error("phone_invalid_chars");
  }
  if (raw.startsWith("+")) {
    if (INTL_20_PATTERN.test(raw)) return raw;
    throw new Error("phone_not_egyptian");
  }
  if (LOCAL_PATTERN.test(raw)) {
    return `+20${raw.slice(1)}`; // 01x… -> +20 1x…
  }
  throw new Error("phone_not_egyptian");
}

/**
 * Deterministic display normalization used only for a canonical/display pair.
 * Preserves what the user typed — this function is a no-op passthrough so the
 * display column always holds the original verbatim value (policy §6.1).
 */
export function preserveDisplay(input) {
  return input === null || input === undefined ? null : String(input).trim();
}

export const PHONE = { canonicalizeEgyptianPhone, preserveDisplay };
export default PHONE;