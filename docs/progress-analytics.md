# Progress Analytics — Derived Metrics Engine (Phase 6C)

Status: **Implementation complete** — 17 pure-function unit tests in
`server/test/unit/progress-analytics.test.js` (all pass, no DB needed).

## 1. Principle
Everything is **derived, never stored**. No `current_weight` or
`adherence_percentage` columns exist as canonical sources. The engine is pure
(`progress-analytics.js` — no DB access), so it is unit-testable and identical
for patient and doctor views.

## 2. Correction-chain resolution
`resolveEffective(measurements)` drops every row that is superseded by a
correction (`correction_of_id`), returning the **tip** of each append-only chain
sorted by `measured_on` (ties by `recorded_at`). The original row still exists
in the DB — it is simply not "effective".

## 3. Cleaning & filtering
- `measurementsOfType(rows, type)` — effective rows of one type.
- `startingValue(rows, type)` — first effective value = **stable starting
  weight** per progress context.
- `currentValue(rows, type, asOf?)` — last effective value at-or-before a date
  (defaults to latest) = **current weight**.

## 4. Deltas & rates
- `measurementDelta(start, current)` — rounded to 2dp.
- `ratePerDay(onA, valA, onB, valB)` — per-day change (negative = loss); null
  when dates don't advance.
- Date math helpers `addDays`, `diffDays` are UTC-calendar–based (DST-safe).

## 5. Cadence (server-authoritative)
`cadenceDays(cadence, customDays)` resolves the preset table
(`every_3_days=3, weekly=7, biweekly=14, monthly=30, custom=explicit`),
defaulting to 7. `nextDueDate`, `isMeasurementDue(with grace)` derive due-state
from the latest measured date + cadence.

## 6. Goal math
- `goalProgressPercent(start, current, target)` — signed percentage (above).
- `projectedReachDate(...)` — date estimate only when derived rate moves toward
  the target; otherwise `null`.

## 7. Trend
`windowAverageSeries(measurements, type, today, windowDays, weeks)` buckets the
effective timeline into windows (7-day default) going backwards, returning
`{ available, buckets: [{ periodEnd, avg, count }] }`. Output is only presented
when there is data ("Not enough data" otherwise) — matching the Phase 6B
adherence rule that never shows a percentage from insufficient data.