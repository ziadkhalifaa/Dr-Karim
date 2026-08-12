// Unit test: reference number generation + format

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateReferenceNumber, isReferenceNumber } from "../../src/utils/reference.js";

describe("Reference number DK-YYYY-XXXXXX", () => {
  it("format: DK-YYYY-6chars", () => {
    const ref = generateReferenceNumber(new Date("2026-01-15"));
    assert.match(ref, /^DK-2026-[A-HJ-NP-Z2-9]{6}$/);
  });

  it("alphabet excludes I, L, O, 0, 1", () => {
    for (let i = 0; i < 1000; i++) {
      const ref = generateReferenceNumber();
      const tail = ref.slice(-6);
      for (const ch of tail) {
        assert.ok(!"ILO01".includes(ch), `forbidden char ${ch} in ${ref}`);
      }
    }
  });

  it("uniqueness over many generations (statistical)", () => {
    const set = new Set();
    for (let i = 0; i < 5000; i++) set.add(generateReferenceNumber());
    assert.equal(set.size, 5000, "all generated refs should be unique");
  });

  it("isReferenceNumber validator works", () => {
    assert.equal(isReferenceNumber("DK-2026-ABC234"), true);
    assert.equal(isReferenceNumber("DK-2026-ABC12"), false); // 5 chars
    assert.equal(isReferenceNumber("DK-2026-ABC12I"), false); // forbidden I
    assert.equal(isReferenceNumber("DK-2025-ABC234"), true); // different year
    assert.equal(isReferenceNumber("DK-2026-abc123"), false); // lowercase not allowed
    assert.equal(isReferenceNumber("XX-2026-ABC123"), false); // wrong prefix
  });
});
