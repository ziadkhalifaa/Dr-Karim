# Authentication and Authorization

Phase 3A establishes the server-side identity and authorization foundation. It does not add dashboards, clinical workflows, appointments, payments, video, nutrition, exercise, notifications, or AI features.

## Identity model

Authentication is separate from clinical records:

- `auth_user` stores login identity, password hash, account status, lockout counters, and an optional link to `doctor_profile` or `patient`.
- `auth_user_tenant` stores active tenant membership and the membership role (`doctor`, `staff`, or `patient`).
- A patient account may link to an existing `patient` row; the auth row is not the patient record.
- Refresh sessions and password-reset requests are stored as hashes in `auth_refresh_token` and `auth_password_reset`.

## Endpoints

All paths are under `/api/v1/auth`:

- `POST /login` — validates email or phone plus password and returns an access token and refresh token.
- `POST /refresh` — rotates a refresh token and returns a new access token/refresh token pair.
- `POST /logout` — revokes the submitted refresh token or its token family.
- `GET /me` — returns the authenticated user’s id, role, user type, and tenant.
- `POST /password-reset/request` — accepts an identifier without revealing whether an account exists. A development-only token is returned for local testing.
- `POST /password-reset/confirm` — consumes a reset token, changes the password, and revokes existing refresh sessions.

## Token and password rules

Passwords use Node’s `scrypt` with a per-password random salt. Plaintext passwords and raw refresh tokens are never persisted. Access tokens are short-lived signed tokens (15 minutes by default). Refresh tokens are opaque, stored by SHA-256 hash, expire after 30 days by default, and rotate on every successful refresh. Reuse of a rotated/revoked refresh token is rejected. Logout revokes the session family.

Failed logins are counted for enabled accounts. Five failures lock the account for 15 minutes by default. Disabled accounts and invalid credentials return the same generic authentication failure.

Configuration is in `server/src/config/env.js` and `.env.example`: `AUTH_TOKEN_SECRET`, `AUTH_ACCESS_TTL_SECONDS`, `AUTH_REFRESH_TTL_SECONDS`, `AUTH_MAX_FAILED_LOGINS`, `AUTH_LOCKOUT_SECONDS`, and `AUTH_PASSWORD_RESET_TTL_SECONDS`.

## Tenant and role authorization

`authenticateOptional`, `requireAuth`, `requireRole`, and `requireTenantAccess` are reusable middleware in `server/src/middleware/auth.js`.

In production, set `AUTH_REQUIRED=true`. Tenant context then comes from the authenticated user’s active membership. A client-supplied `X-Tenant-Slug` is only an optional consistency check and cannot select an unauthorized tenant. In development/test, `AUTH_REQUIRED=false` preserves the Phase 2 assessment fallback using `X-Tenant-Slug` or the configured default tenant. This fallback must not be enabled in production.

Phase 3A prepares role and tenant checks for future doctor/staff and patient routes. It intentionally does not expose cross-patient or clinical read endpoints yet; those belong to later phases and must compose `requireAuth`, `requireRole`, `requireTenantAccess`, and record-ownership checks.

## Operational security assumptions

Production must provide a strong secret through environment configuration, use HTTPS, keep refresh tokens in secure transport/storage appropriate to the client, and avoid logging authorization headers or reset tokens. The in-memory rate limiter is a local foundation; a multi-instance deployment should replace it with a shared store before relying on it for distributed abuse prevention.
