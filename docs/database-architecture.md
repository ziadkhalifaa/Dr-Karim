# MySQL Database Architecture Specification — FINAL (Review Resolutions + Future-Ready Expansion)

**Project:** Dr. Kareem Eliethy — Clinical Nutrition Platform
**Phase:** Database — DISCOVERY & SPECIFICATION ONLY (final review complete)
**Status:** Resolutions marked **`APPROVED`**. Unresolved policies marked **`DECISION REQUIRED`** — none are silently invented.
**Part II:** Approved future-ready expansion (Exercise Plan, Patient Check-in/Progress, Live Sessions, Video-provider abstraction, Weekly Follow-up, Doctor session notes) — architecture-level only, **not implemented**.
**Source of truth:** `docs/assessment-spec.md` (approved).
**Target:** Hostinger Business Node.js Web App · Node.js + Express + MySQL 8+ · single RDBMS.

> Legend: ✅ **APPROVED** = decision locked for this phase. ⚠️ **DECISION REQUIRED** = needs an authoritative policy/owner before production SQL.

---

## 0. Locked Guardrails (unchanged, enforced)

- Assessment = data-collection tool → `Layer → Assessment → Profile → Safety → Doctor Review → Nutrition Plan`.
- **No diagnosis/prescribing/treatment recommendation.** Flags are routing metadata only.
- **Tiers: STANDARD / URGENT only. No Medium.** BMI and growth percentiles **never** route. **RS14 cortisone = STANDARD.**
- **Patient ≠ contact person (CL17).** `someone_else` does **not** imply child.
- Submitted assessments are **immutable**; answers auditable and re-derivable.

---

## 1. Patient-Reported vs Doctor-Confirmed — ✅ APPROVED

**Principle (locked):**
> Raw `assessment_answer`s are the **immutable source of truth for what the patient reported during that specific assessment.** They are **not** automatically the current clinical truth.

Provenance model — every durable clinical row carries its own basis; raw answers are never overwritten by the profile:

| Data | Durable representation | Basis semantics |
|---|---|---|
| Medical conditions | `patient_condition` | `basis='patient_reported'` → becomes `'doctor_confirmed'` only via review (`confirmed_by`, `confirmed_at`) |
| Allergies / intolerances | `patient_allergy` | same `basis` + `reaction_code`, `severity_code` |
| Medications / supplements / herbal / steroids | `patient_medication` | same `basis`, plus `active_to` for current meds |
| Pregnancy | `patient_pregnancy_record` (date-range fact) | **only** created from an approved review; never auto-promoted from a session |
| Eating-disorder history / mental health | `patient_condition` codes (`eating_disorder`, `mental_health`) | `basis`; sensitive wording never implied as diagnosis from a selection |
| Measurements | `patient_measurement` with `measured_by ENUM('patient','doctor','clinic')` | patient-entered vs clinically measured |
| Laboratory values (e.g., HbA1c) | `patient_lab_value(patient_id, lab_code, value, unit, measured_on, basis, source_session_id)` | patient-reported value stays; doctor-confirmed flag when re-checked |
| Acute symptoms / weight-change events / bariatric history / growth concerns | **session-scoped only** (kept in snapshot + reviewed by doctor) | transient clinical context; not durable profile facts |

Enforcement rule: **profile writes happen ONLY in the doctor-review "confirm/update profile" step (§13).** No other code path writes the durable bucket. This eliminates duplication of the same clinical truth in two writable places.

---

## 2. Assessment Answers vs JSON Snapshot — ✅ APPROVED (hybrid)

| Store | Role | Source of truth for |
|---|---|---|
| `assessment_answer` rows | **Normalized canonical answers** (one row per `question_code`, scalar `stored_value` or `stored_array_json`) | querying, filtering, server-side flag derivation, drift-free analytics |
| `assessment_snapshot.full_payload_json` (+ `payload_hash`) | **Immutable submitted representation** | byte-faithful reconstruction, doctor display, audit, re-derivation baseline |

- **Canonical truth of content = `assessment_answer`** (normalized). **Exactness of the submitted artifact = `assessment_snapshot`**. Both are written once, atomically, at submit, must agree; `payload_hash` guards integrity.
- No giant-JSON-as-only-source. Rationale: rows keep clinical questions queryable/constrainable for reviews, routing and future panels; the snapshot preserves multi-select order and list-row structure exactly as submitted.

---

## 3. Assessment Flag Versioning — ✅ APPROVED

A flag must reconstruct the **interpretation that existed at submission**, not merely a mutable `rule_id`. Two-part design:

`flag_rule` (registry, mutable metadata) → `flag_rule_version` (immutable published rule: `version`, `tier`, `trigger_json`, `question_refs_json`, `message_ar/en`, `severity_config_json`, `published_at`, `effective_from/to`).

`assessment_flag` stores **context-carrying snapshot columns** (immutable at submit):
- `rule_id` + `rule_version_ref` (FK to `flag_rule_version`)
- `tier` (ENUM 'standard','urgent') — snapshot
- `message_ar_en` — snapshot (exact published wording)
- `question_refs_json` — snapshot
- `trigger_context_json` — the minimal subset of answers that fired the rule (enables exact re-explanation later)
- `status` (pending/acknowledged/reviewing/resolved/superseded), `created_at`, `reviewed_at`, `reviewed_by` (FK doctor)
- `session_id`

**Hard rules locked:** two tiers only · RU1–RU9 = urgent · RS1–RS14 = standard · RS14 cortisone = **STANDARD** · RU list per spec §6 · BMI/percentiles generate **no** flags.

---

## 4. Question / Assessment Versioning — ✅ APPROVED

Chain locked: `assessment_definition → question_version_cfg → assessment_session` (session FK to definition).

