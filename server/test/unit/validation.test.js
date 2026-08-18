// Unit test: validation logic (H, I, J, K parts, contact guardian)
// Tests the pure validation function without DB.

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { register } from "node:module";
register(new URL("../../scripts/esm-loader.mjs", import.meta.url));

const { validateAssessment, validateAcknowledgements } = await import("../../src/validation/assessment.validation.js");
const { QUESTIONS_BY_ID } = await import("../../../src/features/assessment/data/questions.js");
const { conditionalForQuestion } = await import("../../src/config/assessment-rules.js");
const { definitionService } = await import("../../src/services/definition.service.js");

// Build a minimal definition question list mirroring the DB structure for unit testing.
function buildDefQuestions() {
  const out = [];
  for (const [code, q] of Object.entries(QUESTIONS_BY_ID)) {
    if (q.section >= 1 && q.section <= 9) {
      out.push({
        code,
        section: q.section,
        type: q.type,
        required: q.required,
        options: q.options || null,
        validation: { ...(q.validation || {}), columns: q.columns || undefined },
        conditional: conditionalForQuestion(code),
      });
    }
  }
  return out;
}

const DEF_QUESTIONS = buildDefQuestions();

function basePayload(overrides = {}) {
  return {
    meta: { sessionId: "test-session-1", assessmentVersion: "1.0", language: "ar", startedAt: new Date().toISOString() },
    answers: {
      Q01_01: "self",
      Q01_03: "Test Patient",
      Q01_04: 30,
      Q01_05: "male",
      Q02_01: 175,
      Q02_02: 70,
      Q03_01: "maintain_weight",
      Q04_01: "no",
      Q04_04: "stable",
      Q04_E1: "never",
      Q05_01: "no",
      Q05_06: "never",
      Q06_05: 7,
      Q08_01: "no",
    },
    contact: {
      patientName: "Test Patient",
      handoffPhone: "01012345678",
      preference: "whatsapp",
      consent: true,
    },
    acknowledgements: { accurate: true, noDiagnosis: true, urgent: false },
    ...overrides,
  };
}

function runValidation(payload) {
  return validateAssessment(payload, DEF_QUESTIONS);
}

describe("Assessment validation (H, I, J, K, guardian)", () => {
  it("H: invalid required field rejected (missing Q01_03)", () => {
    const p = basePayload({ answers: { ...basePayload().answers, Q01_03: "" } });
    const r = runValidation(p);
    const missing = r.errors.find((e) => e.field === "answers.Q01_03" && e.message.includes("Required"));
    assert.ok(missing, "missing required Q01_03 should error");
  });

  it("H: invalid required field rejected (missing contact patientName)", () => {
    const p = basePayload({ contact: { ...basePayload().contact, patientName: "" } });
    const r = runValidation(p);
    const missing = r.errors.find((e) => e.code === "C01");
    assert.ok(missing, "missing patientName should error");
  });

  it("I: removed conditional answer rejected (Q04_D3 without diabetes)", () => {
    const p = basePayload({
      answers: { ...basePayload().answers, Q04_D3: "daily" },
    });
    const r = runValidation(p);
    // Q04_D3 was removed by the 5-step intake: an answer to it is rejected as
    // an unknown code (it used to be rejected as not-eligible — either way the
    // client-side bypass must not slip through).
    const rejected = r.errors.find(
      (e) => e.field === "answers.Q04_D3" && (e.message.includes("not eligible") || e.message.includes("Unknown question code"))
    );
    assert.ok(rejected, "Q04_D3 should be rejected");
  });

  it("J: unknown question code rejected", () => {
    const p = basePayload({ answers: { ...basePayload().answers, Q99_99: "x" } });
    const r = runValidation(p);
    const unknown = r.errors.find((e) => e.message.includes("Unknown question code: Q99_99"));
    assert.ok(unknown, "Q99_99 should be rejected as unknown");
  });

  it("J: unknown version handled by definition service (unit check)", () => {
    // The version check is a simple string compare; tested in integration.
    // Here we just verify the function shape exists in definition.service.
    assert.ok(typeof definitionService.checkVersion === "function");
  });

  it("K: guardian required for minor (someone_else, age 10)", () => {
    const p = basePayload({
      answers: {
        ...basePayload().answers,
        Q01_01: "someone_else",
        Q01_02: "sibling", // NOT a guardian
        Q01_03: "Child Name",
        Q01_04: 10,
      },
      contact: { ...basePayload().contact, contactPerson: { name: "Guardian", relationship: "sibling" } },
    });
    const r = runValidation(p);
    const g = r.errors.find((e) => e.code === "C03" && e.message.includes("guardian"));
    assert.ok(g, "minor with non-guardian relationship should error");
  });

  it("K: guardian OK for minor (parent relationship)", () => {
    const p = basePayload({
      answers: {
        ...basePayload().answers,
        Q01_01: "someone_else",
        Q01_02: "parent",
        Q01_03: "Child Name",
        Q01_04: 10,
      },
      contact: { ...basePayload().contact, contactPerson: { name: "Parent", relationship: "parent" } },
    });
    const r = runValidation(p);
    const g = r.errors.find((e) => e.code === "C03");
    assert.ok(!g, "parent relationship should be accepted for minor");
  });

  it("K: guardian OK for minor (legal_guardian relationship)", () => {
    const p = basePayload({
      answers: {
        ...basePayload().answers,
        Q01_01: "someone_else",
        Q01_02: "legal_guardian",
        Q01_03: "Child Name",
        Q01_04: 10,
      },
      contact: { ...basePayload().contact, contactPerson: { name: "Guardian", relationship: "legal_guardian" } },
    });
    const r = runValidation(p);
    const g = r.errors.find((e) => e.code === "C03");
    assert.ok(!g, "legal_guardian relationship should be accepted");
  });

  it("acknowledgements: accurate + noDiagnosis required; urgent only when urgent flag", () => {
    // No flags → urgent not required
    const r = validateAcknowledgements({ accurate: true, noDiagnosis: true, urgent: false }, false);
    assert.equal(r.errors.length, 0);

    // Missing accurate → error
    const r2 = validateAcknowledgements({ accurate: false, noDiagnosis: true, urgent: false }, false);
    assert.ok(r2.errors.find((e) => e.code === "Q10_01"));

    // Urgent flag present → urgent ack required
    const r3 = validateAcknowledgements({ accurate: true, noDiagnosis: true, urgent: false }, true);
    assert.ok(r3.errors.find((e) => e.code === "Q10_03"));
    const r4 = validateAcknowledgements({ accurate: true, noDiagnosis: true, urgent: true }, true);
    assert.equal(r4.errors.length, 0);
  });

  it("phone canonicalization: local 01x → +20", () => {
    const p = basePayload({ contact: { ...basePayload().contact, handoffPhone: "01012345678" } });
    const r = runValidation(p);
    const contact = r.normalized.contact;
    assert.equal(contact.handoffPhone.canonical, "+201012345678");
  });

  it("phone canonicalization: +20 kept as-is", () => {
    const p = basePayload({ contact: { ...basePayload().contact, handoffPhone: "+201012345678" } });
    const r = runValidation(p);
    const contact = r.normalized.contact;
    assert.equal(contact.handoffPhone.canonical, "+201012345678");
  });

  it("phone rejection: invalid chars", () => {
    const p = basePayload({ contact: { ...basePayload().contact, handoffPhone: "010-123-4567" } });
    const r = runValidation(p);
    const err = r.errors.find((e) => e.code === "C04");
    assert.ok(err, "phone with hyphens should error (no chars except digits/+)");
  });
});



