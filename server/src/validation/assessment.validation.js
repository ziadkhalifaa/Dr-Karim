// Server-side assessment payload validation + normalization (Phase 2 §4–§8).
//
// Authoritative sources:
//   - definition.questions: frozen question_version_cfg rows (DB) — type,
//     options, ranges, required. Authoritative per the bound definition (§4).
//   - QUESTIONS_BY_ID (frontend): list `columns` definitions (not stored in the
//     DB in Phase 1; documented deviation — seeded from the same source and
//     verified by db:verify).
//   - conditions (frontend): visibility logic (stable rules).
//
// Guarantees:
//   - Rejects unknown question codes.
//   - Rejects answers to non-visible questions (client-side bypass protection).
//   - Validates scalar/range/choice/list shapes per the frozen definition.
//   - Enforces required (* always) and conditionally-required (c when visible).
//   - Phone canonicalization (Egyptian +20 / local 01x).
//   - CL17 contact model; guardian required for any minor (§12.1).
//   - Acknowledgements: accurate + noDiagnosis always true; urgent required
//     when an URGENT flag is present.

import { canonicalizeEgyptianPhone, preserveDisplay } from "../config/phone.js";
import { evaluateConditional } from "../config/assessment-rules.js";
import { AppError, ERROR_CODES, validationError } from "../utils/errors.js";

const GUARDIAN_RELATIONSHIPS = ["parent", "grandparent", "legal_guardian"];
const ALL_RELATIONSHIPS = ["parent", "grandparent", "sibling", "spouse", "legal_guardian", "other"];
const CONTACT_PREFERENCES = ["whatsapp", "call", "both"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
const LANGUAGES = ["ar", "en"];

function isScalarType(type) {
  return ["single", "multi", "number", "date", "text", "textarea", "phone", "email", "scale", "toggle", "consent", "notice"].includes(type);
}

function isEmptyValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function optionValues(q) {
  return Array.isArray(q.options) ? q.options.map((o) => o.value) : [];
}

function validateScalarValue(code, value, q) {
  const v = q.validation || {};
  switch (q.type) {
    case "single": {
      if (typeof value !== "string" || !optionValues(q).includes(value)) {
        return invalidAnswer(code, `Invalid choice for ${code}`);
      }
      return value;
    }
    case "multi": {
      if (!Array.isArray(value)) return invalidAnswer(code, `${code} must be an array`);
      const allowed = optionValues(q);
      for (const el of value) {
        if (typeof el !== "string" || !allowed.includes(el)) return invalidAnswer(code, `Invalid option in ${code}`);
      }
      return value;
    }
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n)) return invalidAnswer(code, `${code} must be a number`);
      if (v.min !== undefined && n < v.min) return invalidAnswer(code, `${code} below minimum`);
      if (v.max !== undefined && n > v.max) return invalidAnswer(code, `${code} above maximum`);
      return n;
    }
    case "date": {
      if (typeof value !== "string") return invalidAnswer(code, `${code} must be a date string`);
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return invalidAnswer(code, `${code} invalid date`);
      if (d.getTime() > Date.now()) return invalidAnswer(code, `${code} date in future`);
      return value;
    }
    case "text":
    case "textarea": {
      if (typeof value !== "string") return invalidAnswer(code, `${code} must be text`);
      const trimmed = value.trim();
      if (v.min !== undefined && trimmed.length < v.min) return invalidAnswer(code, `${code} too short`);
      if (v.max !== undefined && trimmed.length > v.max) return invalidAnswer(code, `${code} too long`);
      return trimmed;
    }
    case "phone": {
      if (typeof value !== "string") return invalidAnswer(code, `${code} must be a string`);
      try {
        return canonicalizeEgyptianPhone(value);
      } catch {
        return invalidAnswer(code, `${code} invalid phone`);
      }
    }
    case "email": {
      if (typeof value !== "string" || !EMAIL_RE.test(value.trim())) return invalidAnswer(code, `${code} invalid email`);
      return value.trim();
    }
    case "scale": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isInteger(n)) return invalidAnswer(code, `${code} must be integer`);
      const min = v.min;
      const max = v.max;
      if (min !== undefined && n < min) return invalidAnswer(code, `${code} below min`);
      if (max !== undefined && n > max) return invalidAnswer(code, `${code} above max`);
      return n;
    }
    case "toggle": {
      return typeof value === "boolean" ? value : invalidAnswer(code, `${code} must be boolean`);
    }
    case "consent": {
      return value === true ? value : invalidAnswer(code, `${code} must be true`);
    }
    case "notice": {
      return null;
    }
    default:
      return invalidAnswer(code, `Unknown type ${q.type} for ${code}`);
  }
}

function invalidAnswer(code, message) {
  return { __invalid: true, code, message };
}

