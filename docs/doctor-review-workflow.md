# Doctor Review Workflow

Phase 3B implements only the backend path:

`Assessment → Doctor Review → Profile Confirmation`

It does not create nutrition or exercise plans, appointments, video, dashboards, notifications, payments, AI, diagnosis, or treatment.

## States and transitions

| State | Allowed next state |
|---|---|
| `queued` | `assigned` |
| `assigned` | `in_review` |
| `in_review` | `needs_clarification`, `approved`, `rejected` |
| `needs_clarification` | `in_review` |
| `approved` | none |
| `rejected` | none |

Every transition is performed in a transaction with a row lock and creates an append-only `doctor_review_event` containing the previous state, new state, actor, note, and timestamp. Invalid transitions return a conflict. Assignment records `doctor_id` and `assigned_at`; opening records `opened_at`.

## Permissions and tenant boundaries

Review routes require an authenticated `doctor` or `staff` membership. Tenant context is resolved by the Phase 3A middleware. A patient receives `ROLE_FORBIDDEN`; a doctor or staff member cannot read or mutate a review outside the authenticated tenant. Doctors may assign themselves; staff may assign an active doctor in the same tenant. Only a doctor may approve and confirm durable profile data.

## APIs

All endpoints are under `/api/v1/doctor/reviews`:

- `GET /` — queue, optionally filtered by `status`.
- `GET /:id` — complete review context.
- `GET /:id/events` — event history.
- `POST /:id/assign` — body may contain `doctorId` and `note`.
- `POST /:id/open` — assigned to in-review.
- `POST /:id/clarification` — requires `note`.
- `POST /:id/approve` — optional `note` and explicit `profile` confirmation payload.
- `POST /:id/reject` — requires `reason`.
- `POST /:id/notes` — append-only private or patient-visible note; corrections reference `parentNoteId`.

The detail response includes patient identity, captured contact information, submitted session, normalized answers, immutable snapshot/hash, definition and question configuration, informational BMI, flag-rule version, flags including urgent flags, current confirmed profile history, notes, and events.

## Immutable assessment and profile confirmation

Assessment answers, the assessment snapshot, definition/version reference, and flag-rule snapshot are read-only after submission. Review endpoints never update them. A patient record and `patient_session` link are created only during doctor approval. Clinical domains are promoted only when explicitly supplied in the approval payload:

- conditions
- allergies/intolerances
- medications
- measurements
- lab values
- pregnancy records
- goals/history

Promoted rows are marked `basis=doctor_confirmed` and retain `confirmed_by`, `confirmed_at`, and `source_session_id`. No submitted answer is automatically promoted. Transient symptoms and other assessment context remain session-scoped.

## Notes and urgent routing

Review notes use a separate append-only table with `doctor_private` as the default visibility. A correction adds a new row and references the original; historical content is not overwritten. Urgent reviews are returned before standard reviews. Urgent flags are routing metadata only: they do not contact, diagnose, or treat a patient automatically.

## Plan gating

Existing Nutrition/Exercise models now reject transitions to `approved` or `active` unless their linked `doctor_review_id`/`source_review_id` refers to an approved review in the same tenant. Phase 3B does not expose plan creation or modification APIs.
