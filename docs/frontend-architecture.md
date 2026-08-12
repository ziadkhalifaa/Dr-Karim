# Frontend architecture

Phase 3E keeps the existing Vite/React application and pushState router. The public landing page remains unchanged.

## Session and API

`src/api/client.js` is the single request boundary. It targets `/api/v1`, attaches the access token, refreshes once on a 401 using the refresh token, normalizes the server envelope, and throws `ApiError` values with the backend code and validation details. Domain clients cover authentication, reviews, plans, check-ins, appointments, and live sessions.

`AuthProvider` verifies the server session with `/auth/me` before protected content renders. Tokens are kept in session storage; role, tenant, and doctor/patient mappings come from the server response and are never treated as authorization authority in the browser.

## Routes

- `/login`
- `/doctor`, `/doctor/reviews`, `/doctor/patients`, `/doctor/patients/:id`, `/doctor/appointments`
- `/patient`, `/patient/plan`, `/patient/progress`, `/patient/appointments`

`ProtectedRoute` redirects unauthenticated users to `/login` and redirects authenticated users away from the other role's workspace.

## State

The app context owns presentation preferences (language, direction, theme). Auth context owns the verified session. Dashboard components fetch domain data close to the consuming page and expose loading, empty, error-safe, and action states rather than maintaining a global copy of server records.

## Design and accessibility

Dashboard styles use the existing Dr. Kareem tokens, support RTL/LTR, light/dark themes, responsive layouts, visible focusable controls, semantic tables/forms, and reduced motion.