**Exactly what is versioned** (frozen per published definition in `question_version_cfg`):
- labels (AR/EN), help text, `required`, `sort_order`
- `options_json` (answer choice set: value + ar/en), `validation_json` (ranges/patterns), `conditional_json` (visibility/branch rules)

**Flag rules versioned independently** via `flag_rule_version`; a session stores the flag-rule version used at submit (§3).

**Protections against silent reinterpretation:**
- Submitted sessions are immutable and keep their original `assessment_definition_id` — display & derivation always use *that* definition.
- Drafts keep the definition id they started with — ✅ **APPROVED: no auto-migration/re-pointing of drafts on version bump** (safest; a future "new version available, restart draft" notice may surface drafts). Rationale: avoids silent re-interpretation of partially-answered questions.
- Retired questions: `active=0` only hides them in newer definitions; old rows/history remain.
- Version identity: semantic `version` (`1.0`, `1.1`, `2.0`), only one `active` definition.

---

## 5. Contact Person / Guardian — ✅ APPROVED

Model locked: **reusable identity + explicit relationship association**.

- `contact_person` = an identity only (name, phone, no patient FK) — **reusable across multiple patients** (one guardian managing several patients, or the same contact for a family). 
- New association table `patient_contact(patient_id, contact_person_id, relationship_code, is_guardian, is_primary, active_from, active_to, source_session_id)` — **relationship belongs to the association, not the identity**. One patient may have ≥1 contact; one contact person may serve ≥1 patient.
- `relationship_code` explicit (parent/grandparent/sibling/spouse/legal_guardian/other). `is_guardian` derived at intake as `someone_else ∧ minor` and confirmed/editable by the doctor at the confirm step.
- `self →` no association row required (patient is their own contact; logical identity, recorded in the session contact capture).
- `someone_else + adult → patient ≠ contact person`. `someone_else + minor → patient ≠ guardian/caregiver`. Locked: **`someone_else` never implies child**.

---

## 6. Phone / Email Uniqueness — ✅ APPROVED

**No global uniqueness.** Families share phones; a guardian manages multiple patients; patient and contact person may share a phone; future auth is not yet approved.

Constraints & indexes:
- `patient.phone` **indexed, non-unique**; `patient.email` **indexed, non-unique**.
- `contact_person.phone` **indexed, non-unique**.
- Session contact columns (handoff/patient phone, email) **indexed, non-unique**.
- No uniqueness on any phone/email anywhere in the schema.

### 6.1 Phone Normalization — ✅ RESOLVED (policy)

Target: **Egyptian numbers** (`+20` and local `01x`). Product rule (policy, not legal claim):

- **Every phone column stores a canonical value** (`phone_canonical`) + the **original display form** (`phone_display`) captured verbatim. Canonicalization happens **server-side at write time** — the UI never sends pre-normalized values.
- **Canonical form:** `+20` + national significant number, digits only, no punctuation/spacing. Local `01x…` (11 digits, starts `01`) → `+20` + remaining `1x…` (10 digits). Ambiguous/bad inputs are **rejected at intake with a validation error**, never silently rewritten.
- **Lookup/dedup keys on `phone_canonical`** (non-unique — §6); `phone_display` preserved for re-contact and patient-facing echo.
- **No global uniqueness; no E.164 enforcement on display.** The canonical value is for matching/search only; the original stays the source of truth for what the patient typed.
- **Non-Egyptian formats (future):** stored as canonical `+<cc>` if parseable by the same rule, else rejected. Scope creep deferred; Egypt-only for v1.

---

## 7. Multi-Tenancy — ✅ APPROVED (lightweight)

- `tenant` table; seed one default row. `tenant_id` FK on: `doctor`, `patient`, `contact_person`, `patient_contact`, `assessment_session`, `doctor_review`, `nutrition_plan`, `nutrition_plan_version`, `appointment`, `service`, `service_category`, `content`, `content_category`, `clinic_info`, `working_hour`.
- **Not tenant-scoped (shared global catalogs):** `question_catalog`, `assessment_definition`, `flag_rule`, `flag_rule_version`, all `*_code` reference tables. Rationale: questionnaires/rules/options are shared, versioned assets.
- **Boundaries enforced at application layer only** (all queries include `tenant_id`; API middleware scopes; FK cannot prevent cross-tenant refs). **No RLS. No partitioning.**
- Composite index ordering below always leads with `tenant_id` (§17).
- Cross-tenant reference protection: document verified at implementation as "every tenant-scoped entity FK resolves to an entity of the same tenant" — enforced by service code + tests, not by DB.

---

## 8. Soft Delete / History — ✅ APPROVED

| Class | Treatment |
|---|---|
| **Never hard-deleted** | `assessment_session`, `assessment_answer`, `assessment_snapshot`, `assessment_flag`, `assessment_definition`(archived), `question_version_cfg`, `flag_rule_version`, `doctor_review`, `doctor_review_event`, `patient_measurement`, `patient_goal_history`, `patient_lab_value`, `patient_pregnancy_record`, `audit_log` |
| **Soft delete / archive** | `patient`, `contact_person`, `doctor`, `nutrition_plan` (+ versions via status `archived`), `service`, `content`, `appointment`, `clinic_info` — via `deleted_at` and/or `status='archived'`; never removed (referential integrity + history) |
| **May be hard-deleted** | unsubmitted draft sessions (purge queue only), `platform_setting` rows, `feature_flag` rows, staging/cache rows — never clinical/history data |

Review objects (assessment/answers/flags/review/events/medical records/plans) are all in the first class. Purge/erasures require an approved retention + legal-erasure policy (§9).

---

## 9. Retention & Erasure — ✅ RESOLVED (product/policy proposal — ⚠️ legal review required)

> ⚠️ **This is a PRODUCT/POLICY proposal, not a legal opinion.** No GDPR/HIPAA/health-sector compliance is claimed. The retention periods and erasure scope below must be **validated by legal counsel before production**; until ratified **no number may be committed to code/SQL** (retention stays config-only, default zero enforcement).

