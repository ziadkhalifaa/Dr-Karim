# Internal notifications

Notifications are in-app only. The `notification` table stores a tenant, recipient user, role, type, localized generic title/message, read state, and safe related entity reference. Patients can only list/read their own rows; doctors and staff are limited to their own tenant-scoped rows.

Supported types cover assessments, reviews, payments, appointments, plans, and live sessions. Events are emitted by backend services, not frontend guesses. Creation is idempotent on recipient/type/related reference. Notification preferences prepare `in_app`, `email`, `whatsapp`, and `sms` channels, but only in-app delivery exists in this phase.

Endpoints: `GET /api/v1/notifications`, `POST /api/v1/notifications/:id/read`, `POST /api/v1/notifications/read-all`, `GET /api/v1/notification-preferences`, and `POST /api/v1/notification-preferences`.
