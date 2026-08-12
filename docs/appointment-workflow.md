# Appointment Workflow

Appointments are an explicit booking lifecycle, not a recurring scheduler.

## States

`pending → confirmed → completed`

From `pending`, a doctor may confirm or cancel. From `confirmed`, the doctor may cancel, complete, or mark no-show. Terminal states cannot be reopened.

Appointments preserve tenant, patient, doctor, optional service, clinic/online type, scheduled start/end, duration, branch reference, notes, confirmation time, and soft-delete metadata.

## APIs

- `POST /api/v1/appointments`
- `GET /api/v1/appointments/:id`
- `GET /api/v1/patients/:id/appointments`
- `GET /api/v1/doctors/:id/appointments`
- `POST /api/v1/appointments/:id/confirm`
- `POST /api/v1/appointments/:id/cancel`
- `POST /api/v1/appointments/:id/complete`
- `POST /api/v1/appointments/:id/no-show`

Patients may create their own appointment requests and read their appointments. Only the assigned doctor may change appointment state. Tenant, patient, doctor, service, time, and ownership checks are enforced. Every important change is audited.

An online appointment must be confirmed before a live session can be created. A provider failure does not cancel the appointment.