### 9.1 Retention categories (config-driven defaults, unenforced until ratified)

| Category | Default proposal | Notes |
|---|---|---|
| Local browser draft (§11) | Purged with device data | Non-persistent by design; not a server record |
| Server draft (future, §11) | **30 days** from `last_saved_at` | Purge queue; only editable-but-unsubmitted drafts |
| Submitted assessment + answers + snapshot + flags | **Indefinite** | Medical/historical record; append-only (§8) |
| Doctor review + review events | **Indefinite** | Clinical decision trail |
| Patient profile + measurement/lab/pregnancy history | **Indefinite** (soft-archived when inactive) | Never hard-deleted (§8) |
| Contact data (phones/emails) | **Until consent is withdrawn** (§9.3) | Assessment/appointment contact purpose only |
| Audit log / event trace | **Indefinite** | Non-clinical attribution trail |
| IP origin (raw) | **30 days**, then hash/truncate at `/24`-level | Privacy-preserving default |

### 9.2 Right-to-erasure scope (product proposal)

- **Deletable now:** unsubmitted drafts (server + local). These can be purged without affecting any other row.
- **Erasable after legal sign-off (deferred):** submitted assessments/answers/snapshots/flags/reviews and their patient-profile projections. Proposal: **anonymize, never hard-delete clinical rows** — detach patient identity (null/randomize `patient_id` links to an anonymized placeholder), keep the review/history trace, block future linkage. Rationale: an answer row hard-deleted would orphan flag/review/snapshot integrity (§8 class-1 purity) and contradict the immutable-history principle.
- **Contact data:** hard-deleted per consent withdrawal unless clinical/operational retention legally requires keeping it (then archived anonymized).
- **Audit log:** immutable; never part of erasure (anonymized at identity level instead).
- Every erasure is an **auditable, reversible-by-policy** operation queue — never ad-hoc SQL.

### 9.3 Contact consent lifecycle (C09) — ✅ RESOLVED (policy)

- **C09 meaning:** the patient agrees to be **contacted about their assessment/appointment** (the minimum product need). It is **NOT marketing consent**; if marketing is introduced later it needs a **separate, explicit consent** record with its own purpose.
- **Server-side record at submit:** `consent_contact` (bool) + `consent_contact_at` (timestamp = submit time) + `consent_policy_version` (identifier of the copy/terms shown at that time). The screen captures only true/false; the DB stamps who/what/when.
- **Withdrawal:** `consent_contact_revoked_at` + optional recorded reason. **Withdrawal stops assessment/appointment contact only** — it does not stop legally-required or security contact, and it does not delete data (see 9.2).
- **Distinct purposes are distinct records.** One generic `consent` column is forbidden; purpose (`assessment_appointment` | future `marketing`) is part of the consent row. Revocation of marketing must not imply revocation of assessment-appointment, and vice-versa.
- **Renewal:** policy changes require **re-confirmation** (new stamped record); a hand-wave "still valid forever" assumption is not made.
- **No compliance certification is claimed** for how consent is recorded/withdrawn — product approach only.

---

## 10. Encryption / Sensitive Data — ✅ RESOLVED v1 (A baseline + B field list)

Sensitive categories: **PII** (names, phones, emails, contact capture, IP origin) · **PHI** (conditions, allergies, medications, pregnancy, eating-disorder/mental-health history, lab values, acute symptoms, measurement history, flag content, review notes).

### 10.1 v1 strategy — decided

**Layered: Option A is the mandatory baseline; Option B (app-level field encryption) is applied to a defined list.** Rationale: the target stack (MySQL Community on shared hosting) has **no native TDE** — DB-level "encryption at rest" cannot be relied on, so field-level encryption is the only self-contained guarantee for the highest-sensitivity free text.

- **(A) Baseline (always, no exception):** TLS in transit (client↔server and server↔MySQL); hosting/disk-level at-rest encryption where the provider makes it available (best effort, not the guarantee); least-privilege MySQL service accounts per feature; secrets only in env — never in repo/logs/statics; structured logs with PII/PHI fields redacted or omitted; no clinical content in routine logs.
- **(B) App-level field encryption (v1) for:** `assessment_snapshot.full_payload_json`, `doctor_review.notes`, `session_note.body` (+ its correction versions), and any free-text clinical note column (check-in notes, plan/exercise notes). These are high-sensitivity narrative blobs that are **not search keys** — full-column encryption is lossless there.
- **Deliberately NOT encrypted** at the field level (documented trade-off — under (A) access control + at-rest hosting): normalized `assessment_answer` rows, measurements, lab values, conditions/allergies/meds (they must remain queryable for flag derivation, doctor dashboards, dedup), and `phone_canonical`/`phone_display` (functionally required for contact re-outreach). Access to these is capped by the least-privilege accounts in (A).
- **Searchable-field handling:** only non-clinical keys are indexed — `session_token`, `reference_number` (both unique), `patient_id`. Encrypted narrative columns are **never indexed or used in WHERE/SQL text search**; all reads/writes go through the service layer only. No raw SQL may touch an encrypted column.
- **No compliance certification is claimed.**

### 10.2 Key management & rotation (v1 concept)

- **Envelope:** field encryption uses AES-256-GCM with a unique random nonce per value; ciphertext + nonce stored in the column; a `key_id` version column records which key encrypted each value.
- Master key lives in **env only** (HSM/KMS later); never in repo. Multiple envs (dev/stage/prod) have independent keys.
- **Rotation concept:** rotate = new master key under a new `key_id`; re-encryption runs **at the service layer** via a backfill job reading/writing through the API (never raw SQL); old `key_id` retained until all rows re-encrypted, then the old key is destroyed. DMA: reads are keyed by `key_id` so old rows decrypt during rotation.
- **Migration implications:** encrypted columns are added in the base migration but **populated via service-layer migration only**; no DB triggers/webhooks on them; existing prototype localStorage drafts are non-secrets (device-local) and migrate unchanged.

