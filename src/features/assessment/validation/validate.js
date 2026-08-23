// Validation (docs/assessment-spec.md §5).
// Per-question validity, full-section validity, and non-blocking cross-field warnings.

import { QUESTIONS_BY_ID } from "../data/questions.js";
import { isRequired, getWeightKg } from "../logic/conditions.js";

const PHONE_RE = /^\+?\d[\d\s-]{8,14}$/;
const PHONE_EG_HINT_RE = /^(\+?2)?01[0125][0-9]{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Returns error key or null. Keys map to assessment.errors.* in the i18n namespace.
export function validateQuestion(id, value, state) {
  const q = QUESTIONS_BY_ID[id];
  if (!q) return null;

  const required = isRequired(id, state);
  const empty = isEmptyValue(q, value);

  if (required && empty) return "required";
  if (!required && empty) return null;

  const v = q.validation || {};
  switch (q.type) {
    case "number": {
      const n = Number(value);
      if (!Number.isFinite(n)) return "number";
      if (v.min !== undefined && n < v.min) return "min";
      if (v.max !== undefined && n > v.max) return "max";
      return null;
    }
    case "date":
      return validateDate(value);
    case "phone":
      if (typeof value !== "string") return "phone";
      const digits = value.replace(/\s|-/g, "");
      if (!PHONE_RE.test(value.trim())) return "phone";
      // Egyptian hint (not blocking for formatted international numbers).
      if (!/^\+/.test(digits) && !PHONE_EG_HINT_RE.test(digits)) return "phone";
      return null;
    case "email":
      return typeof value === "string" && EMAIL_RE.test(value.trim())
        ? null
        : "email";
    case "text":
    case "textarea": {
      if (typeof value !== "string") return "required";
      const len = value.trim().length;
      if (v.min && len < v.min) return "required";
      if (v.max && len > v.max) return "max";
      return null;
    }
    case "choice":
    case "single":
    case "scale": {
      if (q.type === "scale") {
        const n = Number(value);
        if (!Number.isInteger(n)) return "number";
        if (n < (v.min ?? q.scaleMin)) return "min";
        if (n > (v.max ?? q.scaleMax)) return "max";
      }
      return null;
    }
    case "multi": {
      if (!Array.isArray(value)) return "required";
      const selected = value.filter((x) => x !== "none");
      const hasNone = value.includes("none");
      return hasNone && selected.length > 0 ? null : value.length > 0 ? null : "select";
    }
    case "toggle":
      return typeof value === "boolean" ? null : "select";
    case "consent":
      return value === true ? null : "consent";
    case "list":
      return validateList(q, value);
    default:
      return null;
  }
}

function isEmptyValue(q, value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object" && q.type === "list") return value.length === 0;
  return false;
}

function validateList(q, value) {
  if (!Array.isArray(value) || value.length === 0) {
    return q.validation.minRows ? "listRequired" : null;
  }
  for (const row of value) {
    for (const col of q.columns) {
      if (col.required) {
        const val = row?.[col.key];
        if (
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim() === "")
        ) {
          return "rowField";
        }
      }
    }
  }
  return null;
}

function validateDate(value) {
  if (!value) return "date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "date";
  if (d.getTime() > Date.now()) return "date"; // must be <= today
  return null;
}

// All visible required questions in a section must be valid to advance (desktop).
export function validateSection(sectionNo, state, visibleIds) {
  const ids = Array.isArray(visibleIds) ? visibleIds : [];
  const firstInvalid = ids.find((id) => validateQuestion(id, state.answers[id], state));
  return { valid: !firstInvalid, firstInvalidId: firstInvalid ?? null };
}

// Non-blocking cross-field warnings (spec §5 "warnings only, never blocking").
export function getWarnings(state) {
  const warnings = [];
  const raw = state.answers.Q03_01;
  const goals = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const current = getWeightKg(state);
  const target = Number(state.answers.Q02_06);

  if (!Number.isFinite(target)) return warnings;

  if (goals.includes("lose") && current && target >= current) {
    warnings.push({ id: "goal-target-loss", refs: ["Q03_01", "Q02_02", "Q02_06"], key: "lossTarget" });
  }
  if (goals.includes("gain") && current && target <= current) {
    warnings.push({ id: "goal-target-gain", refs: ["Q03_01", "Q02_02", "Q02_06"], key: "gainTarget" });
  }
  return warnings;
}

export function isValidAnswer(id, value, state) {
  return validateQuestion(id, value, state) === null;
}