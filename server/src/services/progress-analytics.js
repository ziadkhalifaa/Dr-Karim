// Derived progress/measurement analytics engine (docs/progress-analytics.md).
//
// All metrics are DERIVED from the immutable progress_measurement timeline
// (Phase 6C GROUP_19). No stored "current_weight" column is ever canonical —
// current/starting values are extracted from the append-only history (§5, §30).
//
// Correction model: appending a row with correction_of_id = <originalId>
// supersedes the original; the original row is PRESERVED. resolveEffective()
// returns only the tip of each chain (the currently-true value).

import { PROGRESS_CADENCE_PRESETS } from "../config/constants.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function diffDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / DAY_MS);
}

export function addDays(date, days) {
  const [y, m, d] = String(date).slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// Filters a measurement timeline to the tip of each correction chain in
// ascending measured_on order (ties broken by recorded_at).
export function resolveEffective(measurements) {
  const superseded = new Set();
  for (const m of measurements || []) {
    if (m.correction_of_id != null) superseded.add(Number(m.correction_of_id));
  }
  return (measurements || [])
    .filter((m) => !superseded.has(Number(m.id)))
    .sort((a, b) => {
      if (a.measured_on !== b.measured_on) return a.measured_on < b.measured_on ? -1 : 1;
      return new Date(a.recorded_at) - new Date(b.recorded_at);
    });
}

export function measurementsOfType(measurements, type) {
  return resolveEffective(measurements).filter((m) => m.measurement_type === type);
}

// Starting value: the FIRST effective measured measurement of the type (§26:
// starting weight is stable per progress context, derived from measurements).
export function startingValue(measurements, type) {
  const series = measurementsOfType(measurements, type);
  return series.length ? { value: Number(series[0].value), measuredOn: series[0].measured_on } : null;
}

// Current value: the LAST effective measurement at or before asOf (default now;
// "current weight" is derived, never stored — §5/§30).
export function currentValue(measurements, type, asOf = null) {
  const series = measurementsOfType(measurements, type);
  if (!series.length) return null;
  const filtered = asOf ? series.filter((m) => m.measured_on <= asOf) : series;
  if (!filtered.length) return null;
  const last = filtered[filtered.length - 1];
  return { value: Number(last.value), measuredOn: last.measured_on };
}

// numeric delta between derived start/current.
export function measurementDelta(startVal, currentVal) {
  if (startVal == null || currentVal == null) return null;
  return Math.round((currentVal - startVal) * 100) / 100;
}

// average change rate per DAY between two datapoints (negative = loss).
export function ratePerDay(measuredOnA, valueA, measuredOnB, valueB) {
  const days = diffDays(measuredOnA, measuredOnB);
  if (days <= 0) return null;
  return Math.round(((valueB - valueA) / days) * 1000) / 1000;
}

// Fractional cadence presets (§10/§11) — server-authoritative, default weekly.
export function cadenceDays(cadence, customDays = null) {
  if (typeof customDays === "number" && customDays > 0) return Math.round(customDays);
  const preset = PROGRESS_CADENCE_PRESETS[cadence];
  if (preset !== undefined && preset !== null) return preset;
  return 7;
}

export function nextDueDate(lastMeasuredOn, cadence, customDays = null) {
  if (!lastMeasuredOn) return null;
  return addDays(lastMeasuredOn, cadenceDays(cadence, customDays));
}

export function isMeasurementDue(lastMeasuredOn, cadence, today, customDays = null, graceDays = 0) {
  const due = nextDueDate(lastMeasuredOn, cadence, customDays);
  if (!due) return false;
  return due <= today || diffDays(today, due) <= graceDays;
}

// ---- Numeric goal progress (docs/progress-goals.md §7) ----
// For a weight-loss goal: progress = (start-current)/(start-target). Negative
// means moving away from target; >100 means target already reached/passed.
export function goalProgressPercent(startVal, currentVal, targetValue) {
  if (startVal == null || currentVal == null || targetValue == null) return null;
  if (startVal === Number(targetValue)) return null; // maintain-goal: no metric
  return Math.round(((startVal - currentVal) / (startVal - Number(targetValue))) * 1000) / 10;
}

// Projected reach date given a stable per-day rate; null when the rate is 0 or
// moving away from the target (cannot project — no resampling of reality).
export function projectedReachDate(startVal, currentVal, targetValue, rate, today) {
  if (startVal == null || currentVal == null || targetValue == null || rate == null) return null;
  const target = Number(targetValue);
  const reducing = target < startVal;
  const movingToward = reducing ? currentVal < startVal : currentVal > startVal;
  if (!movingToward) return null;
  const remaining = Math.abs(currentVal - target);
  if (remaining <= 0) return today;
  if (rate === 0 || Math.sign(rate) !== (reducing ? -1 : 1)) return null;
  return addDays(today, Math.ceil(remaining / Math.abs(rate)));
}

// ---- Trend: average per cadence-window over the last N windows (§32) ----
export function windowAverageSeries(measurements, type, today = null, windowDays = 7, weeks = 4) {
  const series = measurementsOfType(measurements, type);
  if (!series.length) return { available: false };
  const anchor = today || series[series.length - 1].measured_on;
  const buckets = [];
  for (let w = 1; w <= weeks; w += 1) {
    const end = addDays(anchor, -((w - 1) * windowDays));
    const start = addDays(end, -(windowDays - 1));
    const slice = series.filter((m) => m.measured_on >= start && m.measured_on <= end);
    if (slice.length) {
      buckets.push({
        periodEnd: end,
        avg: Math.round((slice.reduce((a, b) => a + Number(b.value), 0) / slice.length) * 100) / 100,
        count: slice.length,
      });
    }
  }
  return { available: buckets.length > 0, buckets: buckets.reverse() };
}

export const PROGRESS_ANALYTICS_VERSION = 1;