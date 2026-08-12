# Phase 3C Implementation

## Status

Phase 3C — Nutrition Plan + Exercise Plan: complete.

## Delivered

- Shared plan lifecycle service for nutrition and exercise domains.
- Doctor-only plan creation and modification; staff read access; patient read-only access to their own active plan.
- Same-tenant patient/review/source-session validation.
- Approval requires an approved `DoctorReview` with matching patient and tenant.
- Transactional activation archives the previous active version and preserves history.
- Version numbering, previous-version links, effective dates, source review/session, creator, approver, and approval time.
- Minimal nutrition meals/items and explicit food substitutions.
- Lightweight exercise catalog exposure within doctor plan context; no clinical exercise-generation logic.
- Private/patient-visible append-only plan notes.
- Audit events for creation, version creation, submission, approval, activation, archive, and note addition.
- Model-level plan gating for direct writes to `approved` or `active`.

## Verification

The Phase 3C integration suite covers draft creation, patient/tenant authorization, wrong-patient rejection, unapproved-review rejection, approval, activation, atomic active-version replacement, history preservation, independent nutrition/exercise activation, patient visibility, private-note filtering, and patient write denial.

Run from `server/`:

```powershell
npm.cmd run db:migrate
npm.cmd run test
npm.cmd run lint
npm.cmd run db:verify
```

Run from the repository root:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Scope stop

No Daily.co, appointments, live sessions, patient/doctor dashboards, check-ins, weekly automation, notifications, payments, AI, diagnosis, or treatment decisions were started.
