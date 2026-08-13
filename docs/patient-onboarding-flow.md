# Patient Onboarding Flow (Phase 6D)

The patient journey is one guided flow: **Assessment → Account → Package →
Payment → Approval → Active**. Internal database ids are never shown to
patients in the UI; the server derives every onboarding state and keeps the
frontend dumb.

```
public site        /assessment              submit
   │                    │                       │
   ▼                    ▼                       ▼
AssessmentPage  ──►  POST /assessment/submit ──► AssessmentSession (queued)
create-account CTA    ├─ stash sessionStorage    │ pending until reviewed
   │                  │   drke-register-name    ▼
   ▼                  │   drke-register-phone   registered patient may bind
/register         ◄───┘  drke-register-assessment
   │
   ▼
POST /auth/register ──► AuthUser + AuthUserTenant(patient) + Patient(pending_payment)
   │                       └ opts: bind AssessmentSession via reference_number
   ▼
/patient  (state-driven home via GET /patients/me/home)

   state = choose_package          state = awaiting_payment_review
   │  CTA → /patient/payments            │
   ▼                                    ▼ PaymentCenter.submit → POST /payments
PaymentCenter (server prices) ──► waiting banner ──► doctor approves (PaymentReview)
                                                           │
                                                           ▼
                     Subscription active + entitlements + Patient.status = active

   state = active  →  full workspace (DailyCare, Progress, Plans, Appointments)
```

## Steps in detail

1. **Assessment** — the public `/assessment` page submits a session. On success
   the SuccessScreen shows a **"Create my account"** CTA and the submit handler
   stashes `drke-register-name`, `drke-register-phone` and
   `drke-register-assessment` (reference number) in `sessionStorage`.
2. **Account** — `/register` (RegisterPage) prefills the stashed values, runs
   client-side password checks, and calls `POST /auth/register`. The server
   creates `AuthUser` + `AuthUserTenant` (role `patient`) + `Patient` with
   status `pending_payment`, dedupes on `phone_canonical` (409), rejects
   invalid Egyptian phone numbers (422), and optionally binds the assessment
   session (by `session_token` or `reference_number`), setting
   `DoctorReview.patient_id`. Response returns access + refresh tokens via the
   existing `accessToken()` helper. The patient lands on `/patient`.
3. **Package** — the patient home aggregate reports `choose_package`; the home
   renders an onboarding card whose CTA opens PaymentCenter.
4. **Payment** — PaymentCenter shows server-authoritative prices and configured
   manual methods (Vodafone Cash / InstaPay). Submission creates a pending
   `Subscription` + `Payment`. Home state flips to `awaiting_payment_review`.
5. **Approval** — the doctor/staff PaymentReview approves; `payment.service.js
   review()` activates the subscription, grants entitlements, and flips
   `Patient.status` `pending_payment → active` in the same locked transaction.
6. **Active** — home state becomes `active` and the full patient workspace is
   available (daily care, progress, plans, appointments, check-ins).

## State machine (server-derived)

`GET /patients/me/home` returns `onboarding.state`:

| State | Meaning | UI action |
| --- | --- | --- |
| `assessment_not_linked` | account exists but no assessment bound | run `/assessment` |
| `choose_package` | no payment / subscription started | open PaymentCenter |
| `awaiting_payment_review` | pending payment or subscription | waiting banner + payments |
| `active` | active subscription | full workspace |
| `unsubscribed` | subscription lapsed | renew via payments |

State is computed from `Patient.status`, the active subscription, pending
payments/subscriptions and assessment binding — never stashed on the client.

## Key files

- `server/src/services/auth.service.js` — `register()` (session binding,
  phone dedupe, Egyptian phone validation, membership + tokens)
- `server/src/services/patient.service.js` — `home()` aggregate + state machine
- `server/src/services/payment.service.js` — approval path activates + flips
  patient to active
- `server/src/migrations/027_patient_registration.js` — `pending_payment` status
- `src/features/auth/RegisterPage.jsx` — registration screen
- `src/features/assessment/pages/AssessmentPage.jsx` + `components/SuccessScreen.jsx`
- `src/features/patient/PatientDashboard.jsx` — state-driven home (OnboardingGate)