---

## 11. Draft / localStorage → Production — ✅ APPROVED (migration path)

- **Prototype (current):** browser `localStorage` under `drke.assessment.<sessionId>` — device-local draft only, explicitly documented in spec §11 as non-persistent.
- **Production (future):** drafts move to **server-side, authenticated storage**; only the authenticated user may resume their draft. `localStorage` **must not** become the permanent clinical record.
- **Submitted assessments always move to server-side persistence** (the `assessment_session` suite).
- Local drafts are advisory/disposable; clearing browser data loses only the local copy.
- No implementation now.

---

## 12. Patient History — ✅ APPROVED

```
Patient
├── Assessment Jan (immutable session)
├── Assessment Mar (immutable session)
└── Assessment Jun (immutable session)
        │ patient_session links each to the patient
        ▼   (only via review-confirm)
current profile (durable projections)
```

- **Current profile** = available set of **doctor-confirmed projections** (`patient_condition`with confirmed basis, confirmed allergies/meds, current `patient_measurement` rows, `patient_goal_history`, current pregnancy record). All carry `source_session_id`/`basis`/`confirmed_*`.
- **Historical sessions** = forever-unchanging answers/snapshots/flags; old weights, goals and medical answers are **never overwritten**.
- Profile is updated only at the review-confirm step; the latest confirmed projection coexists with full history. No in-place UPDATE of past context.

### 12.1 Minor / Adolescent Boundary — ✅ RESOLVED (policy interpretation of spec §17)

Product policy derived from the approved spec (carried from `assessment-spec.md` §17 open item). **No invented clinical thresholds; no automatic-age medical routing.**

- **Boundary (locked):** `minor = age < 18`. Terminologies follow spec §17: **child** (2–12), **adolescent** (13–17), **adult** (18+); infants (<2) follow the child path.
- **Adolescent path (13–17):** growth-aware questions co-exist with adult-style questions (per spec §17) — i.e. the session may surface growth items for 13–17 that a fully-adult session does not.
- **Adult path (18+):** adult-only measurements (e.g. neck/waist/hip Q02_03–05) are active; growth items shown for minors (e.g. growth concern Q02_07) are **not** shown.
- **Minor contact capture (any minor, self or `someone_else`):** a **responsible adult guardian/caregiver** is required in contact capture — the **contact person for a minor is the guardian/caregiver** regardless of whether the subject is self or someone-else (§7 CLI/CL17 relationship semantics). A minor is **not** their own contact person.
- **Growth percentiles: DECISION DEFERRED.** No percentile is computed or stored until an **approved clinical growth reference** exists; until then any growth concern is **doctor-reviewed** (flag RS9 STANDARD, §5), never auto-routed by age or by a self-invented threshold.
- **No automatic medical routing by age alone.** A minor answering an adult-only measurement item (if the UI erroneously allows it) is treated as **doctor-in-review**, not auto-corrected.

---

## 13. Doctor Review — ✅ APPROVED (formal, not a boolean)

Status machine (stored in `doctor_review.status`, history in append-only `doctor_review_event`):

`queued → assigned → in_review (opened) ⇄ needs_clarification → approved | rejected`

Fields: `doctor_id` (nullable until assigned; `assigned_at`), `opened_at`, `decided_at`, `decision`, `notes`, `summary_outline_json` (doctor-authored only — never auto-generated), `updated_at`. Events: `(from_status, to_status, actor_type, actor_id, note, created_at)`.

**Plan gating (locked):** `nutrition_plan.status` may become `doctor_review→approved→active` **only if** its linked `doctor_review.decision='approved'`. ⚠️ No boolean `reviewed` anywhere.

---

## 14. Nutrition Plan — FUTURE-READY, MINIMAL

Conceptual minimum (no over-modeling — food catalog requirements unknown):
- `nutrition_plan` (patient, linked `doctor_review`, primary goal, status `draft | doctor_review | approved | active | archived`, effective dates, doctor, timestamps)
- `nutrition_plan_version` (version_no, status, effective_from/to, targets_json, notes, created_by) — history, one active
- `meal_template` / `meal_item` (reference `food_item` codes + qty/unit/notes)
- `food_substitution` (source↔substitute, reason, active)
- `nutrition_plan_note` (author, note, created_at)
- `food_item` = thin catalog codes; expanded only when real catalog requirements are approved.
No plan generation — human review sign-off required. Not implemented now.

---

## 15. Appointments — FUTURE-READY

`appointment(tenant, patient, doctor, service_ref, type 'clinic'|'online', status 'pending'|'confirmed'|'completed'|'cancelled'|'no_show', scheduled_start_at, scheduled_end_at, duration_min, branch_ref, notes, confirmation_sent_at, deleted_at-soft)`. Status codes in catalog. No scheduling rules now.

---

## 16. Localization — ✅ APPROVED (three layers, unchanged)

| Layer | Used for | Why |
|---|---|---|
| **AR/EN bilingual columns** | `question_version_cfg` labels/help/options, `flag_rule_version` messages, tiny stable option catalogs (`relationship`, `goal`, …) | versioning requires **text-as-published** on immutable snapshot rows; tiny stable sets; join-free; seals historical wording (§4). This is the sanctioned `name_ar/name_en` case. |
| **Translation tables** (`service_translation`, `content_translation`, `service_category_translation`, `content_category_translation`) | authored/admin-managed content | narrow rows, add-locale friendly, `UNIQUE (entity_id, locale)`, efficient; avoids wide parallel columns on growing content. |
| **JSON locale files (i18n)** | UI strings, static copy, dynamic flag/emergency copy | front-end already uses it; DB joins would add nothing. Flag/emergency **published** wording lives in the versioned rule/definition rows for audit. |
| **Rejected** | parallel `name_ar/name_en` on high-volume operational tables (sessions, patients) | duplication without benefit; codes + translation layer instead. |

