// Single source of truth bridge: registers the ESM loader hook (so Node can
// resolve the frontend's extensionless relative imports) and dynamically
// imports the APPROVED derivation + validation logic from the SAME frontend
// modules the UI uses. The server runs `deriveFlags` over validated answers —
// client-supplied flags/tier are NEVER trusted (spec §6 / Phase 2 §9).
//
// Inspired by scripts/seed.js + scripts/verify-assessment-consistency.js which
// already established this single-source pattern in Phase 1.

import { register } from "node:module";

register(new URL("../../scripts/esm-loader.mjs", import.meta.url));

const [flagsMod, conditionsMod, questionsMod] = await Promise.all([
  import("../../../src/features/assessment/logic/flags.js"),
  import("../../../src/features/assessment/logic/conditions.js"),
  import("../../../src/features/assessment/data/questions.js"),
]);

export const deriveFlags = flagsMod.deriveFlags;
export const overallTier = flagsMod.overallTier;
export const hasUrgentFlag = flagsMod.hasUrgentFlag;

export const isVisible = conditionsMod.isVisible;
export const isRequired = conditionsMod.isRequired;
export const isMinor = conditionsMod.isMinor;
export const getAgeYears = conditionsMod.getAgeYears;
export const getSubject = conditionsMod.getSubject;
export const pregnancyRelevant = conditionsMod.pregnancyRelevant;

export const QUESTIONS_BY_ID = questionsMod.QUESTIONS_BY_ID;
export const QUESTIONS_RAW = questionsMod.QUESTIONS_RAW;
export const QUESTIONS = questionsMod.QUESTIONS;
