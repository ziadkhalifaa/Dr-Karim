// Conditional logic engine (docs/assessment-spec.md §4).
// Centralized visibility resolver — questions never branch inside JSX.
//
// A question is visible if its selector returns true (default: true).
// "c" (conditionally required) is derived here too, so validation can ask.

import { QUESTIONS_BY_ID } from "../data/questions.js";

export function getSubject(state) {
  return state.answers.Q01_01 ?? null;
}

export function isSomeoneElse(state) {
  return getSubject(state) === "someone_else";
}

// Age from DOB when present (spec §7: age is DERIVED from dob).
export function ageFromDob(dob, today = new Date()) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let years = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years -= 1;
  return Math.max(0, years);
}

export function getAgeYears(state) {
  const dob = state.answers.Q01_04a;
  if (dob) {
    const fromDob = ageFromDob(dob);
    if (fromDob !== null) return fromDob;
  }
  const raw = state.answers.Q01_04;
  return raw === "" || raw === null || raw === undefined ? null : Number(raw);
}

export function getAgeMonths(state) {
  const dob = state.answers.Q01_04a;
  if (dob) {
    const d = new Date(dob);
    const today = new Date();
    if (!Number.isNaN(d.getTime())) {
      return Math.max(0, (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth()));
    }
  }
  const raw = state.answers.Q01_04b;
  return raw === "" || raw === null || raw === undefined ? null : Number(raw);
}

export function isMinor(state) {
  const age = getAgeYears(state);
  if (age !== null) return age < 18;
  return null; // unknown until age is entered
}

export function isAdult(state) {
  const age = getAgeYears(state);
  if (age !== null) return age >= 18;
  return null;
}

export function isFemale(state) {
  return state.answers.Q01_05 === "female";
}

export function getGoal(state) {
  return state.answers.Q03_01 ?? null;
}

export function getConditions(state) {
  const v = state.answers.Q04_02;
  return Array.isArray(v) ? v : [];
}

export function hasCondition(state, value) {
  return getConditions(state).includes(value);
}

export function getWeightKg(state) {
  const raw = state.answers.Q02_02;
  return raw === "" || raw === null || raw === undefined ? null : Number(raw);
}

export function getHeightCm(state) {
  const raw = state.answers.Q02_01;
  return raw === "" || raw === null || raw === undefined ? null : Number(raw);
}

// Pregnancy visibility rule (spec CL14): females 12–55. Configurable.
export const PREGNANCY_AGE_MIN = 12;
export const PREGNANCY_AGE_MAX = 55;
export function pregnancyRelevant(state) {
  if (!isFemale(state)) return false;
  const age = getAgeYears(state);
  if (age === null) return false;
  return age >= PREGNANCY_AGE_MIN && age <= PREGNANCY_AGE_MAX;
}

const ANY_NON_NONE = (arr = []) => {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  return arr.includes("none") ? arr.length > 1 : true;
};

// Growth concern flagged only when a real concern is marked (Q02_07).
export function hasGrowthConcern(state) {
  return ANY_NON_NONE(state.answers.Q02_07);
}

export function hasAcuteSymptoms(state) {
  return ANY_NON_NONE(state.answers.Q04_06);
}

// ---- visibility rules keyed by question id (order: spec §3/§4) ----
const RULES = {
  Q01_02: (s) => isSomeoneElse(s),
  Q01_04b: (s) => {
    const age = getAgeYears(s);
    return age !== null && age < 2;
  },
  Q02_04: (s) => isAdult(s) !== false,
  Q02_07: (s) => isMinor(s) === true,

  Q04_02: (s) => {
    const v = s.answers.Q04_01;
    return v === "yes" || v === "prefer_not_to_say";
  },
  Q04_02o: (s) => hasCondition(s, "other"),
  Q04_D1: (s) => hasCondition(s, "diabetes"),
  Q04_D2: (s) => hasCondition(s, "diabetes"),
  Q04_D3: (s) => hasCondition(s, "diabetes"),
  Q04_T1: (s) => hasCondition(s, "thyroid"),
  Q04_C1: (s) => hasCondition(s, "cancer"),
  Q04_03: (s) => pregnancyRelevant(s),

  Q04_04b: (s) => {
    const v = s.answers.Q04_04;
    return v === "lost" || v === "gained";
  },

  Q05_02: (s) => s.answers.Q05_01 === "yes",
  Q05_04: (s) => hasCondition(s, "diabetes"),

  Q06_05: (s) => isAdult(s) !== false,
  Q06_08: (s) => isAdult(s) !== false,
  Q06_09: (s) => isAdult(s) !== false,

  Q07_03b: (s) => s.answers.Q07_03 === "yes",

  Q08_02: (s) => s.answers.Q08_01 === "yes",
};

export function isVisible(id, state) {
  const rule = RULES[id];
  return rule ? rule(state) : true;
}

export function currentlyVisible(state, id) {
  return isVisible(id, state);
}

// Is the question required given the current state?
// "*" always required · "c" required when visible · "o" never required.
export function isRequired(id, state) {
  const q = QUESTIONS_BY_ID[id];
  if (!q) return false;
  if (q.required === "*") return true;
  if (q.required === "c") return isVisible(id, state);
  return false;
}

export const VISIBILITY_RULES = RULES;