# Security audit

Status: **NOT READY — core controls pass; release blockers remain**

## Control results

| Control | Status | Finding |
|---|---|---|
| Authentication on sensitive APIs | PASS | authenticated route middleware and role checks are present |
| Tenant enforcement | PASS (covered paths) | tenant context and ownership checks are covered by regression tests |
| Password handling | PASS | password hashing and refresh-token rotation tests pass |
| Refresh revocation | PASS | prior refresh token is rejected after rotation/logout |
| Helmet/security headers | PASS | configured in backend security middleware |
| CORS | PASS (code) / BLOCKED (deployment) | restrictive allow-list logic exists; production origins must be supplied |
| Rate limiting | PASS (smoke/code) | auth endpoints are throttled; limiter is in-memory |
| Payload limits | PASS | JSON body limit and upload limits exist |
| Safe errors | PASS | production error handler avoids stack details |
| Request log redaction | PASS | bodies/headers/query are not logged by request logger |
| Receipt storage | PASS (API) | private tenant path, safe generated name, MIME/signature/size checks, traversal boundary |
| Secrets in source | PASS for inspected application code | no production secret was introduced; test fixtures contain only test credentials |
| Production fallback disabling | PASS (code) / BLOCKED (deployment) | production auth/config checks exist; runtime environment still must be verified |
| Configuration audit | PASS (code) / BLOCKED (scope) | audit events exist; platform settings are global and need tenant decision |

## Findings

- HIGH: the real deployment must provide a strong auth signing secret, strict CORS, and Daily credentials. Startup now rejects missing production values, but this has not been exercised on Hostinger.
- HIGH: the frontend Daily join contract is not verified. The client uses a derived URL from `roomRef`; this must be replaced or validated against the provider response before real users join.
- MEDIUM: the in-memory rate limiter is not suitable for multiple application instances. Use a shared limiter before horizontal scaling.
- MEDIUM: global payment settings are exposed through tenant-authenticated administration. Scope the settings or document and enforce a single-tenant deployment.
- LOW: frontend lint warnings should be cleaned before a strict warning-free release, although they do not currently fail the build.

## Explicitly not claimed

This document is an engineering security review, not a GDPR, HIPAA, PCI, or other compliance certification.

## Deferred

External messaging channels, gateway credentials, automated billing, recording, AI, and analytics are outside Phase 6 scope.
