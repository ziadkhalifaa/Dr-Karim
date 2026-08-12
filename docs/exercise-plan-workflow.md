# Exercise Plan Workflow

Phase 3C implements the backend exercise-plan domain only. It does not create medical exercise protocols, contraindication logic, automatic prescriptions, or user-interface dashboards.

## Entities

- `exercise_plan` is the logical tenant/patient plan and source doctor review.
- `exercise_plan_version` preserves versioned doctor-authored sets, reps, duration, frequency, rest, notes, effective dates, source session, approval provenance, and previous-version link.
- `exercise_item` remains a lightweight global catalog with stable code, bilingual names, category, description, instructions, and active state.
- `exercise_substitution` stores explicit catalog substitutions and reasons.
- `exercise_plan_note` stores append-only private or patient-visible doctor notes.

## Lifecycle and approval gate

Versions use:

`draft → doctor_review → approved → active → archived`

Only doctors may create, submit, approve, activate, archive, or add notes. Staff may read within their authorized tenant. Approval requires the linked doctor review to be approved for the same patient and tenant. Activation locks the logical plan, archives its former active version, and activates exactly one new version transactionally. Nutrition and exercise plans are separate logical plans and may each have one active version.

Direct model saves to `approved` or `active` are rejected unless a same-tenant approved doctor review is linked.

## APIs

- `POST /api/v1/exercise-plans`
- `GET /api/v1/exercise-plans/:id`
- `POST /api/v1/exercise-plans/:id/versions`
- `POST /api/v1/exercise-plans/:id/notes`
- `POST /api/v1/exercise-plan-versions/:id/submit-review`
- `POST /api/v1/exercise-plan-versions/:id/approve`
- `POST /api/v1/exercise-plan-versions/:id/activate`
- `POST /api/v1/exercise-plan-versions/:id/archive`
- `GET /api/v1/patients/:id/exercise-plan`

Patient reads expose only the current active version and patient-visible notes. Patients cannot modify plans.
