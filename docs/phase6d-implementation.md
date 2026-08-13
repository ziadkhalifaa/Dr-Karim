# Phase 6D — Patient Onboarding + Doctor Workflow + Dashboard UX: Implementation Record

## Status: COMPLETE

Phase 6D reworks how patients get onboarded and how doctors work with them.
Scope preserved the existing backend/domain, added a minimal API surface, kept
package prices server-authoritative, removed internal patient-ids from the UI,
moved patient state derivation to the server, and deferred OTP entirely.

## Scope guardrails honored

- No new payment gateways, external notifications, AI, or automatic clinical
  interpretation.
- Email is optional at registration.
- No OTP system (deferred to a later phase).
- Existing domain/entity model preserved; `pending_payment` is the only enum
  addition.

## Backend deliverables

- `server/src/config/constants.js` — `ENUM.PATIENT_STATUS` now includes
  `pending_payment`.
- `server/src/migrations/027_patient_registration.js` — adds the enum value
  (forward-only in production; `down()` included).
- `server/src/services/auth.service.js` — `register()`: creates
  `AuthUser` + `AuthUserTenant`(patient) + `Patient(pending_payment)`, dedupes
  on `phone_canonical` (409), rejects invalid Egyptian phone numbers (422),
  optionally binds the `AssessmentSession` via
  `session_token`/`reference_number` (sets `DoctorReview.patient_id`), returns
  access+refresh via the existing `accessToken()` helper.
- `server/src/controllers/auth.controller.js` + `server/src/routes/auth.routes.js`
  — `POST /auth/register`, rate-limited (10/min).
- `server/src/services/payment.service.js` — on approval also flips
  `Patient.status` `pending_payment → active` (locked row, inside the existing
  transaction).
- New `server/src/services/patient.service.js`, `controllers/patient.controller.js`,
  `routes/patient.routes.js`:
  - `GET /patients` — doctor/staff directory; `q`/`status`/`page`/`limit`/
    `sort=name|oldest|recent`; per-row `subscriptionStatus` + `hasPendingPayment`.
  - `GET /patients/:id` — detail aggregate (identity, profile domains,
    subscription, payments, plans, appointments, progress, care program, review);
    patients may read only their own record; reads audited.
  - `GET /patients/me/home` — patient state aggregate with server-derived
    `onboarding.state` (`assessment_not_linked`, `choose_package`,
    `awaiting_payment_review`, `active`, `unsubscribed`).
  - `GET /patients/:id/plan-versions` — doctor/staff approved plan-version
    picker data (`{ patientId, nutrition: [...], exercise: [...] }`) used by
    CareProgram authoring; patients may read only their own (403 otherwise).
  - Route order: `me/home` declared before `:id`.
- `server/src/routes/index.js` — placeholder `patientRouter` replaced (import +
  registration added).
- Integration test `server/test/integration/patient6d.integration.test.js` —
  full register→home→duplicate/invalid phone→unknown ref→authz denials→
  choose_package→payment→awaiting_payment_review→approve→active flow, plus
  doctor-only plan-version access; skips cleanly without a live MySQL.

## Frontend deliverables

- `src/api/client.js` — `authApi.register`, expanded `patientApi`
  (`list`/`get`/`home`).
- `src/context/AuthProvider.jsx` — `register()` + persisted user.
- `src/features/auth/RegisterPage.jsx` — prefill from `sessionStorage`,
  client-side password checks, bounded session, lands on `/patient`.
- `src/App.jsx` — `/register` route.
- `src/features/assessment/pages/AssessmentPage.jsx` — submits stash
  name/phone/reference into `sessionStorage`.
- `src/features/assessment/components/SuccessScreen.jsx` — "Create my account"
  CTA (en/ar).
- `src/features/patient/PatientDashboard.jsx` — state-driven home via
  `patientApi.home()` with an `OnboardingGate` per onboarding state.
- `src/features/shared/PatientSelector.jsx` — debounced name/phone patient
  picker (search, clear, click-outside).
- `src/features/doctor/PatientsList.jsx` — directory (filters, sort,
  pagination, status/subscription/pending badges, open profile).
- `src/features/doctor/PatientProfile.jsx` — context tabs
  (Overview / Care / Progress / Payments).
- `src/features/doctor/DoctorDashboard.jsx` — Patients nav item +
  `/doctor/patients` and `/doctor/patients/:id` routing.
- `src/features/doctor/CarePrograms.jsx` — patient-contextual via `patientId`
  (`CreateProgram` pre-scoped; list filtered; selector only when standalone);
  plan-version fields are pickers (`PlanVersionSelect` fed by
  `patientApi.planVersions`) instead of free-text ids.
- `src/features/doctor/ProgressManager.jsx` — accepts `patientId`; standalone
  mode uses `PatientSelector` (auto-open), no id typing.
- `src/locales/en.js` / `ar.js` — `dashboard.nav.patients`, `doctorPatients.*`,
  `patientSelector.*`, `patientProfile.*`, `register.*`, onboarding state keys,
  `dashboard.common.close`.
- `src/styles/dashboard.css` — selector menu, directory filters, profile def
  list, pagination, onboarding gate styles.

## Verification

- Server lint: 0 warnings / 0 errors.
- Frontend lint: 0 errors (16 pre-existing warnings in legacy components).
- Frontend build: `vite build` succeeds cleanly.
- `npm test` (server): 124 total, 74 unit pass / 0 fail, 50 DB-dependent
  skips (no live MySQL in this environment) — never faked.
- Module smoke test: all Phase 6D services/controllers load and export
  (`patient.service` exposes list/get/planVersions/home).

## Known limits / follow-ups

- Integration coverage relies on MySQL and is written but skipped here.
- OTP verification remains deferred per spec.