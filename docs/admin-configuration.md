# Admin configuration

Authorized doctors use the existing authenticated API surface for configuration; no separate admin product was introduced. Package configuration endpoints are:

- `GET /api/v1/admin/packages`
- `PATCH /api/v1/admin/packages/:id`
- `GET /api/v1/admin/payment-settings`
- `PATCH /api/v1/admin/payment-settings`

Package changes are tenant-scoped and audited. Prices update future payment snapshots only; payment rows retain their historical amount/currency. Entitlements are copied into subscriptions at activation, so changing package definitions does not silently remove already-granted access. Payment destinations and instructions are stored in `platform_setting` and never logged as values.
