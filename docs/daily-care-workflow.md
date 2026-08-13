# Daily Care Program Workflow (Phase 6B)

Phase 6B adds the **executable daily care program**: the doctor authors a dated
care program (with plan-version bindings and doctor-defined daily activities),
activates it, and the patient records day-by-day execution in the clinic's
timezone. Everything below the *plan* line is **recorded truth** — append-only
and immutable.

## 1. Scope

- Doctor-authored care program (dates, plan-version bindings, activity definitions).
- Lazy materialization of concrete care days and activity instances.
- Patient / doctor execution recording, **append-only** with correction chains.
- Daily patient check-in (feeling/energy/hunger/adherence/weight).
- Derived adherence, weekly summary and streak (never stored as an editable %).
- Patients see their **own** program; doctors/staff see tenant programs.

Out of scope: payment gateways, external notification providers, any automatic
clinical recommendation or diagnosis.

## 2. Entities

| Table | Purpose |
| --- | --- |
| `care_program` | The dated program for one patient, one doctor. Status: `draft, scheduled, active, completed, paused, cancelled, expired`. |
| `care_program_version` | A clinical change to the program. Status: `draft, active, superseded`. Carries the nutrition/exercise plan-version bindings and program instructions. |
| `care_day` | One calendar date inside the program, bound to the version active on that date (plan-version boundary). |
| `care_activity_definition` | Doctor-authored planned activity (type, bilingual name, measure, planned target) on a version. |
| `care_activity_instance` | The concrete instance of a definition materialized on a specific care day (an immutable snapshot). |
| `care_activity_execution` | **Immutable, append-only** patient-recorded truth per instance. |
| `care_daily_checkin` | Daily "how was my day" (separate from executions). |

`tenant.timezone` (default `Africa/Cairo`) is the canonical care timezone.

## 3. Program lifecycle

1. **Draft** — the doctor creates the program (dates + approved plan-version
   ids) and adds activity definitions to version 1.
2. **Activate** — the doctor explicitly activates the program (or a specific
   version). Activation supersedes the previous active version (cutting its
   `effective_to` to the day before the new `effective_from`), sets program
   status to `active`, and lazily materializes care days **up to today**.
3. The program runs; the patient records executions per day.
4. End states: `completed`, `cancelled`, `expired`. Frozen programs cannot
   receive new versions, and their days are no longer recordable.

Nothing is auto-selected from payment approval; the doctor is always the
decision maker.

## 4. Plan-version boundary (§20)

Each `care_day` stores the exact `care_program_version_id` that was effective on
that date. A future version (new `care_program_version` with a later
`effective_from`) **never rewrites** already-materialized days. `effective_from`
must be today or later, so history cannot be rewritten.

## 5. Execution model (§10, §11)

`care_activity_execution` rows are immutable (no `updated_at`; UPDATEs are
prohibited in practice). Recording a value is an **INSERT**:

- `kind=initial` — the first record for an instance.
- `kind=correction` with `correction_of_id` and a required `reason` — a
  correction inserts a **new** row referencing the original; the original is
  never mutated or deleted.

The **effective** state of an instance is the *tip* of its append-only chain
(the latest row that is not itself corrected). Analytics always resolve the tip
first (`tipExecutions` in `care-execution.service.js`).

### Status derivation (§8)

- `boolean` measure: recorded `done` → `completed`, else `skipped`.
- `sessions` / `quantity` / `duration`: `actual >= planned` → `completed`,
  `0 < actual < planned` → `partial`, no actual → `skipped`.
- No execution on a day in the past → `not_recorded`; future → `planned`.
- `not_recorded` is never counted as a failure (see analytics §31).

## 6. Idempotency (§28)

`record` accepts an optional `idempotencyKey`. If a row already exists for
`(activity_instance_id, idempotency_key)`, the request returns that row instead
of appending a duplicate. A unique index backs this on MySQL.

## 7. Timezone (§26)

