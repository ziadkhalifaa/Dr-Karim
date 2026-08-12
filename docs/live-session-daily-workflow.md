# Live Session and Daily.co Workflow

## Provider-neutral model

`appointment → live_session → video_meeting → video_meeting_provider`

The platform stores provider-neutral room/session references and local lifecycle state. No Daily-specific columns are added to patients, doctors, appointments, or live sessions. Meeting tokens are returned only at join time and are never stored. Recording is not enabled.

## Live-session states

`not_started → waiting → active → ended`

Provider setup failure records the local session as `failed` and leaves the confirmed appointment unchanged. A failed session may be retried through the same explicit creation workflow after the prior failed record.

## Daily boundary

`DailyProvider` is the integration adapter. Local development uses a mock provider. Production uses the Daily REST API with `DAILY_API_KEY` held only in server environment configuration. The adapter creates private rooms with expiration, creates short-lived participant tokens, and performs provider cleanup. The backend authorizes the participant before requesting a token; a room URL alone is never authorization.

Daily management secrets and tokens are not logged or persisted. Daily room creation follows the provider’s private-room and expiry model; meeting-token expiry is short-lived. [Daily room creation documentation](https://docs.daily.co/reference/rest-api/rooms/create-room) and [meeting-token documentation](https://docs.daily.co/reference/rest-api/meeting-tokens/create-meeting-token).

## Join permissions and notes

Only the assigned doctor, the appointment’s patient, or explicitly permitted staff can access a live session. Cross-tenant and wrong-patient joins fail. Doctors can add append-only session notes, with `doctor_private` as the default. Patients see only `patient_visible` notes; corrections create a new note linked to the original.

Ending a session records start/end/duration and suggests the next follow-up date using the patient cadence override or seven-day default. It does not modify plans or create an appointment automatically.
