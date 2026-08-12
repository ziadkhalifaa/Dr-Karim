# Doctor dashboard

The doctor workspace is available at `/doctor` and includes:

- Overview metrics derived from the review and appointment APIs.
- Urgent-first review queue with assign, open, approve, and reject actions.
- Patient records linked to review context, with identity, contact, current profile, assessment history, review events, and derived values separated visually.
- Appointment schedule with confirm, complete, and cancel actions.

The queue uses `GET /doctor/reviews`; it does not invent patient counts or clinical analytics. The patient index is intentionally limited to patients returned by the approved review API because no separate patient-list endpoint was part of the prior backend contract.