"Today" and every care-day boundary are computed **server-side** in
`tenant.timezone` via `Intl` (`src/utils/care-time.js`). The browser clock never
determines a care date. Recording for a future day is rejected.

## 8. Permissions (§23, §24)

- **Doctor / staff**: read and author any tenant care program.
- **Doctor**: create programs, versions, definitions, activate; may also record
  executions on a patient's behalf (`source=doctor`).
- **Patient**: reads and records **only their own** program. A patient may
  correct only their own executions.

## 9. APIs

```
POST   /api/v1/care/programs                     doctor create
GET    /api/v1/care/programs                     doctor/staff list (?patientId, ?status)
GET    /api/v1/care/programs/:id                 program + versions + definitions
POST   /api/v1/care/programs/:id/versions        doctor add future version
POST   /api/v1/care/programs/:id/definitions     doctor add definitions (latest draft version)
POST   /api/v1/care/programs/:id/activate        doctor activate (?versionNo)
GET    /api/v1/care/programs/:id/summary         patient-own / doctor-staff period summary
GET    /api/v1/care/dashboard                    patient today + week + streak
GET    /api/v1/care/days/:dayId                  day detail with derived statuses
POST   /api/v1/care/days/:dayId/checkin          patient daily check-in
POST   /api/v1/care/instances/:instanceId/record patient/doctor record execution
POST   /api/v1/care/executions/:executionId/correct  patient/doctor correction
```

## 10. Frontend

- **Patient**: `Daily Care` page (activities for today, week adherence + streak,
  daily check-in). i18n keys under `dailyCare.*` (en/ar).
- **Doctor**: `Care programs` page (list, create, version definitions, activate).
  i18n keys under `doctorCare.*` (en/ar).

## 11. Implementation files

- `server/src/models/18_care_program.js` — 7 models + `GROUP_18`.
- `server/src/migrations/025_care_program.js` — tables + `tenant.timezone`.
- `server/src/config/constants.js` — care enums (`ENUM.CARE_*`).
- `server/src/utils/care-time.js` — timezone-safe date helpers.
- `server/src/services/care-program.service.js` — authoring + lazy materialization.
- `server/src/services/care-execution.service.js` — recording, corrections, check-in.
- `server/src/services/care-analytics.js` — derived statuses, summaries, streak.
- `server/src/services/care.service.js` — patient dashboard + period summaries.
- `server/src/controllers/care.controller.js`, `server/src/routes/care.routes.js`.
- `src/features/patient/DailyCare.jsx`, `src/features/doctor/CarePrograms.jsx`.
- Tests: `server/test/unit/care-time.test.js`, `server/test/unit/care-analytics.test.js`,
  `server/test/unit/care-execution.test.js` (tip-of-chain resolution), and the
  end-to-end `server/test/integration/care6b.integration.test.js` (A→I: author,
  definitions, activation materialization, idempotent recording, correction
  chain, derived adherence, history protection, cross-patient isolation).

## 12. Status: COMPLETE

Phase 6B is approved and marked complete. Its scope (data model, doctor
authoring, patient execution recording, derived analytics, patient/doctor UI,
documentation, and unit + integration tests) is implemented as specified above
and the architecture is final — no further changes are planned in this phase.

### Verification status

- **Unit tests: PASS.** `care-time.test.js`, `care-analytics.test.js`, and
  `care-execution.test.js` all pass locally (60 pass / 0 fail in the combined
  unit suite).
- **DB-dependent tests: SKIPPED (not verified here).** The end-to-end
  `care6b.integration.test.js` (A→I) and the other DB-backed integration suites
  were **skipped** in the current environment because a live DB was unavailable
  during this session.
- This is an environment verification limitation, not a reported test failure.
- The skipped DB tests are **not** counted as passing. They will exercise the
  real MySQL schema (migration `025_care_program`) and the service layer end to
  end when a live database is available (e.g., on deploy via the auto-sync
  bootstrap).
- The forward-only migration runner verifies checksums on every deploy, so the
  new tables are applied automatically and safely.
