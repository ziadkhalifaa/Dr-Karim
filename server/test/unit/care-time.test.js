import { test } from "node:test";
import assert from "node:assert/strict";
import { dateRange, addDays, todayInTimeZone, tenantTimezone, isOnOrBefore, isOnOrAfter } from "../../src/utils/care-time.js";

test("addDays crosses month boundaries without DST drift", () => {
  assert.equal(addDays("2026-08-31", 1), "2026-09-01");
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2025-12-31", 365), "2026-12-31");
  assert.equal(addDays("2025-12-31", 366), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("dateRange is inclusive of both ends", () => {
  assert.deepEqual(dateRange("2026-08-01", "2026-08-03"), ["2026-08-01", "2026-08-02", "2026-08-03"]);
  assert.deepEqual(dateRange("2026-08-01", "2026-08-01"), ["2026-08-01"]);
});

test("todayInTimeZone returns a YYYY-MM-DD string in the given IANA zone", () => {
  const tz = "Africa/Cairo";
  const today = todayInTimeZone(tz);
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/u);
  const utc = todayInTimeZone("UTC");
  assert.match(utc, /^\d{4}-\d{2}-\d{2}$/u);
});

test("tenantTimezone falls back to Africa/Cairo", () => {
  assert.equal(tenantTimezone({ timezone: "Europe/Berlin" }), "Europe/Berlin");
  assert.equal(tenantTimezone(null), "Africa/Cairo");
  assert.equal(tenantTimezone({}), "Africa/Cairo");
});

test("lexicographic date comparisons", () => {
  assert.equal(isOnOrBefore("2026-08-01", "2026-08-10"), true);
  assert.equal(isOnOrBefore("2026-08-10", "2026-08-01"), false);
  assert.equal(isOnOrAfter("2026-08-10", "2026-08-01"), true);
  assert.equal(isOnOrAfter("2026-08-01", "2026-08-10"), false);
});