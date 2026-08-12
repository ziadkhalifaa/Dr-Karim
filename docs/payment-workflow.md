# Manual payment workflow

Phase 4 uses no gateway. Patients choose an active database package, select Vodafone Cash or InstaPay, transfer manually, and submit the sender phone, optional transaction reference, and private proof. The server resolves the current package price and currency and stores that snapshot on the payment.

Payment states are `pending`, `approved`, and `rejected`. Only doctor/staff review endpoints can approve or reject. Rejection requires a reason. Approval is transactional and creates or activates the related subscription and entitlement rows; repeated approval calls are idempotent.

Receipt payloads accept JPEG, PNG, or PDF data up to 5 MB. Files are stored under tenant-scoped private storage with random names and are served only through an authorized endpoint. Raw storage keys and receipt contents are not logged.

Endpoints include `/packages`, `/packages/:id`, `/payment-settings`, `/payments`, `/patient/payments`, `/payments/:id/receipt`, `/doctor/payments`, and the approve/reject review actions.
