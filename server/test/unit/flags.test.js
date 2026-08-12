// Unit test: server-side flag derivation + overall tier (Phase 2 §9, §10).
// Uses the SAME approved frontend derivation logic (single source of truth).
// Tests A, D, E, F, G from the specification.

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// Register the ESM loader to import frontend logic (extensionless relative imports).
import { register } from "node:module";
register(new URL("../../scripts/esm-loader.mjs", import.meta.url));

const { deriveFlags, overallTier, hasUrgentFlag } = await import("../../../src/features/assessment/logic/flags.js");
const { isMinor, getSubject } = await import("../../../src/features/assessment/logic/conditions.js");

function answers(obj) {
  return obj;
}

describe("Flag derivation (A, D, E, F, G)", () => {
  let healthyAdult;
  before(() => {
    // A. Valid adult self assessment — no flags expected
    healthyAdult = {
      Q01_01: "self",
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
    };
  });

  it("A: healthy adult self → no flags, overallTier = null", () => {
    const state = answers(healthyAdult);
    const flags = deriveFlags(state);
    assert.equal(flags.length, 0, "should derive zero flags for healthy adult");
    assert.equal(overallTier(flags), null, "overallTier should be null when no flags");
    assert.equal(hasUrgentFlag(flags), false, "hasUrgentFlag should be false");
  });

  it("D: weight_gain + cortisone currently → RS14 STANDARD", () => {
    const state = answers({
      ...healthyAdult,
      Q03_01: "weight_gain",
      Q03_G4: "currently",
      Q05_06: "yes",
    });
    const flags = deriveFlags(state);
    const rs14 = flags.find((f) => f.ruleId === "RS14");
    assert.ok(rs14, "RS14 should fire");
    assert.equal(rs14.tier, "standard", "RS14 is STANDARD (not URGENT)");
    assert.equal(overallTier(flags), "standard", "overallTier = standard when only standard flags");
  });

  it("E: acute symptoms (chest_pain) → RU2 URGENT", () => {
    const state = answers({
      ...healthyAdult,
      Q04_06: ["chest_pain"],
    });
    const flags = deriveFlags(state);
    const ru2 = flags.find((f) => f.ruleId === "RU2");
    assert.ok(ru2, "RU2 should fire for chest_pain");
    assert.equal(ru2.tier, "urgent", "RU2 is URGENT");
    assert.equal(overallTier(flags), "urgent", "overallTier = urgent when any urgent flag");
    assert.equal(hasUrgentFlag(flags), true, "hasUrgentFlag true");
  });

  it("F: BMI high (44) → no flags (BMI never routes)", () => {
    const state = answers({
      ...healthyAdult,
      Q02_01: 150,
      Q02_02: 100,
    });
    const flags = deriveFlags(state);
    const rs5 = flags.find((f) => f.ruleId === "RS5");
    assert.equal(rs5, undefined, "RS5 does not exist in FLAG_RULES (inert)");
    assert.equal(flags.length, 0, "no flags derived for high BMI");
    assert.equal(overallTier(flags), null);
  });

  it("G: minor growth concerns → RS9 STANDARD (never URGENT)", () => {
    const state = answers({
      Q01_01: "someone_else",
      Q01_02: "parent",
      Q01_03: "Child Name",
      Q01_04: 8,
      Q01_05: "male",
      Q02_01: 130,
      Q02_02: 25,
      Q02_07: ["not_gaining"],
      Q03_01: "maintain_weight",
      Q04_01: "no",
      Q04_04: "stable",
      Q04_E1: "never",
      Q05_01: "no",
      Q05_06: "never",
      Q06_05: 9,
      Q08_01: "no",
    });
    const flags = deriveFlags(state);
    const rs9 = flags.find((f) => f.ruleId === "RS9");
    assert.ok(rs9, "RS9 should fire for minor growth concern");
    assert.equal(rs9.tier, "standard", "RS9 is STANDARD");
    assert.equal(overallTier(flags), "standard");
    assert.ok(!flags.some((f) => f.tier === "urgent"), "no URGENT from growth concerns");
  });

  it("C: someone_else minor, guardian relationship recognized", () => {
    const state = answers({
      Q01_01: "someone_else",
      Q01_02: "parent",
      Q01_03: "Child",
      Q01_04: 10,
      Q01_05: "female",
      Q02_01: 140,
      Q02_02: 35,
      Q03_01: "maintain_weight",
      Q04_01: "no",
      Q04_04: "stable",
      Q04_E1: "never",
      Q05_01: "no",
      Q05_06: "never",
      Q06_05: 10,
      Q08_01: "no",
    });
    const subject = getSubject({ answers: state });
    const minor = isMinor({ answers: state });
    assert.equal(subject, "someone_else");
    assert.equal(minor, true, "10yo is minor");
  });
});