Guaranteed: old assessment wording reconstructable from `question_version_cfg` (definition-scoped), independent of any later catalog change.

---

## 17. Index Strategy — ✅ APPROVED (no over-indexing)

Principle: **tenant-leading composite indexes** for tenant-scoped access paths; single-column indexes only where a query is not tenant-scoped or the column is the sole filter.

| Query | Index |
|---|---|
| Patients by tenant | `(tenant_id, status)` |
| Patient lookup by phone/search | `patient.phone` (non-unique); optional `patient_contact.phone` via contact lookup |
| Sessions by patient | `assessment_session(tenant_id, patient_id, submitted_at)` — on `patient_session(patient_id, assessment_session_id)` |
| Sessions by status | `assessment_session(tenant_id, status, submitted_at)` |
| Pending doctor reviews | `doctor_review(tenant_id, status, assigned_at)` |
| Urgent assessment flags | `assessment_flag(tenant_id, tier, status)` + `assessment_flag(assessment_session_id)` |
| Appointments by doctor/date | `appointment(tenant_id, doctor_id, scheduled_start_at)` |
| Plans by patient/status | `nutrition_plan(tenant_id, patient_id, status)` |

Historical-lookup warmers: `assessment_session(session_token)` unique, `assessment_session(reference_number)` unique, `assessment_answer(session_id, question_code)` unique. Everything else derives from FKs already indexed. Add indexes only validated by real query plans in the next phase.

---

## 18. JSON Usage — ✅ APPROVED (classification)

| ✅ Allowed | ❌ Not allowed as a replacement for |
|---|---|
| Immutable `assessment_snapshot.payload_json` | `Patient`, `Doctor` |
| Row-list payloads with variable columns (`assessment_answer.stored_array_json`) | `AssessmentSession`, `AssessmentAnswer` |
| Flexible validation/conditional/options config (`question_version_cfg.*_json`) | `DoctorReview`, `AssessmentFlag` |
| Version/config snapshots (`flag_rule_version.trigger_json`, `nutrition_plan_version.targets_json`, `doctor_review.summary_outline_json`) | `NutritionPlan`, `Appointment`, `ContactPerson` |

Rationale: JSON only where the shape is variable, version-bound, or must be byte-faithful; anything queried/joined/referenced or needing integrity is a real column/table. A JSON blob must never stand in for an entity with FK relationships, statuses, or audit.

---

## 19. External / Internal IDs — ✅ APPROVED

| ID | Class | Exposure | Mutable? | Index |
|---|---|---|---|---|
| `BIGINT` surrogate PKs | internal | **never exposed** to browsers/APIs | never | PK/clustered |
| `session_token` CHAR(36) | federation id | internal but round-trips from the client; public until linked to a patient | never | unique |
| `reference_number` (`DK-2026-XXXXXX`) | public reference | shown to patient & staff | never | unique |
| `question_catalog.code`, `flag_rule.rule_id`, catalogs' `code`/`slug` | stable public codes | shown in logs/UI | never after first publish | unique |
| Operational columns (status, notes, …) | value, not identity | — | mutable by design | filtered |

Rules: never expose numeric PKs; reference number generated **server-side at submit**; IDs immutable once written.

---

## 20. Seed / Reference Data — ✅ APPROVED

Seed strategy (idempotent by natural key, version-aware, migration-safe):
- `tenant`: one default row (slug `dr-kareem`).
- `doctor`: Dr. Kareem Eliethy practice row.
- `assessment_definition` **v1.0** + `question_version_cfg` for every code in spec §3 (Q01_xx, Q03_L/G/M, Q04_D/IR/T/H/GI/P/E/MH/C, Q07/Q08, Q10_01–03 consents, C01–C09) — labels, validation, conditional, options **frozen**; source = approved spec + `src/features/assessment` data/localization (single-source check).
- `flag_rule` + `flag_rule_version` **v1.0**: RU1–RU9 (urgent), RS1–RS14 (standard); **RS14 = STANDARD**; no Medium.
- Reference codes: `relationship_code`, `goal_code`, `diet_pattern`, `reaction_code`, `severity_code`, `condition_code`, `appointment_status`, `service_status`.
- `platform_setting` / `feature_flag`: e.g. `assessment_version_active`, `pregnancy_visibility_rule`, `draft_retention_days` (default 30 — §9 policy proposal; number unenforced until ratified).
- Seeding is done **in a separate seed phase** (never inside structural migrations), `ON DUPLICATE KEY`-safe; no clinical rule is hardcoded in random app files — rules live in versioned reference data (`flag_rule_version`, `question_version_cfg`).

---

## 21. Migration Strategy — ✅ APPROVED (no migrations generated)

- **Forward-only** numbered migration files, committed, executed once (recorded in `schema_migrations` by name+checksum).
- **Ordering:** strict sequence; each migration must be backward-compatible with the running app (additive columns/tables first, backfill, then constraints/indexes).
- **Seed separation:** structural migrations ≠ seed phase (see §20) — prunes risk when re-deploying.
- **Rollback philosophy:** applied migrations are **not** destroyed/reverted; corrections are forward corrective migrations. Pre-release testing validates roll-forward.
- Applied before traffic on Hostinger; run by the deploy pipeline.

---

## 22. Final Architecture Check (self-review results)

