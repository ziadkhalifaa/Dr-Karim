# Database Implementation — Phase 1

**Project:** Dr. Kareem Eliethy — Clinical Nutrition Platform
**Phase:** 1 — Schema, migrations, models, associations, seed data, consistency verification
**Status:** COMPLETE (as built)
**Source of truth:** `docs/database-architecture.md` (approved) + `docs/assessment-spec.md`
**Target:** Hostinger Business Node.js Web App · MySQL 8+ · Sequelize 6 · Node.js ESM
**Out of scope:** APIs, controllers, auth, flag derivation, plan generation, payments, video — all later phases.

---

## 1. Location & Layout

```
server/
  package.json                  # ESM; scripts: db:migrate, db:seed, db:verify, lint
  .env.example                  # DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD / DB_LOGGING / DB_CHARSET
  src/config/database.js        # Sequelize instance (utf8mb4, underscored, freezeTableName)
  src/config/constants.js       # ENUMs + ID constants (REFERENCE_NUMBER_PREFIX "DK-", SESSION_TOKEN_LENGTH 36, HASH_LENGTH 64)
  src/config/phone.js           # canonicalizeEgyptianPhone / preserveDisplay
  src/models/                   # 13 model groups + index.js (registry + all associations)
  src/migrations/               # 001..013 forward-only migrations
  scripts/
    esm-loader.mjs              # resolves frontend extensionless imports (for seed/verify)
    migrate.js                  # checksummed forward-only runner
    seed.js                     # idempotent reference data
    verify-assessment-consistency.js  # read-only DB-vs-frontend single-source check
```

The root `package.json` remains frontend-only (Vite/React). All DB work lives under `server/` with its own dependency set.

---

## 2. Database Connection

`server/.env.example` → `server/src/config/database.js`:

| Env | Default | Purpose |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `dr_kareem` | Database name |
| `DB_USER` | — | MySQL user |
| `DB_PASSWORD` | — | MySQL password |
| `DB_LOGGING` | `false` | Sequelize SQL logging |
| `DB_CHARSET` | `utf8mb4` | Charset (Arabic text) |

Connection options: `underscored: true`, `freezeTableName: true`, dialect `mysql`, `dialectOptions` set for MySQL 8 (`authPlugins: { mysql_clear_password: () => () => process.env.DB_PASSWORD }`), connection retry `max: 3`. All tables are `utf8mb4` to store Arabic labels.

---

## 3. Migrations (001–013, forward-only)

Runner (`scripts/migrate.js`): applies pending migrations in strict numeric ascending order, records `name` + `sha256` checksum in `schema_migrations`, and **refuses** to re-apply a migration whose checksum changed (forward-only; corrections are new migrations). No destructive rollback. `node scripts/migrate.js --status` reports applied/pending without applying.

| # | File | Creates |
|---|---|---|
| 001 | `001_tenancy_people.js` | `tenant`, `doctor`, `patient`, `contact_person`, `patient_contact` |
| 002 | `002_assessment_catalog.js` | `question_catalog`, `assessment_definition`, `question_version_cfg` |
| 003 | `003_assessment_sessions.js` | `assessment_session`, `assessment_answer`, `assessment_snapshot`, `patient_session` |
| 004 | `004_flags.js` | `flag_rule`, `flag_rule_version`, `assessment_flag` + deferred FKs (`patient.source_session_id`, `patient_contact.source_session_id`, `assessment_session.flag_rule_version_id`) |
| 005 | `005_review_profile.js` | `doctor_review`, `doctor_review_event`, `patient_condition`, `patient_allergy`, `patient_medication`, `patient_measurement`, `patient_lab_value`, `patient_pregnancy_record`, `patient_goal_history` |
| 006 | `006_reference_codes.js` | 8 GLOBAL code tables (loop): `relationship_code`, `goal_code`, `diet_pattern_code`, `reaction_code`, `severity_code`, `condition_code`, `appointment_status`, `service_status` |
| 007 | `007_content_services_settings.js` | `service_category`, `service_category_translation`, `service`, `service_translation`, `content_category`, `content_category_translation`, `content`, `content_translation`, `clinic_info`, `working_hour`, `platform_setting`, `feature_flag` |
| 008 | `008_appointments.js` | `appointment` |
| 009 | `009_live_notes.js` | `video_meeting_provider`, `live_session`, `video_meeting`, `session_note`, `session_note_clarification` |
| 010 | `010_nutrition.js` | `nutrition_plan`, `nutrition_plan_version`, `food_item`, `meal_template`, `meal_item`, `food_substitution`, `nutrition_plan_note` |
| 011 | `011_exercise.js` | `exercise_plan`, `exercise_plan_version`, `exercise_item`, `exercise_substitution`, `exercise_plan_note` |
| 012 | `012_checkins.js` | `patient_checkin`, `patient_checkin_measurement`, `patient_checkin_adherence` |
| 013 | `013_audit.js` | `audit_log` |

