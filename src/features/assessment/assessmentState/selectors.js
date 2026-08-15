// Selectors over assessment state (pure functions of `answers`).

import { QUESTIONS } from "../data/questions.js";
import { SECTIONS } from "../data/sections.js";
import { isVisible, isMinor, getAgeYears, getSubject } from "../logic/conditions.js";
import { deriveFlags, overallTier } from "../logic/flags.js";

export function visibleQuestions(state, sectionNo) {
  return QUESTIONS.filter(
    (q) => q.section === sectionNo && isVisible(q.id, state)
  );
}

export function visibleQuestionsBySection(state) {
  return SECTIONS.map((s) => visibleQuestions(state, s.no));
}

export function visibleIdsBySection(state) {
  return visibleQuestionsBySection(state).map((qs) => qs.map((q) => q.id));
}

export function totalVisibleQuestions(state) {
  return visibleQuestionsBySection(state).reduce((n, qs) => n + qs.length, 0);
}

export function answeredVisibleCount(state) {
  let answered = 0;
  for (const qs of visibleQuestionsBySection(state)) {
    for (const q of qs) {
      const v = state.answers[q.id];
      if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) {
        answered += 1;
      }
    }
  }
  return answered;
}

// Progress = answered visible questions / total visible questions (0–100).
// Displayed as an accessible progressbar only — user-facing text is the step
// number ("Step 3 of 9"), never this percentage.
export function progressPercent(state) {
  const total = totalVisibleQuestions(state);
  if (total === 0) return 0;
  return Math.round((answeredVisibleCount(state) / total) * 100);
}

export function getBmi(state) {
  const h = Number(state.answers.Q02_01);
  const w = Number(state.answers.Q02_02);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
  return Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
}

export function getFlags(state) {
  return deriveFlags(state.answers);
}

export function getOverallTier(state) {
  return overallTier(getFlags(state));
}

export function getSubjectLabel(state) {
  return getSubject(state);
}

export function getAgeInfo(state) {
  return { years: getAgeYears(state), minor: isMinor(state) };
}

// Build the spec §7 annotated JSON snapshot (only answers for questions that
// are currently visible are included, so hidden/cleared branches don't leak).
export function buildSnapshot(state) {
  const visibleIds = visibleIdsBySection(state).flat();
  const answers = {};
  for (const id of visibleIds) {
    if (state.answers[id] !== undefined) answers[id] = state.answers[id];
  }
  return {
    meta: { ...state.meta, lastSavedAt: new Date().toISOString() },
    subject: getSubject(state),
    answers,
    flags: getFlags(state),
    derived: {
      bmi: getBmi(state),
      ageFromDob: state.answers.Q01_04a ? "computed" : null,
      overallTier: getOverallTier(state),
    },
    acknowledgements: state.acknowledgements,
    contact: {
      ...state.contact,
      contactPerson: {
        ...state.contact.contactPerson,
        isGuardian: state.contact.contactPerson.isGuardian,
      },
    },
    submittedAt: state.submittedAt,
    referenceNumber: state.referenceNumber,
    htmlStatus: state.status,
    draftKey: `drke.assessment.${state.meta.sessionId}`,
  };
}