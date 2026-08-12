# Backend Assessment API — Phase 2 Implementation

**Project:** Dr. Kareem Eliethy — Clinical Nutrition Platform
**Phase:** 2 — Backend Core + Assessment Intake
**Base path:** `/api/v1/`
**Auth:** None yet (tenant via `X-Tenant-Slug` header; default `dr-kareem`)

---

## 1. Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check (DB connectivity) |
| POST | `/api/v1/assessment/submit` | Submit assessment (atomic) |
| * | `/api/v1/doctor-review/*` | 501 Not Implemented |
| * | `/api/v1/patients/*` | 501 Not Implemented |
| * | `/api/v1/services/*` | 501 Not Implemented |
| * | `/api/v1/appointments/*` | 501 Not Implemented |

---

## 2. Request Format — `POST /api/v1/assessment/submit`

Headers:
```
Content-Type: application/json
X-Tenant-Slug: dr-kareem          # optional, default
X-Request-Id: <uuid>               # optional, generated if absent
```

Body (JSON):
```json
{
  "meta": {
    "sessionId": "uuid-v4",                // client-generated, used for idempotency
    "assessmentVersion": "1.0",            // MUST match active definition version
    "language": "ar",                      // "ar" or "en"
    "startedAt": "2026-01-01T00:00:00.000Z",
    "lastSavedAt": "2026-01-01T12:00:00.000Z"
  },
  "answers": {                             // flat map: question_code → value
    "Q01_01": "self",
    "Q01_03": "Ahmed Ali",
    "Q01_04": 30,
    "Q01_05": "male",
    "Q02_01": 175,
    "Q02_02": 70,
    "Q03_01": "maintain_weight",
    "Q04_01": "no",
    "Q04_04": "stable",
    "Q04_E1": "never",
    "Q05_01": "no",
    "Q05_06": "never",
    "Q06_05": 7,
    "Q08_01": "no"
  },
  "contact": {
    "patientName": "Ahmed Ali",
    "contactPerson": {                     // required when someone_else OR minor
      "name": "Parent Name",
      "relationship": "parent"             // must be guardian for minors
    },
    "handoffPhone": "01012345678",         // Egyptian local or +20
    "patientPhone": "01112345678",         // optional
    "preference": "whatsapp",              // whatsapp | call | both
    "email": "patient@example.com",        // optional
    "bestTime": "afternoon",               // optional
    "consent": true                        // REQUIRED
  },
  "acknowledgements": {
    "accurate": true,                      // REQUIRED
    "noDiagnosis": true,                   // REQUIRED
    "urgent": false                        // REQUIRED when any URGENT flag exists
  }
}
```

**Notes:**
- `meta.assessmentVersion` must be exactly `"1.0"` (the seeded definition version).
- `answers` contains ONLY section 1–9 question codes (C01–C09 and Q10 are in `contact`/`acknowledgements`).
- `sessionId` is the idempotency key; duplicate → 409 `DUPLICATE_SUBMISSION`.
- Client `flags`, `derived`, `referenceNumber` are **ignored**; server derives authoritatively.

---

## 3. Response Format

Success (201):
```json
{
  "success": true,
  "data": {
    "referenceNumber": "DK-2026-K2M3P4",
    "overallTier": "urgent" | "standard" | null,
    "reviewState": "queued",
    "nextStep": {
      "ar": "تم استلام تقييمك وسيتم مراجعته بأسرع وقت من قبل الطبيب.",
      "en": "Your assessment was received and will be reviewed by the doctor promptly."
    }
  },
  "requestId": "uuid",
  "timestamp": "2026-01-01T12:34:56.789Z"
}
```

`overallTier` values:
- `"urgent"` — at least one URGENT (RU) flag fired
- `"standard"` — only STANDARD (RS) flags fired
- `null` — no flags fired (standard queue behavior)

