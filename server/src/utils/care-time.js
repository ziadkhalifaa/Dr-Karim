// Server-authoritative care time helpers (docs/daily-care-workflow.md §26).
//
// "Today" and every care-day boundary are computed in the tenant/clinic
// timezone on the SERVER — never from the browser clock. Care days are stored
// as DATEONLY (YYYY-MM-DD); the canonical timezone is tenant.timezone (default
// Africa/Cairo).

const DEFAULT_TZ = "Africa/Cairo";

export function tenantTimezone(tenant) {
  return tenant?.timezone || DEFAULT_TZ;
}

// Local date string (YYYY-MM-DD) for "now" in the given IANA timezone.
export function todayInTimeZone(timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = {};
  for (const part of parts) map[part.type] = part.value;
  return `${map.year}-${map.month}-${map.day}`;
}

// Add whole days to a YYYY-MM-DD (UTC arithmetic avoids DST drift).
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Inclusive list of YYYY-MM-DD from start to end (both inclusive).
export function dateRange(startDate, endDate) {
  const out = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

// Lexicographic comparison is safe for zero-padded YYYY-MM-DD.
export function isOnOrBefore(a, b) { return a <= b; }
export function isOnOrAfter(a, b) { return a >= b; }
