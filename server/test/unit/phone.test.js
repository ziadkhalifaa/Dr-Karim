// Unit test: phone canonicalization + preservation (Phase 2 §7)

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canonicalizeEgyptianPhone, preserveDisplay } from "../../src/config/phone.js";

describe("Phone normalization (Egyptian)", () => {
  it("local 01x 11-digit → +20 + 10 digits", () => {
    assert.equal(canonicalizeEgyptianPhone("01012345678"), "+201012345678");
    assert.equal(canonicalizeEgyptianPhone("01112345678"), "+201112345678");
    assert.equal(canonicalizeEgyptianPhone("01212345678"), "+201212345678");
    assert.equal(canonicalizeEgyptianPhone("01512345678"), "+201512345678");
  });

  it("international +20 kept as-is", () => {
    assert.equal(canonicalizeEgyptianPhone("+201012345678"), "+201012345678");
    assert.equal(canonicalizeEgyptianPhone("+201112345678"), "+201112345678");
  });

  it("rejects empty/null", () => {
    assert.throws(() => canonicalizeEgyptianPhone(""), /phone_required/);
    assert.throws(() => canonicalizeEgyptianPhone(null), /phone_required/);
  });

  it("rejects non-Egyptian +1/+44/+966 etc.", () => {
    assert.throws(() => canonicalizeEgyptianPhone("+15551234567"), /phone_not_egyptian/);
    assert.throws(() => canonicalizeEgyptianPhone("+442071234567"), /phone_not_egyptian/);
    assert.throws(() => canonicalizeEgyptianPhone("+966501234567"), /phone_not_egyptian/);
  });

  it("rejects invalid local patterns (too short, wrong prefix)", () => {
    assert.throws(() => canonicalizeEgyptianPhone("0123456789"), /phone_not_egyptian/);
    assert.throws(() => canonicalizeEgyptianPhone("00123456789"), /phone_not_egyptian/);
    assert.throws(() => canonicalizeEgyptianPhone("01912345678"), /phone_not_egyptian/); // 019 not allowed
    assert.throws(() => canonicalizeEgyptianPhone("0101234567"), /phone_not_egyptian/); // 10 digits only
  });

  it("rejects invalid characters (spaces, hyphens)", () => {
    assert.throws(() => canonicalizeEgyptianPhone("010 123 45678"), /phone_invalid_chars/);
    assert.throws(() => canonicalizeEgyptianPhone("010-123-45678"), /phone_invalid_chars/);
    assert.throws(() => canonicalizeEgyptianPhone("+20 101 234 5678"), /phone_invalid_chars/);
  });

  it("preserveDisplay returns original trimmed", () => {
    assert.equal(preserveDisplay("01012345678"), "01012345678");
    assert.equal(preserveDisplay("  01012345678  "), "01012345678");
    assert.equal(preserveDisplay("+201012345678"), "+201012345678");
    assert.equal(preserveDisplay(null), null);
    assert.equal(preserveDisplay(undefined), null);
  });
});