Total: **59 tables** (incl. 8 reference-code tables). `schema_migrations` is created by the runner itself.

---

## 4. Models & Associations

13 model groups under `server/src/models/`, each mirroring its migration. `index.js` is the single registry where **every** association is declared centrally. Key conventions:

- **IDs:** internal `BIGINT.UNSIGNED` surrogate primary keys (never exposed). `session_token` unique (v4). `reference_number` is a `VARCHAR` with unique index (format `DK-2026-XXXXXX`); generation is deferred to the API phase.
- **Tenancy:** default `tenant` slug `dr-kareem`. `TENANT_SCOPED` list in `index.js` wires `belongsTo(Tenant)` / `hasMany` for all tenant-scoped tables. GLOBAL tables (no `tenant_id`): `question_catalog`, `assessment_definition`, `flag_rule`, `flag_rule_version`, all 8 `*_code` tables, `food_item`, `exercise_item`, `video_meeting_provider`, `platform_setting`, `feature_flag`. No RLS / partitioning (documented application-layer guarantee).
- **Immutable tables** (`created_at` only, no `updated_at`): `assessment_snapshot`, `assessment_answer`, `flag_rule`, `flag_rule_version`, `audit_log`.
- **Code tables** (GLOBAL bilingual labels): `name_ar`/`name_en` + `code` unique; referenced from data tables by stable string code with `targetKey: "code"`.
- **Provenance:** every durable clinical row carries `basis`, `confirmed_by`, `source_session_id` per architecture §1 (patient-reported vs doctor-confirmed). Profile writes are restricted to the doctor-review step in the future API phase.
- **Phones:** stored twice — `phone_canonical` (canonicalized Egyptian number, never unique) and `phone_display` (verbatim user entry) via `src/config/phone.js`.
- Audit has no associations (generic, §23).

---

## 5. Seed Data (idempotent, single-source)

`scripts/seed.js` reads the **same frontend files the UI renders** through the ESM loader hook, and upserts by natural key (idempotent, safe to re-run):

1. **Tenant + doctor:** `tenant(slug=dr-kareem)`; `doctor` from `CLINIC.email` with canonicalized `CLINIC.phones[0]`.
2. **Reference codes:** `relationship_code` (Q01_02 options), `goal_code` (Q03_01), `diet_pattern_code` (Q08_04), `reaction_code` (Q08_02), `severity_code` (Q08_03), `condition_code` (Q08_01) — all built from `questions.js` option arrays; plus static `appointment_status`, `service_status`.
3. **Assessment definition v1.0** `code=nutrition-assessment`, status `published`, `is_active=true`:
   - `question_catalog`: **105 rows** = 93 raw (`QUESTIONS_RAW`, sections 1–9) + 9 contact (C01–C09, section 0) + 3 Q10 consents (Q10_01–03, section 10, labels from `assessmentAr.safety.ack*`).
   - `question_version_cfg`: same 105, with bilingual labels/help/placeholder/options/validation/conditional copied verbatim.
