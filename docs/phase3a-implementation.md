# Phase 3A Implementation

## Status

Phase 3A — Authentication + Authorization Foundation: complete.

## Delivered

1. Migration `015_authentication_authorization.js` creates auth users, tenant memberships, refresh sessions, and password-reset records.
2. Sequelize models and associations connect auth users to doctor profiles, patients, tenants, refresh sessions, and reset requests.
3. Login supports doctor, staff, and patient identities, password hashing, enabled/disabled status, failed-login lockout, and tenant membership selection.
4. Access/refresh sessions use short-lived signed access tokens, opaque hashed refresh tokens, rotation, family revocation, expiration, and logout.
5. Password reset has a generic request response, expiring one-time tokens, password replacement, and session revocation.
6. Middleware provides optional authentication, required authentication, role checks, and authenticated tenant access checks.
7. Phase 2 assessment routes remain compatible in development/test and require authentication when `AUTH_REQUIRED=true`.
8. Live integration tests cover doctor and patient login, invalid/disabled accounts, refresh rotation, logout, expiration, and unauthorized tenant access. Unit tests cover password hashing and access-token integrity.

## Verification

Run from `server/` with the configured MySQL environment:

```powershell
npm.cmd run db:migrate
npm.cmd run lint
npm.cmd run test
```

Run the client checks from the repository root:

```powershell
npm.cmd run lint
npm.cmd run build
```

The migration was applied successfully to the local MySQL 8 database, and the focused Phase 3A suite passes. The final full-suite and client verification are recorded in the handoff response.

## Explicit scope boundary

No dashboards, patient/doctor UI, appointments, payments, Daily.co/video, nutrition/exercise UI, notifications, AI, or treatment workflows were started. No clinical domain endpoint is considered authorized merely because a user is authenticated; future endpoints must add role, tenant, and ownership checks appropriate to the record being accessed.
