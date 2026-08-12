# Phase 2 implementation — assessment intake

Status: COMPLETE — verified against local MySQL 8.0.46.

Implemented boundary: `POST /api/v1/assessment/submit`. The server resolves the active published assessment definition, checks the submitted version, validates against frozen `question_version_cfg` data (including options, required state, validation, conditional rules, and list columns), normalizes contact phones, derives approved RU1–RU9/RS1–RS14 flags, calculates BMI informationally, generates the reference number, and queues doctor review.

The request tenant is resolved before API routes. `X-Tenant-Slug` is supported and defaults to `dr-kareem`; unknown tenants return `TENANT_NOT_FOUND`. There are no Phase 2 cross-tenant read endpoints.

Submission is one Sequelize transaction: session, normalized answer rows, immutable hash snapshot, flag rows, queued doctor review, review event, and audit rows. Client reference numbers, flags, tier, BMI, and review state are ignored. The snapshot preserves rule ID, rule version, tier, messages, source question references, and minimal trigger context. A session stores the deterministic canonical effective flag-rule version even when no flag fires.

The approved frontend submit action calls the API, shows the server reference/tier/queue state, displays safe API errors, and clears localStorage only after a successful response. No WhatsApp submission or clinical plan generation is included.

Verification run:

- `npm.cmd run test` — 40 tests pass, including live DB integration tests.
- `npm.cmd run test:unit` — 34 pass.
- Root `npm.cmd run build` — pass.
- Root/server lint — pass.
- `npm.cmd run db:verify` — pass against MySQL; 105 catalog/config rows and 23 flag rules/versions verified.

Known non-blocking limitations: Phase 2 has no authenticated doctor/patient read surface, so tenant isolation is enforced at the write boundary and model/query scope rather than exposed through read endpoints. The local verification database contains test submissions from the integration suite.

Next phase after DB verification: authentication/authorization and doctor review surfaces, per the handoff scope.