- Resolved decisions are stamped `APPROVED` above; unresolved policy items stay `DECISION REQUIRED` (never invented).
- Contradictions removed: `patient.contact_person_id` column superseded by the `patient_contact` association (§5); review `doctor_id` nullable pre-assignment (§13); ack data kept as session columns + snapshot (no duplicate table); phone/email uniqueness removed (§6); per-entity `basis` now uniform (§1).
- Terminology normalized: session / definition / `question_version_cfg` / `flag_rule_version` / `patient_contact`.
- Patient-reported vs doctor-confirmed applied consistently across every clinical entity (§1).
- Tenant boundaries + tenant-first index ordering consistent (§7, §17).
- Versioning consistent; **historical reconstruction guaranteed** (definition-scoped frozen config + flag-rule version snapshot + immutable flag context + immutable answers/snapshot; §2–§4).
- No clinical rule silently invented; all rule content traces to the approved spec.
- Part II expansion (§25–§37) is consistent: new entities follow the same `tenant_id` (§7), history/soft-delete classes (§8), security (§10), tenant-first index (§17) and versioning conventions; **no new routing tiers or automated treatment logic introduced.**

---

## 23. Intake Mapping (unchanged, retained)

| Storage payload (spec §7) | Target |
|---|---|
| `meta.sessionId` | `assessment_session.session_token` |
| `meta.assessmentVersion` | resolves → `assessment_definition.version` |
| `meta.language/status/referenceNumber/timestamps` | session columns (reference number re/set server-side at submit) |
| `subject` | `assessment_session.subject` |
| `patient{…}` | session/derived columns + snapshot; promoted to `patient` only at review-confirm |
| `measures`/`goals`/`lifestyle`/`preferences`/`eating`/`medical`/`medications` | raw kept in snapshot; keys → derived columns; `answers` → `assessment_answer` |
| `answers{}` | `assessment_answer` rows + `full_payload_json` + `payload_hash` |
| `flags[]` | server re-derivation → `assessment_flag` (+`flag_rule_version`); client copy retained in snapshot for diff |
| `acknowledgements{}` | session `ack_*` columns + snapshot |
| `contact{}` | session contact columns; promoted to `patient` / `contact_person`/`patient_contact` at review-confirm |
| `derived{bmi, overallTier,…}` | `derived_bmi`, `overall_tier` (audit; re-derived on demand) |

---

## 24. Scope Boundaries

No SQL, models, migrations, APIs, auth, dashboards, payments, plan generation, or backend code. Landing Page and approved Assessment frontend untouched. The **Part II** domains below are architecture-only and are **not implemented** in this phase.

---

# PART II — APPROVED FUTURE-READY EXPANSION (specification only, not implemented)

Applies the same conventions as Part I: surrogate PKs, `tenant_id`, tenant-first indexes, immutable history, versioning, JSON policy, APPROVED/DECISION REQUIRED marking.

## 25. Overall Product Workflow — ✅ APPROVED (architecture)

```
Assessment (episodic)
  → Safety (flags → routing only)
  → Doctor Review (clinical approval gate)
  → Nutrition Plan + Exercise Plan
  → Patient Check-in (recurring, lightweight)
  → Appointment (booking)
  → Live Session (delivery)
  → Session Notes
  → Plan Adjustment → New Plan Version
  → Next Follow-up
```

**Locked semantics:**
- **Assessment is episodic** (onboarding/episodic clinical intake) — not repeated every week.
- **Check-in is recurring/lightweight** — a progress mechanism, **not a new assessment** (§27).
- **Doctor Review remains the clinical approval gate** for any clinical plan.
- **Plan changes create new versions**; **history is never overwritten** (§32).
- **No automatic diagnosis or treatment decision** is introduced anywhere.

## 26. Exercise Plan — ✅ APPROVED (v1 scope, lightweight catalog)

Conceptual entities:
- `exercise_plan` (patient, doctor, linked `doctor_review`, primary goal, status `draft | doctor_review | approved | active | archived`, effective dates, timestamps) ✅ **AP-7 tenant**
- `exercise_plan_version` — **stores the prescribed details per plan**: `sets`, `reps`, `duration`, `frequency`, `rest`, `notes` (+ status, `effective_from/to`, reviewer, `source_review_id`, `source_session_id`, created_by, created_at) — one active per plan; history preserved
- `exercise_item` — **lightweight v1 catalog row**: stable `code`, `name_ar`, `name_en`, `category_code`, `description`, `instructions`, `active/inactive`. **No invented medical contraindications, no MET/physiology columns.**
- `exercise_substitution` (source_item, substitute_item, reason, active)
- `exercise_plan_note` (author_type doctor/patient, note, created_at)

**v1 boundary:** no massive exercise library. The catalog is deliberately thin; it can be extended later via reference data/seed — not by inventing clinical metadata now.

Requirements: versioned, patient-linked, doctor-linked, review/approval-aware, historical versions preserved (never overwritten) — identical guarantees to §13/§14 plan gating.

## 27. Patient Check-in / Progress — ✅ APPROVED (no mandatory doctor review)

**Not a new assessment.** Recurring follow-up data between assessments. Insert-only history — previous check-ins are never overwritten.

- `patient_checkin` (tenant, patient, `checkin_on`, `weight_kg`, optional standard measures, `nutrition_adherence`, `exercise_adherence`, patient_note, `status ENUM('submitted','reviewed')` default **`submitted`**, `submitted_at`, reviewed_by doctor nullable, reviewed_at nullable, doctor_note nullable, created_at)
  - **Context links (snapshot semantics):** `context_assessment_session_id` (last/reference assessment), `context_nutrition_plan_version_id`, `context_exercise_plan_version_id` — the plan/version ids **active at the check-in date**, stored for accurate historical context (never "the current version").
- `patient_checkin_measurement` (checkin_id, measure_code, value, unit, taken_by `patient|doctor|clinic`) — generic row-per-measure.
- `patient_checkin_adherence` (checkin_id, dimension `nutrition|exercise|sleep|stress`, scale_value, note) — optional normalization; scale is **patient-reported, configurable reference codes** (bilingual labels are product copy, not a schema decision).

