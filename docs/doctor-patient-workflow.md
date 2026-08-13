# Doctor / Staff Patient Workflow (Phase 6D)

Doctors and staff never type internal patient ids anymore. Every clinical tool
is reached from the **patient directory** and rendered **patient-contextual**.

```
/doctor/patients          directory (search by name/phone, filter, sort)
        │
        └─ navigate /doctor/patients/:id   PatientProfile
                │
                ├─ Overview   identity · subscription · plans · measurements · appointments
                ├─ Care       <CarePrograms patientId={id}>
                ├─ Progress   <DoctorProgress patientId={id}>
                └─ Payments   recent payment history
```

Standalone tools (`/doctor/care`, `/doctor/progress`) still exist, but the
patient is selected through a shared `PatientSelector` (name/phone search with
debounce, click-outside, clear) instead of an id text field. When rendered
inside the profile the selector is suppressed and the workspace is scoped to
that patient.

## Directory (`GET /patients`)

- Roles: doctor, staff.
- Query params: `q` (name/phone `LIKE`), `status` (repeatable),
  `page`/`limit`, `sort = name | oldest | recent`.
- Each row includes `subscriptionStatus` and `hasPendingPayment` so the nurse
  can triage payment-pending patients without opening each record.
- Rows never leak raw internal ids to the screen — patients are opened by a
  click on their profile row.

## Profile (`GET /patients/:id`)

Doctor/staff read; a patient may only read their **own** record (403
otherwise). Returns identity, profile domains, subscription + entitlements,
recent payments, latest care program, active plans, upcoming appointments,
latest measurements and the latest assessment review. Reads are audited
(`patient.viewed`).

## Patient-contextual components

- `CarePrograms` accepts `patientId`. In context mode the list is filtered
  (`?patientId=`), creation is pre-scoped (`CreateProgram` shows the selected
  patient hint instead of a picker), and the detail header names the patient.
  Plan versions are chosen from approved-version pickers
  (`GET /patients/:id/plan-versions`) — never typed as ids.
- `DoctorProgress` accepts `patientId`. Context mode loads immediately scoped;
  standalone mode uses `PatientSelector` and auto-opens on selection.
- `PatientSelector` is the single shared picker used by both, enforcing
  "search by name or phone" everywhere.

## Key files

- `server/src/routes/patient.routes.js` — `/patients` list/get (route
  `me/home` declared before `:id`)
- `server/src/services/patient.service.js` — `list()` / `get()` aggregates
- `src/features/doctor/PatientsList.jsx` — directory
- `src/features/doctor/PatientProfile.jsx` — context tabs
- `src/features/shared/PatientSelector.jsx` — shared name/phone picker