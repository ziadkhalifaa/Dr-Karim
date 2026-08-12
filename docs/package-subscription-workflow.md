# Packages, subscriptions, and entitlements

Packages are commercial offerings. Nutrition and exercise plans remain clinical records. A subscription is ownership of a package; subscription entitlements are copied from package entitlements at activation so later package configuration changes do not rewrite historical ownership.

Monthly Care and 3-Month Care use server-side activation dates and month-based expiration. Consultation is represented as a one-time subscription with no expiration date and a consultation entitlement. No recurring billing or scheduler exists.

Entitlement checks consider tenant, patient, status, start date, and end date. The patient endpoint is `/patient/entitlements`; future domain services can call the same entitlement records before allowing paid actions.