**Workflow (locked):** patient submits check-in → **stored** → **visible to the doctor**. The doctor may: take no action, add a note, adjust a plan, or request a follow-up. **Routine check-ins do NOT require a formal doctor review by default.**

**Future routing:** if an *approved* safety/routing rule set detects something requiring attention, a check-in may be routed for doctor review — **no clinical thresholds are invented now.**

## 28. Appointment vs Live Session — ✅ APPROVED (separate lifecycles, never merged)

- `appointment` = **booking/scheduling lifecycle** — statuses: `pending | confirmed | cancelled | completed | no_show`.
- `live_session` = **actual live consultation delivery lifecycle** — statuses: `not_started | waiting | active | ended | failed`; fields `appointment_id` (1:0..1), patient, doctor, `scheduled_at`, `started_at`, `ended_at`, `duration_actual_sec`, provider-neutral `room_ref`, `meeting_id`.
- **An appointment may be confirmed while a live session fails** — the two state machines are independent and must not be merged.

## 29. Video Provider Abstraction — ✅ APPROVED (Daily is an integration; default NO recording)

- `video_meeting_provider` (catalog): code `daily` (future others), name, enabled.
- `video_meeting` (core, provider-neutral): provider_id FK, `external_room_ref`, `external_session_ref`, status `pending | created | started | ended | failed`, `started_at`, `ended_at`, `duration_sec`, and only **necessary technical metadata**.
- **`DailyProvider` = backend integration layer implementation** — no Daily-specific fields inside `Patient`, `Doctor`, `Appointment`, `NutritionPlan`, `ExercisePlan`, or other core entities. **Daily remains replaceable.**
- Daily-specific credentials/tokens are **ephemeral, issued by the backend at join time — never stored as permanent patient data.** Short-lived meeting access is handled by the backend/integration layer (documented; not implemented).
- **Recording: default NO recording.** Only the minimum metadata above is stored. Recording, if introduced later, is a **separate gated feature** requiring its own approval: explicit consent, retention policy, access control, and storage architecture — never assumed or implied by this schema.

## 30. Weekly Follow-up — ✅ APPROVED (resolved)

- **Default cadence: 7 days** (business-rule/config; `platform_setting`/`feature_flag` e.g. `followup_default_cadence_days = 7`).
- **Per-patient cadence override: allowed** (nullable `followup_cadence_days` on the patient).
- **No recurring scheduling engine in the first implementation.**
- After a completed live session: the system **calculates/suggests the next follow-up date** and **creates a proposed/draft appointment**; the **doctor and/or patient confirms it**. The system does **not** automatically create an unlimited recurring series.

## 31. Doctor Session Notes / Clinical Follow-up Notes — ✅ APPROVED (resolved)

- `session_note` (a.k.a. `clinical_followup_note`): patient, doctor, `appointment_id` (0..1), `live_session_id` (0..1), `visibility ENUM('doctor_private','patient_visible')`, body, created_at.
- **Default visibility: `doctor_private`.** A note is **not visible to the patient unless the doctor explicitly marks it `patient_visible`**.
- **Immutable / correction-aware:** notes are **append-only** and are never silently overwritten. A correction creates a **new note version/event linked to the original**; the original note remains preserved.

## 32. Plan Adjustment History — ✅ APPROVED (explicit)

- `Nutrition Plan v1 → review → Nutrition Plan v2` and `Exercise Plan v1 → review → Exercise Plan v2`.
- Each version preserves: `created_by` (author), doctor/reviewer, `source_review_id` (doctor_review), `source_session_id` (assessment), `created_at`, `effective_from/to`, approval status.
- **Previous plan versions are never overwritten** — adjustments always create new versions (both nutrition and exercise). A single review/session may spawn both a Nutrition v2 and an Exercise v2.

## 33. New Future Entities & Relationships — SUMMARY

New (concept-level, see §26–§31): `exercise_plan`, `exercise_plan_version`, `exercise_item`, `exercise_substitution`, `exercise_plan_note`, `patient_checkin`, `patient_checkin_measurement`, `patient_checkin_adherence`, `live_session`, `session_note` (`clinical_followup_note`), `video_meeting`, `video_meeting_provider`. `appointment` and `nutrition_plan` remain.

```
doctor 1──N─ exercise_plan 1──N─ exercise_plan_version 1──N─ exercise_item
              (plan ↔ doctor_review/assessment source context)
patient 1──N─ patient_checkin ──0..1 context: assessment_session | nutrition_plan_version | exercise_plan_version
appointment 1─0..1─ live_session 1─0..1─ video_meeting N─1─ video_meeting_provider (Daily)
doctor 1──N─ session_note ──0..1─ (appointment | live_session) ; patient
```

## 34. Hosting / Technology Constraints — ✅ APPROVED (Part II)

MySQL 8+, **single RDBMS**, Hostinger Business Node.js Web App. **No Redis**, no separate video database, no microservices. Meeting/session/check-in metadata all live in MySQL. Daily.co remains an external integration that the backend adapts to.

## 35. Part II Consistency Checklist

- `tenant_id` + tenant-first indexes on every new ownership entity (§7/§17).
- History classes: check-ins, session notes (+ correction versions), plan/exercise versions, live sessions → **never hard-deleted**; plans/appointments → soft archive (§8). Retention categories per §9 (product proposal; enforce only after legal ratification).
- Security: notes, check-ins and session/meeting metadata are PHI — covered by §10 requirements.
- JSON usage follows §18 (version/technical metadata only; entities remain relational).
- Routine check-ins are not gated on a doctor review by default (§27); recording defaults to NO (§29).
- **No new routing tiers; no automated treatment/AI plan logic added anywhere.**