Error (4xx/5xx):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Assessment validation failed",
    "details": [
      { "code": "Q01_03", "field": "answers.Q01_03", "message": "Required answer missing" }
    ]
  },
  "requestId": "uuid",
  "timestamp": "..."
}
```

Common error codes:
| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 422 | Answers/contact/acks invalid |
| `UNKNOWN_QUESTION` | 422 | Question code not in definition |
| `NOT_VISIBLE_QUESTION` | 422 | Answer submitted for non-visible question |
| `INVALID_ANSWER` | 422 | Value fails type/range/choice check |
| `REQUIRED_MISSING` | 422 | Required/conditionally-required answer absent |
| `ASSESSMENT_VERSION_MISMATCH` | 409 | `meta.assessmentVersion` ≠ active definition |
| `DUPLICATE_SUBMISSION` | 409 | `sessionId` already submitted |
| `TENANT_NOT_FOUND` | 404 | `X-Tenant-Slug` unknown |
| `NOT_IMPLEMENTED` | 501 | Domain endpoint not built yet |
| `DB_UNAVAILABLE` | 503 | MySQL connection failed |

---

## 4. Validation Rules (Server-Side Authoritative)

### 4.1 Answers
- Unknown question codes → rejected (`UNKNOWN_QUESTION`).
- Non-visible questions answered → rejected (`NOT_VISIBLE_QUESTION`) — **anti-bypass**.
- Type/range/choice validation per frozen `question_version_cfg`:
  - `single`: value ∈ options values
  - `multi`: array ⊆ options values
  - `number`: within `validation.min/max`
  - `date`: ISO ≤ today
  - `text`/`textarea`: length min/max
  - `phone`: Egyptian canonicalization
  - `email`: RFC-5322-ish
  - `scale`: integer within min/max
  - `list`: array of row objects; required columns present; reaction ∈ options
  - `toggle`: boolean
  - `consent`: `true`
- Required (`*`) always required; conditional (`c`) required when visible.

### 4.2 Contact (CL17 + §12.1)
- `patientName` (C01): 2–100 chars, required.
- `consent` (C09): `true`, required.
- `handoffPhone` (C04): required, Egyptian phone canonicalized.
- `subject = someone_else`:
  - `contactPerson.name` (C02) required 2–100
  - `relationship` (C03) ∈ {parent, grandparent, sibling, spouse, legal_guardian, other}
- **Minor (age < 18, ANY subject)**:
  - `relationship` MUST be guardian ∈ {parent, grandparent, legal_guardian}
- Phones canonicalized: local `01x…` → `+20…`; international `+20…` preserved.
- **No global uniqueness** on phones/emails.

### 4.3 Acknowledgements
- `accurate` = `true` (always)
- `noDiagnosis` = `true` (always)
- `urgent` = `true` **iff** `hasUrgentFlag === true` (derived after flag derivation)

---

## 5. Assessment Version Handling

- Server resolves the **active published definition** (`AssessmentDefinition` where `is_active=true, status=published`). Seed: `code=nutrition-assessment, version=1.0`.
- Client must send `meta.assessmentVersion`.
- Mismatch → `409 ASSESSMENT_VERSION_MISMATCH`.
- No silent mapping to newer definitions.

---

## 6. Flag Derivation (Authoritative, Server-Side)

- Runs the **same approved frontend module** (`src/features/assessment/logic/flags.js`) via the ESM loader hook — **single source of truth**.
- Input: validated canonical `answers` map.
- Output: array of `{ ruleId, tier, questionRefs, message }`.
- Maps each fired rule to the effective published `FlagRuleVersion` selected by effective date/published date; no hardcoded version.
- **BMI never routes**: RS5/RS6 are inert (not in `FLAG_RULES`).
- **Percentiles never route**: RS9 (growth concern) is STANDARD only.
- **RS14 (cortisone)** = STANDARD, never URGENT.
- Overall tier: URGENT if any RU; else STANDARD if any RS; else `null`.

Flag rows persisted in `assessment_flag` with snapshot columns:
- `tier`, `message_ar/en`, `question_refs_json`, `trigger_context_json` (minimal firing answers).

---

## 7. Transaction Behavior (Atomic)

All writes in a single `sequelize.transaction` (REPEATABLE READ):

1. `AssessmentSession` — status `submitted`, bound to definition + flag version
2. `AssessmentAnswer` — one row per submitted `question_code`
3. `AssessmentSnapshot` — `full_payload_json` + `payload_hash` (sha256 hex, immutable)
4. `AssessmentFlag` — one per derived flag (linked to session)
5. `DoctorReview` — `status='queued'`, `patient_id=null`, `doctor_id=null`
6. `DoctorReviewEvent` — `null → queued`, actor `system`
7. `AuditLog` — `assessment.submitted` + `review.queued` (no PHI, masked IP)

Any failure → full rollback. Duplicate `session_token` detected before write → 409.

---

## 8. Tenant Behavior

- Header `X-Tenant-Slug` (default `dr-kareem`).
- Lookup cached in-memory (single default tenant; Phase 1 seeds only one).
- All scoped queries/writes use `req.tenant.id`.
- Unknown slug → 404 `TENANT_NOT_FOUND`.
- No RLS / partitioning — application-layer enforcement.

---

## 9. Security

- **Helmet** — protective HTTP headers.
- **CORS** — restricted to `CORS_ORIGINS` (default dev: `localhost:5173, localhost:4173`).
- **Body limit** — 256kb JSON.
- **No PHI in logs** — request logger records only method, pathname, status, duration, requestId.
- **Masked IP in audit** — IPv4 last octet → `x`, IPv6 last hextet → `x`.
- **Error handler** — no stack traces in production; maps Sequelize errors to clean codes.
- **Cache-Control: no-store** on `/api/*`.

---

## 10. Example — Minimal Valid Request

```json
{
  "meta": {
    "sessionId": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
    "assessmentVersion": "1.0",
    "language": "ar",
    "startedAt": "2026-08-12T10:00:00.000Z"
  },
  "answers": {
    "Q01_01": "self",
    "Q01_03": "محمد علي",
    "Q01_04": 35,
    "Q01_05": "male",
    "Q02_01": 180,
    "Q02_02": 80,
    "Q03_01": "weight_loss",
    "Q04_01": "no",
    "Q04_04": "stable",
    "Q04_E1": "never",
    "Q05_01": "no",
    "Q05_06": "never",
    "Q06_05": 7,
    "Q08_01": "no"
  },
  "contact": {
    "patientName": "محمد علي",
    "handoffPhone": "01012345678",
    "preference": "whatsapp",
    "consent": true
  },
  "acknowledgements": {
    "accurate": true,
    "noDiagnosis": true,
    "urgent": false
  }
}
```

---

## 11. Assumptions & Deviations

| Item | Decision |
|------|----------|
| `list` columns | Frozen in `question_version_cfg.validation_json.columns`; server validation does not load frontend schemas |
| `question_version_cfg.conditional` | Stores server-readable conditional operators interpreted by `assessment-rules.js`; historical submissions do not load frontend visibility logic |
| Minor guardian for self | §12.1 requires guardian for ANY minor; enforced. Frontend contact step for self-minor would need update in later phase. |
| Reference retry | Up to 8 attempts; astronomically unlikely to exhaust (33^6 space). |
| Placeholder domains | Return 501 `NOT_IMPLEMENTED` with code. |
| No auth | Phase 2 is assessment-intake only; tenant via header. |

---

## 12. Running the API

```bash
cd server
cp .env.example .env   # fill DB creds
npm install
npm run db:migrate     # requires MySQL
npm run db:seed
npm start              # PORT=4000
```

Health check: `GET http://localhost:4000/api/v1/health`

---

## 13. Testing

```bash
cd server
npm test               # runs unit + integration (integration skips without DB)
npm run test:unit      # unit only (flags, validation, phone, reference, hash)
npm run lint           # oxlint (0 warnings/errors)
```

Integration tests require a live MySQL and migrated/seeded DB. They skip only when MySQL is genuinely unreachable; the Phase 2 verification run executed them against MySQL 8.0.46.

---

## 14. Future Phases (Out of Scope)

- Authentication / JWT
- Doctor dashboard / review UI
- Patient dashboard
- Nutrition plan generation (gated by `doctor_review.decision=approved`)
- Exercise plan API
- Appointment booking
- Daily.co video integration
- Payments
- AI-assisted plan drafting
- Notifications (WhatsApp/SMS/email)
