# Nutrition Plan Workflow

Phase 3C implements the backend nutrition-plan domain. It does not generate recommendations, diagnose, treat, or build a patient/doctor dashboard.

## Entities

- `nutrition_plan` is the logical plan for one tenant patient and doctor.
- `nutrition_plan_version` is immutable history for a plan version and links to the source doctor review and assessment session.
- `meal_template` stores meal/day ordering, bilingual names, instructions, and notes.
- `meal_item` stores the selected catalog food, quantity, unit, ordering, and notes.
- `food_substitution` stores an explicitly selected substitute and reason, optionally at meal-item level.
- `nutrition_plan_note` stores append-only doctor notes with `doctor_private` or `patient_visible` visibility.

## Lifecycle and approval gate

Versions move through:

`draft → doctor_review → approved → active → archived`

Only a doctor can write plans. Creation requires a tenant-local patient and source doctor review, and preserves the source assessment session. Approval verifies that the review is for the same patient and has `status=approved` and `decision=approved`. Activation is transactional: any previous active version is archived before the new version becomes active. Version numbers, previous-version links, approval doctor/time, and all timestamps remain available.

The model-level gate also rejects any direct attempt to save a nutrition plan/version as `approved` or `active` without an approved same-tenant doctor review.

## APIs

- `POST /api/v1/nutrition-plans`
- `GET /api/v1/nutrition-plans/:id`
- `POST /api/v1/nutrition-plans/:id/versions`
- `POST /api/v1/nutrition-plans/:id/notes`
- `POST /api/v1/nutrition-plan-versions/:id/submit-review`
- `POST /api/v1/nutrition-plan-versions/:id/approve`
- `POST /api/v1/nutrition-plan-versions/:id/activate`
- `POST /api/v1/nutrition-plan-versions/:id/archive`
- `GET /api/v1/patients/:id/nutrition-plan`

Patients can read only their current active plan and patient-visible notes. Doctor-private notes, internal review data, and audit data are excluded. Patients cannot write any plan endpoint.
