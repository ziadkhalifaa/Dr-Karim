# Progress Goals — Doctor-Managed Numeric Targets (Phase 6C)

Status: **Implementation complete** — see `phase6c-implementation.md`.

## 1. Responsibility
The **doctor is the decision maker** for all numeric goals. The system never
interprets, recommends, or auto-creates/alerts plan changes from measurements —
it only computes **derived** progress numbers (§7 of the phase spec).

## 2. Model
- `patient_progress_goal`: `goal_type` (locked to `weight`), `unit` (kg),
  `status`, `start_date`, `target_date`, `approved_by/at`, `closed_at`.
- `patient_progress_goal_version`: per-goal history of target values,
  `version_no`, `status` (`draft`/`active`/`superseded`),
  `previous_version_id`, activation provenance.

## 3. Goal status lifecycle
`draft → active → closed | cancelled`

Rules:
- A draft goal never displays progress-facing numbers.
- `cancel` on a draft closes it as `cancelled`.
- Active goals may be `closed` (reached/stopped) or `cancelled` by the doctor.
- Closed/cancelled goals cannot be versioned or reactivated.

## 4. Version lifecycle
A goal starts with version 1 (draft). New target values are never edited in
place — the doctor appends a new **draft** version. Activating a version:
1. marks the goal `active` + `approved_by/at`,
2. supersedes any previously `active` version,
3. marks the newly activated version `active`.

The dashboard / derived math always uses the latest **active** version.

## 5. API (extends `/progress/goals`; paths and access in
`progress-measurements.md` §11)

## 6. Derived progress
`goalProgressPercent(start, current, target)`:
- loss goal `(start − current) / (start − target) × 100`
- gain goal uses the same signed formula; moving away yields negatives; past
  target yields > 100; maintain-goals (target == start) yield `null`.

`projectedReachDate(start, current, target, ratePerDay, today)` returns the
estimated date only when the current **derived** rate is moving toward the
target (rate 0 / away ⇒ null — projections never invent reality).

## 7. Consistency constraints
- Goals reference only the derived timeline (progress-analytics), never the
  `patient_goal_history` review rows.
- Units always kg for the current `weight` goal type.
- Only `goal_type: "weight"` is allowed today; new types require an enum + spec
  change (no invented categories).