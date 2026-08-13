import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveEffective, measurementsOfType, startingValue, currentValue,
  measurementDelta, ratePerDay, addDays, diffDays,
  cadenceDays, nextDueDate, isMeasurementDue,
  goalProgressPercent, projectedReachDate, windowAverageSeries,
} from "../../src/services/progress-analytics.js";

function m(id, type, value, measuredOn, recordedAt, correctionOf = null) {
  return { id, measurement_type: type, value, measured_on: measuredOn, recorded_at: recordedAt, correction_of_id: correctionOf === null ? null : correctionOf };
}

test("resolveEffective keeps un-corrected rows and drops superseded originals", () => {
  const rows = [
    m(1, "weight", 80, "2026-01-01", "2026-01-01T08:00:00Z"),
    m(2, "weight", 79, "2026-01-08", "2026-01-08T08:00:00Z"),
  ];
  const eff = resolveEffective(rows).map((r) => Number(r.id));
  assert.deepEqual(eff, [1, 2]);
});

test("resolveEffective resolves a multi-level correction chain to the tip", () => {
  const rows = [
    m(1, "weight", 80, "2026-01-01", "2026-01-01T08:00:00Z"),
    m(2, "weight", 79.5, "2026-01-01", "2026-01-01T09:00:00Z", 1),
    m(3, "weight", 79, "2026-01-01", "2026-01-01T10:00:00Z", 2),
  ];
  const eff = resolveEffective(rows);
  assert.deepEqual(eff.map((r) => Number(r.id)), [3]);
  assert.equal(eff[0].value, 79);
});

test("measurementsOfType filters type and keeps the chain tip", () => {
  const rows = [
    m(1, "weight", 80, "2026-01-01", "2026-01-01T08:00:00Z"),
    m(2, "waist", 100, "2026-01-01", "2026-01-01T08:00:00Z"),
    m(3, "waist", 99, "2026-01-01", "2026-01-01T09:00:00Z", 2),
  ];
  const waist = measurementsOfType(rows, "waist");
  assert.equal(waist.length, 1);
  assert.equal(waist[0].value, 99);
});

test("startingValue is the first effective measured value", () => {
  const rows = [m(1, "weight", 80, "2026-01-01", "2026-01-01T08:00:00Z"), m(2, "weight", 78, "2026-02-01", "2026-02-01T08:00:00Z")];
  assert.deepEqual(startingValue(rows, "weight"), { value: 80, measuredOn: "2026-01-01" });
  assert.equal(startingValue(rows, "waist"), null);
});

test("currentValue is the latest effective value, optionally at-or-before asOf", () => {
  const rows = [
    m(1, "weight", 80, "2026-01-01", "2026-01-01T08:00:00Z"),
    m(2, "weight", 78, "2026-02-01", "2026-02-01T08:00:00Z"),
    m(3, "weight", 77, "2026-03-01", "2026-03-01T08:00:00Z"),
  ];
  assert.deepEqual(currentValue(rows, "weight"), { value: 77, measuredOn: "2026-03-01" });
  assert.deepEqual(currentValue(rows, "weight", "2026-02-01"), { value: 78, measuredOn: "2026-02-01" });
  assert.equal(currentValue(rows, "weight", "2025-01-01"), null);
});

test("measurementDelta is null without both values and rounds to 2dp", () => {
  assert.equal(measurementDelta(80, 77), -3);
  assert.equal(measurementDelta(null, 80), null);
  assert.equal(measurementDelta(80.5, 77.25), -3.25);
});

test("ratePerDay returns per-day change (negative = loss) and null when no days", () => {
  assert.equal(ratePerDay("2026-01-01", 80, "2026-01-11", 79), -0.1);
  assert.equal(ratePerDay("2026-01-01", 80, "2026-01-01", 80), null);
});

test("addDays crosses month boundaries; diffDays measures span", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-02-28", 2), "2026-03-02");
  assert.equal(diffDays("2026-01-01", "2026-01-11"), 10);
});

test("cadenceDays defaults weekly (7) and honours explicit custom days", () => {
  assert.equal(cadenceDays("weekly"), 7);
  assert.equal(cadenceDays("every_3_days"), 3);
  assert.equal(cadenceDays("monthly"), 30);
  assert.equal(cadenceDays("unknown"), 7);
  assert.equal(cadenceDays("custom", 12), 12);
  assert.equal(cadenceDays("custom"), 7);
});

test("nextDueDate builds from last measured date + cadence", () => {
  assert.equal(nextDueDate("2026-01-08", "weekly"), "2026-01-15");
  assert.equal(nextDueDate(null, "weekly"), null);
});

test("isMeasurementDue compares next due against today (with grace)", () => {
  assert.equal(isMeasurementDue("2026-01-08", "weekly", "2026-01-15"), true);
  assert.equal(isMeasurementDue("2026-01-08", "weekly", "2026-01-14"), false);
  assert.equal(isMeasurementDue("2026-01-08", "weekly", "2026-01-16", null, 2), true);
});

test("goalProgressPercent: loss positive, moving-away negative, maintain null", () => {
  assert.equal(goalProgressPercent(80, 77, 70), 30);
  assert.equal(goalProgressPercent(60, 62, 65), 40);
  assert.equal(goalProgressPercent(80, 83, 70), -30);
  assert.equal(goalProgressPercent(80, 77, 80), null);
});

test("projectedReachDate projects when moving toward target else null", () => {
  assert.equal(projectedReachDate(80, 76, 70, -0.2, "2026-01-20"), "2026-02-19");
  assert.equal(projectedReachDate(60, 62, 65, 0.1, "2026-01-20"), "2026-02-19");
  assert.equal(projectedReachDate(80, 77, 70, 0.1, "2026-01-20"), null);
  assert.equal(projectedReachDate(80, 77, 70, 0, "2026-01-20"), null);
});

test("windowAverageSeries buckets per window, descending backwards from anchor", () => {
  const rows = [
    m(1, "weight", 80, "2026-01-07", "2026-01-07T08:00:00Z"),
    m(2, "weight", 79, "2026-01-14", "2026-01-14T08:00:00Z"),
    m(3, "weight", 78, "2026-02-01", "2026-02-01T08:00:00Z"),
  ];
  const out = windowAverageSeries(rows, "weight", "2026-02-01", 7, 4);
  assert.equal(out.available, true);
  assert.ok(out.buckets.length >= 1);
  const lastBucket = out.buckets[out.buckets.length - 1];
  assert.equal(lastBucket.periodEnd, "2026-02-01");
  assert.equal(lastBucket.avg, 78);
  assert.equal(windowAverageSeries([], "weight").available, false);
});