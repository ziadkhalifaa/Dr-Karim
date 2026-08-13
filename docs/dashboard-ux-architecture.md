# Dashboard UX Architecture (Phase 6D)

Two restructured dashboards, both driven by a single state source of truth on
the server, both fully localized (en / ar, RTL).

## Patient side — state-driven home

`PatientDashboard` calls `GET /patients/me/home` once per mount. The response
is the single source of truth for *where the patient is in onboarding*. The
overview page renders an `OnboardingGate` card above the regular workspace:

- `assessment_not_linked` → CTA to run the assessment
- `choose_package` → CTA to PaymentCenter (`/patient/payments`)
- `awaiting_payment_review` → waiting banner + payments link
- `unsubscribed` → renewal banner + payments link
- `active` → no gate; full workspace (plans, appointments, check-ins,
  notifications)

The existing sub-pages (DailyCare, Progress, Payments, Plan, Check-in,
Notifications) are unchanged — the gate only sits on the landing page, so no
inactive patient is shown a broken empty dashboard.

## Doctor side — patients-first workspace

Dedicated nav item **Patients** (`/doctor/patients`) sits right after
Overview. The directory replaces id-typing with search + filters; every
clinical action flows through `PatientProfile` at `/doctor/patients/:id`, whose
tabs scope `CarePrograms` and `DoctorProgress` to that patient via a
`patientId` prop. Standalone tools keep working through `PatientSelector`.

How patient context is passed (no global stash):

```
DoctorDashboard (route → path matching)
  ├─ /doctor/patients        → <PatientsList/>
  └─ /doctor/patients/:id    → <PatientProfile patientId={id}/>
                                  ├─ <CarePrograms patientId={id}/>
                                  └─ <DoctorProgress patientId={id}/>
```

`PatientsList` navigates with `navigate(\`/doctor/patients/${p.id}\`)`; the
profile back button returns with `navigate("/doctor/patients")`.

## Conventions

- **No internal ids in user-facing labels.** Ids appear only in audit traces
  and, where unavoidable, in compact developer contexts.
- **Server-authoritative prices and statuses.** The client never computes
  package prices or patient state.
- **One picker everywhere.** `PatientSelector` debounced name/phone search.
- **Component scoping via props**, not by looking up patients globally.

## Key files

- `src/features/patient/PatientDashboard.jsx` — `OnboardingGate` + `home`
- `src/features/doctor/DoctorDashboard.jsx` — nav + route matching
- `src/features/doctor/PatientsList.jsx`, `PatientProfile.jsx`
- `src/features/shared/PatientSelector.jsx`
- `src/locales/en.js` / `src/locales/ar.js` — all Phase 6D keys