function validateListValue(code, value, validation) {
  if (!Array.isArray(value)) return invalidAnswer(code, `${code} must be an array of rows`);
  const columns = validation?.columns || [];
  if (!columns.length) return value;
  for (const row of value) {
    if (!row || typeof row !== "object") return invalidAnswer(code, `${code} row must be an object`);
    for (const col of columns) {
      if (col.required) {
        const cell = row[col.key];
        if (cell === undefined || cell === null || (typeof cell === "string" && cell.trim() === "")) {
          return invalidAnswer(code, `${code} missing required column ${col.key}`);
        }
      }
      if (col.type === "single" && col.options && row[col.key] !== undefined && row[col.key] !== null && row[col.key] !== "") {
        const allowed = col.options.map((o) => o.value);
        if (!allowed.includes(row[col.key])) return invalidAnswer(code, `${code} invalid option in ${col.key}`);
      }
      if (col.type === "text" && typeof row[col.key] === "string" && col.max !== undefined && row[col.key].length > col.max) {
        return invalidAnswer(code, `${code} column ${col.key} too long`);
      }
    }
  }
  return value;
}

function validateContact(contact, subject, minor) {
  const errors = [];
  const c = contact && typeof contact === "object" ? contact : {};

  const patientName = typeof c.patientName === "string" ? c.patientName.trim() : "";
  if (patientName.length < 2 || patientName.length > 100) {
    errors.push(fieldError("C01", "patientName", "Patient name required (2–100 chars)"));
  }

  const consent = c.consent === true;
  if (!consent) errors.push(fieldError("C09", "consent", "Contact consent required"));

  const handoff = c.handoffPhone;
  let handoffCanonical = null;
  let handoffDisplay = null;
  if (isEmptyValue(handoff)) {
    errors.push(fieldError("C04", "handoffPhone", "Handoff phone required"));
  } else {
    try {
      handoffCanonical = canonicalizeEgyptianPhone(handoff);
      handoffDisplay = preserveDisplay(handoff);
    } catch {
      errors.push(fieldError("C04", "handoffPhone", "Invalid handoff phone"));
    }
  }

  let patientCanonical = null;
  let patientDisplay = null;
  if (!isEmptyValue(c.patientPhone)) {
    try {
      patientCanonical = canonicalizeEgyptianPhone(c.patientPhone);
      patientDisplay = preserveDisplay(c.patientPhone);
    } catch {
      errors.push(fieldError("C05", "patientPhone", "Invalid patient phone"));
    }
  }

  const preference = c.preference === undefined ? "whatsapp" : c.preference;
  if (!CONTACT_PREFERENCES.includes(preference)) {
    errors.push(fieldError("C06", "preference", "Invalid contact preference"));
  }

  let email = null;
  if (!isEmptyValue(c.email)) {
    email = typeof c.email === "string" ? c.email.trim() : "";
    if (!EMAIL_RE.test(email)) errors.push(fieldError("C07", "email", "Invalid email"));
  }

  let bestTime = null;
  if (!isEmptyValue(c.bestTime)) {
    bestTime = typeof c.bestTime === "string" ? c.bestTime.trim() : "";
    if (bestTime.length > 100) errors.push(fieldError("C08", "bestTime", "Best time too long"));
  }

  const cp = c.contactPerson && typeof c.contactPerson === "object" ? c.contactPerson : {};
  let contactPersonName = null;
  let relationship = null;

  if (subject === "someone_else" || minor) {
    contactPersonName = typeof cp.name === "string" ? cp.name.trim() : "";
    if (contactPersonName.length < 2 || contactPersonName.length > 100) {
      errors.push(fieldError("C02", "contactPerson.name", "Contact person name required (2–100)"));
    }
    relationship = cp.relationship;
    if (!ALL_RELATIONSHIPS.includes(relationship)) {
      errors.push(fieldError("C03", "contactPerson.relationship", "Invalid relationship"));
    } else if (minor && !GUARDIAN_RELATIONSHIPS.includes(relationship)) {
      errors.push(fieldError("C03", "contactPerson.relationship", "Minor requires a guardian/caregiver relationship"));
    }
  }

  return {
    errors,
    normalized: {
      patientName,
      contactPerson: { name: contactPersonName, relationship, isGuardian: minor && GUARDIAN_RELATIONSHIPS.includes(relationship) },
      handoffPhone: { canonical: handoffCanonical, display: handoffDisplay },
      patientPhone: { canonical: patientCanonical, display: patientDisplay },
      preference,
      email,
      bestTime,
      consent,
    },
  };
}

function fieldError(code, field, message) {
  return { code, field, message };
}