## 36. Remaining DECISION REQUIRED (truly unresolved policy only)

The six business decisions (§26–§31) **and** the five policy decisions (§6.1 phone normalization, §9 retention/erasure + §9.3 consent lifecycle, §10 encryption v1, §12.1 minor/adolescent boundary) are **RESOLVED and stamped APPROVED** and are no longer "decision required" items. Only the following remain open:

1. ⚠️ **LEGAL REVIEW REQUIRED:** §9 retention periods, §9.2 erasure/anonymization scope, and any GDPR/HIPAA/health-sector compliance claim — the product/policy proposal needs counsel validation before any number is enforced in code/SQL. **Blocking** for production retention enforcement; **non-blocking** for schema design.
2. **Non-blocking product item (not a schema decision):** delivery/notification UX for `patient_visible` session notes (how and when the patient receives them).
3. **Recording (deferred by design):** intentionally not a decision now — a future gated feature requiring its own approval (consent / retention / access / storage).
4. **Non-blocking product item:** approval of a clinical growth-reference source before any percentile computation is enabled (§12.1).

## 37. Recommended Implementation Order (full, updated)

1. Baseline schema (tenant, people, session/answer/snapshot/flags, versioning, settings, audit)
2. Catalog + v1.0 seed
3. Intake (+server-side submit & references)
4. Server-side flag derivation
5. Review + confirm-profile promotion
6. Services / content / settings / appointments
7. Live sessions + video-provider integration boundary + session notes
8. Nutrition plan
9. Exercise plan
10. Patient check-ins / progress
11. Weekly follow-up automation (suggest next date + draft appointment; **after §9 retention policy is ratified**)
12. Auth / roles / tenancy runtime enforcement

---

**STOP — all six business decisions AND the five policy decisions are resolved and stamped APPROVED. Remaining DECISION REQUIRED items are legal review (retention/erasure validation), non-blocking product UX (note delivery, growth reference), and deferred recording.**

---

## Appendix — Cross-Document Consistency Audit (`assessment-spec.md` ↔ `database-architecture.md`)

Performed after the five policy resolutions. Terminology/decisions checked both ways; **the assessment spec was treated as the approved source of truth and was NOT modified** — the DB doc is updated only where it encodes a policy interpretation.

| # | Audit item | Result | Detail |
|---|---|---|---|
| 1 | **Terminology: assessment session (spec) vs DB entity** | ✅ Consistent | Spec `AssessmentSession` ↔ DB `assessment_session` suite (§2/§3); question codes Q01/Q02/… ↔ `assessment_answer.question_code`; no drift introduced. |
| 2 | **patient vs contactPerson (CL17)** | ✅ Consistent | Spec `patient.name` / `contact.person` ↔ DB `patient` / `contact_person`. §12.1 strengthens: for a minor the contact person is the guardian/caregiver — this is the approved CL17 reading, not a contradiction. |
| 3 | **self vs someone_else** | ✅ Consistent | Subject semantics unchanged; §12.1 only adds guardian requirement for minor subjects (self or someone_else), consistent with spec §17. |
| 4 | **minor/adolescent terminology (§17)** | ✅ Consistent | Spec defines child/adolescent/adult + growth-path open item. DB §12.1 **locks** `minor = <18`, maps terms exactly, defers percentiles. No spec change; DB records the interpretation. |
| 5 | **C09 contact consent** | ✅ Consistent (additive) | Spec C09 = boolean "agree to be contacted"; DB §9.3 adds server-side timestamp/version/purpose and withdrawal — additive metadata, does not change what the screen means or collects. |
| 6 | **Phone normalization** | ✅ Consistent (additive) | Spec stores raw phone as entered; DB §6.1 canonicalizes at write for lookup/dedup while preserving display. No spec contradiction; scope added server-side only. |
| 7 | **BMI informational-only prohibition** | ✅ Consistent | Spec: BMI never routes. DB: no BMI routing flag/rule exists; confirmed in §5 guardrail. No percentile or BMI route added anywhere. |
| 8 | **RS14 cortisone = STANDARD** | ✅ Consistent | Spec RS14 STANDARD; DB §5 seed maps RS14 → STANDARD; no change. |
| 9 | **tenant_id boundaries** | ✅ N/A (spec silent) | Spec has no tenancy notion; DB §7 imposes `tenant_id` on ownership entities only. No conflict; additive. |
| 10 | **Doctor review gates plan approval** | ✅ Consistent | Spec: no plan before doctor review. DB §13 gating (`nutrition_plan` active requires `doctor_review.decision='approved'`) implements it; check-ins default no-review (§27) does not contradict — spec never required review on check-ins. |
| 11 | **Immutable assessment history** | ✅ Consistent | Spec: answers immutable post-submit. DB §8 class-1 never-hard-delete + §12 no in-place UPDATE. §9.2 erasure **anonymizes** rather than hard-deletes clinical rows — preserves this invariant. |
| 12 | **Retention/erasure assumptions** | ✅ No spec conflict | Spec has no retention policy; §9 is a new product proposal, flagged for legal review, numbers unenforced until ratified — cannot contradict the spec, and explicitly keeps draft-30d aligned with spec §11 local-draft copy. |
| 13 | **Encryption vs logging/notes** | ✅ Consistent | §10 field-encryption list (`session_note.body`, `doctor_review.notes`, `assessment_snapshot`) matches where PHI free-text lives in both docs; no raw-SQL/index on those columns. |
| 14 | **Cross-cutting prohibition re-check** | ✅ Clean | No routing by age alone, no invented growth percentiles, no marketing consent implied, no TDE-only assumption, no compliance claim anywhere. |

**Audit outcome:** no contradictions found. All differences are additive (server-side metadata/canonicalization) or explicit policy interpretations recorded in the DB doc and flagged for legal/product confirmation where required.