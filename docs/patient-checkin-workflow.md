# Patient Check-in Workflow

Phase 3D adds a lightweight recurring progress record. A check-in is not a full assessment and does not diagnose, route, prescribe, or apply clinical thresholds.

## Data and context

`patient_checkin` stores the patient, date, optional weight, adherence values, patient note, status, review metadata, and references to the active nutrition/exercise plan versions at submission time. Measurements and adherence dimensions are stored in their own append-only child tables. Previous check-ins are never overwritten.

The captured context references active plan versions and their source assessment session; it does not copy full plans into the check-in.

## APIs

- `POST /api/v1/patients/:id/checkins`
- `GET /api/v1/patients/:id/checkins`
- `GET /api/v1/patients/:id/checkins/:checkinId`
- `POST /api/v1/checkins/:id/review`

Patients can create and read only their own check-ins. Doctors can read authorized tenant patients and add a review note/status. Staff can read according to the existing read-only policy. Numeric values receive sanity validation only; no medical thresholds are invented.

Default check-in cadence is seven days when a follow-up suggestion is needed. A patient’s `followup_cadence_days` can override that value, but no recurring appointments are automatically created.
