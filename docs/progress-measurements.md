# Progress & Measurements — Data Model & Workflow (Phase 6C)

Status: **Implementation complete** — see `phase6c-implementation.md` for verification.

## 1. Domain scope
The Progress domain owns the patient's **numeric, time-series health history**
(weight, waist, neck, hip) and the **doctor-managed numeric goals** tied to it.
It is deliberately a **separate domain** from Daily Care activity execution
(Phase 6B) and from the review-confirmed profile snapshot
(`patient_measurement` in GROUP_05 / `05_review_profile.js`).

## 2. Approved measurement types (locked)
| Type   | Unit | Range (server-authoritative §28) |
|--------|------|----------------------------------|
| weight | kg   | 20 – 400                        |
| waist  | cm   | 20 – 300                        |
| neck   | cm   | 20 – 300                        |
| hip    | cm   | 20 – 300                        |

No lb/in toggle is provided anywhere (§25 unit consistency).

## 3. Tables (GROUP_19, migration `026_progress.js`)
- **patient_progress** — per-patient progress context: `cadence`
  (default `weekly`), optional `cadence_days` for the `custom` preset, and a
  rebuildable `next_due_date`. Unique per `(tenant_id, patient_id)`.
- **progress_measurement** — the **canonical, append-only** history timeline.
  Stored once, never updated (`updatedAt` disabled). Provenance context can
  reference `care_program_id`, `checkin_id` (weekly patient_checkin) or
  `appointment_id` without merging domains.
- **patient_progress_goal** — doctor-managed numeric target
  (`goal_type` locked to `weight` for now), with status lifecycle.
- **patient_progress_goal_version** — versioned target values per goal; the
  latest **active** version is the current contract.

## 4. Existing models left untouched
`PatientMeasurement` and `PatientGoalHistory` (GROUP_05) remain the
review-confirmed profile rows; Phase 6C never writes to them.

## 5. Derivation rule (current / starting values)
`current weight` and `starting weight` are **always derived** from the
immutable timeline — never stored as a manually editable canonical column.
The derivation functions live in `progress-analytics.js` (see
`progress-analytics.md` §4-§6).

## 6. Measurement sources
`patient`, `doctor`, `checkin`, `assessment`, `system`, `appointment`.
A patient may self-tag a measurement as `patient`, `checkin`, `assessment` or
`system`; only a doctor may use `appointment`.

## 7. Check-in hook (§23 / §30)
When a **weekly patient check-in** (`patient_checkin`) is created with
`weight_kg`, `checkinService.create` appends an immutable
`progress_measurement` row with `source=checkin`, linked by `checkin_id`.
A unique index `(patient_id, source, checkin_id, measurement_type)` guarantees a
check-in yields at most one canonical weight measurement (idempotent resubmit).

## 8. Immutability & corrections (§30)
- A placement is an INSERT; a correction is **another INSERT** with
  `kind=correction` and `correction_of_id = <original id>`. The original row is
  preserved.
- Corrections require a `reason`. Check-in sourced measurements are corrected by
  updating the check-in, not by a direct correction row.
- The effective/current value is the **tip** of each correction chain
  (`resolveEffective`).

## 9. Cadence scheduling (§10 / §11)
Cadence presets are server-authoritative (`PROGRESS_CADENCE_PRESETS`):
`every_3_days` (3), `weekly` (7, default), `biweekly` (14), `monthly` (30),
`custom` (explicit `cadence_days`, 1–365). Only a doctor may configure cadence.
`next_due_date` is recomputed from the latest effective measured date + cadence.

## 10. Roles & permissions
- **Patient**: records/corrects their own measurements, reads own dashboard.
- **Doctor**: records on a patient's behalf (any valid source), configures
  cadence, manages goals (create / activate / version / close).
- Cross-tenant and cross-patient access raises 403; read endpoints re-verify the
  tenant+ownership.

## 11. API surface (base `/api/v1`) — see routes `progress.routes.js`
| Method | Path                              | Access                    |
|--------|-----------------------------------|---------------------------|
| GET    | `/progress/dashboard`             | patient / doctor (+patientId) |
| GET    | `/progress/measurements`          | patient / doctor          |
| POST   | `/progress/measurements`          | patient / doctor          |
| GET    | `/progress/measurements/:type/summary` | patient / doctor     |
| POST   | `/progress/measurements/:id/correct`   | patient / doctor     |
| GET/PUT| `/progress/context`               | GET both, PUT doctor      |
| GET    | `/progress/goals`                 | doctor                    |
| GET    | `/progress/goals/:id`             | doctor                    |
| POST   | `/progress/goals`                 | doctor                    |
| POST   | `/progress/goals/:id/versions`    | doctor                    |
| POST   | `/progress/goals/:id/activate`    | doctor                    |
| POST   | `/progress/goals/:id/close`       | doctor                    |

## 12. Audit & notifications
Every placement/correction/goal transition records an audit entry
(`progress_measurement.created/corrected`, `progress_goal.*`); notifications
(`progress_measurement_recorded`) are emitted to the patient (see
`notification.service.js`), consistent with the rest of the platform.