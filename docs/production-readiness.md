# Production readiness audit

Status: **NOT READY**

This is a Phase 6 audit. No deployment was performed and no new product phase was started.

## Decision

The backend regression and build gates pass, but the system is not ready for production because the production patient journey cannot be completed through the shipped UI and several deployment/configuration prerequisites are unresolved.

## Results

| Area | Status | Evidence |
|---|---|---|
| Backend regression | PASS | `server`: 69/69 tests passed |
| Unit tests | PASS | 39/39 passed |
| Server lint | PASS | `server/npm run lint` |
| Frontend lint | PASS WITH WARNINGS | lint passes; existing unused-variable and hook-dependency warnings remain |
| Frontend build | PASS | Vite production build succeeds |
| Migrations | PASS | all migrations applied |
| Assessment consistency | PASS | catalog/flag consistency verification passes |
| Database orphan smoke check | PASS | payment, subscription, and notification orphan counts were zero |
| Complete browser E2E | BLOCKED | payment, receipt, notification, and admin screens are not present in the current frontend |
| Real Daily join | BLOCKED | browser constructs a URL from `roomRef`; a provider-valid room URL was not verified |
| SPA fallback | BLOCKED | deployment notes identify `/assessment` and protected-route rewrites as required |
| Production configuration | BLOCKED | real auth secret, CORS origin, database, Daily key, and storage configuration must be supplied by deployment owner |

## Blocking issues

1. **Critical — commercial configuration is incomplete.** Consultation and 3-Month Care remain at the seeded zero price, and payment destinations are empty in the inspected database. Production payment creation must remain unavailable until authorized staff configure valid prices and destinations.
2. **High — frontend integration is incomplete.** The patient dashboard does not provide package purchase, payment submission, receipt upload, entitlement/payment history, or notifications. The doctor dashboard does not provide package/payment-settings administration or payment review UI.
3. **High — Daily join is not production-verified.** `src/features/patient/PatientDashboard.jsx` builds `https://${roomRef}.daily.co`; the backend adapter currently stores a room reference rather than a verified provider-neutral join URL. The backend does keep Daily secrets server-side, but the browser journey is blocked pending a valid join contract.
4. **High — deployment rewrite is unresolved.** Hostinger must serve the SPA entry point for `/assessment` and authenticated routes while keeping `/api` on the backend.
5. **Medium — configuration scope risk.** `PlatformSetting` is global while the admin configuration route is tenant-authenticated. A multi-tenant deployment must scope settings by tenant or explicitly operate as a single-tenant installation.

## Minimal audit hardening completed

- Production startup now fails fast when auth signing secret, restrictive CORS origins, or required Daily credentials are absent.
- Receipt uploads validate size, declared type, file signatures, private storage keys, and path traversal boundaries.
- Appointment responses expose `liveSessionId` without exposing Daily secrets.
- Notification writes are transaction-aware and idempotent by event reference.
- Existing payment tests use configured test fixtures; no production payment values were added to frontend code.

## Deferred by scope

External email/WhatsApp/SMS, payment gateways, recurring billing, AI, recording, and advanced analytics remain intentionally deferred.

## Required next action

Resolve the five blockers above, then rerun the complete browser/provider E2E and the full verification commands before deployment. This audit does not authorize a new feature phase.
