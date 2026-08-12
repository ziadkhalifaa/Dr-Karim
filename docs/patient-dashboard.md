# Patient dashboard

The patient workspace is available at `/patient` and provides:

- Active nutrition and exercise plan summaries from the patient plan endpoints.
- Upcoming appointment status.
- Recurring check-in entry and history.
- A protected live-session entry point when an online appointment is confirmed.

Patients are addressed using the server-provided `patientId` mapping. The client never selects another patient identifier from local storage. Patient plan responses are already filtered by the backend to active versions and permitted note visibility.