4. **Flag rules:** RU1–RU9 (urgent) + RS1–RS14 (standard). **RS5/RS6 are INERT** (BMI/underweight are informational only, never routing) — seeded `active=false` with an inert bilingual message and empty refs so the RS numbering stays complete. `flag_rule_version` v1.0 rows carry `trigger_json {source, ruleId, inert, semantics}` and the frontend `refs` + `message.ar/en`.
5. **Services:** 3 categories (`core`, `weight-management`, `health-conditions`) + 6 services with bilingual name/body taken from `src/locales/{ar,en}.js` `services.groups`.
6. **Clinic info:** from `CLINIC` (address, phones canonicalized, email). `working_hour` intentionally left **empty** — no approved hours exist in frontend/spec.
7. **Platform settings:** `assessment_version_active=1.0`, `pregnancy_visibility_rule={minAge:12,maxAge:55}`, `draft_retention_days=30` (unenforced, §9), `contact_preference_default=whatsapp`.
8. **Feature flags (all `enabled=false`):** `video_conferencing_enabled`, `appointment_booking_enabled`, `online_payments_enabled`, `checkin_enabled`, `plan_generation_enabled`.
9. **Thin catalogs:** `video_meeting_provider` (Daily.co), 10 `food_item`, 5 `exercise_item` sample rows.

**Not seeded:** `working_hour`, patients, users/auth, check-ins, appointments, and all business rows (Phase 1 has no patients). No clinical data is fabricated.

---

## 6. Consistency Verification

`scripts/verify-assessment-consistency.js` is a read-only gate that compares the seeded DB against the frontend single-source files:

- Loads `QUESTIONS`/`QUESTIONS_RAW` (93+9), `FLAG_RULES`, and `assessment.{ar,en}` via the ESM loader — the same files the UI renders.
- Checks `question_catalog` count (105) + section/type/dataPath; `question_version_cfg` labels, required, options, help; `flag_rule` tier/active + `flag_rule_version` v1.0 messages/refs; RS5/RS6 present and `active=false`.
- **Exit codes:** `0` consistent · `1` any mismatch (hard fail) · `2` DB unreachable.

---

## 7. Run Commands

```bash
cd server
npm install
npm run db:migrate        # node scripts/migrate.js
npm run db:seed           # node scripts/seed.js
npm run db:verify         # node scripts/verify-assessment-consistency.js
npm run db:migrate -- --status
npm run lint              # oxlint (0 warnings / 0 errors as built)
```

Frontend: `npm run build` + `npm run lint` in the repo root (passes as built).

---

## 8. Deviations & Deferred Items (explicit, no silent invention)

| Item | Status |
|---|---|
| `working_hour` | Left empty — no approved hours in frontend/spec |
| `draft_retention_days` / erasure (§9) | Policy stored as a setting; **unenforced** until ratified |
| Growth percentiles | Not modeled (spec §6 excludes routing on growth) |
| `reference_number` generation | Column + unique index only; generation deferred to API phase |
| Cross-tenant reference protection | App-layer guarantee (Phase 2), not FK |
| Flag derivation algorithm | NOT implemented — flags are catalog/storage only in Phase 1 |
| RS5/RS6 | Seeded inactive/inert to keep RS numbering complete |
| `patient_contact` GLOBAL vs tenant | GLOBAL (no tenant_id) per architecture — shared reference person pool |

---

## 9. Quality Gates (verified as built)

- `node --check` on all `server` scripts/models/migrations: pass.
- `npx oxlint src scripts` (server): **0 warnings / 0 errors**.
- Root `npm run build` (Vite): pass (93 modules).
- Root `npm run lint` (oxlint): **0 warnings / 0 errors**.
- ESM loader load-test: `QUESTIONS_RAW=93`, contact=9, Q10=3 → **105 catalog rows**, no duplicate ids, seed/verify compositions identical.
- End-to-end seed/verify against a live MySQL could not run locally (no MySQL server in this environment); scripts are load-tested and checksum-stable.