function validateAcknowledgements(acks, hasUrgent) {
  const errors = [];
  const a = acks && typeof acks === "object" ? acks : {};
  if (a.accurate !== true) errors.push(fieldError("Q10_01", "acknowledgements.accurate", "Accurate acknowledgement required"));
  if (a.noDiagnosis !== true) errors.push(fieldError("Q10_02", "acknowledgements.noDiagnosis", "No-diagnosis acknowledgement required"));
  if (hasUrgent && a.urgent !== true) errors.push(fieldError("Q10_03", "acknowledgements.urgent", "Urgent acknowledgement required"));
  return { errors, normalized: { accurate: a.accurate === true, noDiagnosis: a.noDiagnosis === true, urgent: a.urgent === true } };
}

// Pure validation entry point. Takes the frozen definition question list and
// the imported frontend QUESTIONS_BY_ID (for list columns) — does NOT touch
// the DB, so it is unit-testable. Returns a normalized submission object or
// throws a VALIDATION_ERROR with details.
export function validateAssessment(payload, definitionQuestions) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    throw new AppError(400, ERROR_CODES.PAYLOAD_INVALID, "Payload must be a JSON object");
  }

  const meta = payload.meta && typeof payload.meta === "object" ? payload.meta : {};
  const language = meta.language;
  if (!LANGUAGES.includes(language)) {
    errors.push(fieldError("meta.language", "meta.language", "Invalid language"));
  }

  const rawAnswers = payload.answers && typeof payload.answers === "object" ? payload.answers : {};
  const state = { answers: rawAnswers };
  const subject = rawAnswers.Q01_01 ?? null;

  if (!["self", "someone_else"].includes(subject)) {
    errors.push(fieldError("Q01_01", "answers.Q01_01", "Subject is required (self|someone_else)"));
  }

  const byCode = new Map();
  for (const q of definitionQuestions) {
    if (q.section >= 1 && q.section <= 9) byCode.set(q.code, q);
  }

  const normalizedAnswers = {};
  const seen = new Set();

  for (const [code, value] of Object.entries(rawAnswers)) {
    seen.add(code);
    const q = byCode.get(code);
    if (!q) {
      errors.push(fieldError(code, `answers.${code}`, `Unknown question code: ${code}`));
      continue;
    }


    const visible = evaluateConditional(q.conditional, state);
    if (!visible) {
      errors.push(fieldError(code, `answers.${code}`, `Answer not eligible for current state: ${code}`));
      continue;
    }

    if (isEmptyValue(value)) {
      const required = q.required === "*" || (q.required === "c" && visible);
      if (required) errors.push(fieldError(code, `answers.${code}`, `Required answer missing: ${code}`));
      continue;
    }

    let result;
    if (q.type === "list") {
      result = validateListValue(code, value, q.validation);
    } else if (isScalarType(q.type)) {
      result = validateScalarValue(code, value, q);
    } else {
      errors.push(fieldError(code, `answers.${code}`, `Unsupported question type for ${code}`));
      continue;
    }

    if (result && result.__invalid) {
      errors.push(fieldError(code, `answers.${code}`, result.message));
    } else {
      normalizedAnswers[code] = result;
    }
  }

  // Required/conditionally-required check for visible questions not submitted.
  for (const [code, q] of byCode) {
    if (seen.has(code)) continue;
    const visible = evaluateConditional(q.conditional, state);
    const required = q.required === "*" || (q.required === "c" && visible);
    if (required && visible) {
      errors.push(fieldError(code, `answers.${code}`, `Required answer missing: ${code}`));
    }
  }

  // Contact validation (CL17 / guardian for minors §12.1).
  const age = rawAnswers.Q01_04 === undefined || rawAnswers.Q01_04 === null || rawAnswers.Q01_04 === "" ? null : Number(rawAnswers.Q01_04);
  const minor = age !== null && age < 18;
  const contactResult = validateContact(payload.contact, subject, minor);
  errors.push(...contactResult.errors);

  return {
    errors,
    normalized: {
      meta: {
        sessionId: typeof meta.sessionId === "string" ? meta.sessionId : null,
        assessmentVersion: typeof meta.assessmentVersion === "string" ? meta.assessmentVersion : null,
        language,
        startedAt: typeof meta.startedAt === "string" ? meta.startedAt : null,
        lastSavedAt: typeof meta.lastSavedAt === "string" ? meta.lastSavedAt : null,
      },
      subject,
      answers: normalizedAnswers,
      contact: contactResult.normalized,
      minor,
    },
  };
}

export function finalizeValidation(validationResult, ackErrors, ackNormalized) {
  const all = [...validationResult.errors, ...ackErrors];
  if (all.length) throw validationError(all);
  return { ...validationResult.normalized, acknowledgements: ackNormalized };
}

export { validateAcknowledgements };
export default { validateAssessment, validateAcknowledgements, finalizeValidation };



