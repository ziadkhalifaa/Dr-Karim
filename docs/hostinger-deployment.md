# Hostinger deployment requirements

Status: **BLOCKED — requirements documented; deployment not performed**

These are requirements derived from the repository. No Hostinger values are invented here.

## Runtime and commands

- Node.js: use a supported version satisfying `server/package.json` (`>=18`); validate the selected Hostinger version against the current lockfile before deployment.
- Frontend build: `npm run build` from the project root.
- Backend start: `npm start` from `server` (`node src/server.js`).
- Database migration: `npm run db:migrate` from `server`, as a controlled release step before starting the new application version.
- Seeding: `npm run db:seed` only for an explicitly approved empty/non-production database; never seed test data into production.

## Required environment/configuration

Supply through Hostinger secrets/configuration, not source control:

- MySQL host, port, database, username, and password.
- `AUTH_TOKEN_SECRET` with production-grade entropy and at least the application-required length.
- `CORS_ORIGINS` containing only the deployed frontend origin(s), never localhost.
- `NODE_ENV=production` and `AUTH_REQUIRED=true`.
- Daily production mode and `DAILY_API_KEY` when live sessions are enabled.
- frontend API base/origin as expected by the existing client configuration.
- writable private storage directory for `server/storage/private/payment-receipts`, outside public static serving.

The server now fails fast in production when required auth, CORS, or Daily configuration is missing.

## Routing and storage

Configure the web server so `/api/*` reaches the Node backend and non-API SPA routes, including `/assessment` and protected dashboard paths, fall back to the frontend `index.html`. Do not make `server/storage/private` public. Confirm upload size limits are consistent at the web server and application layers.

## Operations

- Use a single controlled migration process; do not run migrations concurrently across instances.
- Keep production logs free of request bodies, authorization headers, receipt contents, and PHI.
- Back up MySQL and private receipt storage before release.
- Verify the configured origin, auth-required behavior, private receipt authorization, and health/startup behavior after deployment.

## Current deployment blockers

FAIL/BLOCKED: rewrite configuration is not present in this repository; real environment values are not available to this audit; Daily provider join URL behavior is not production-verified. Do not deploy until these are resolved.
