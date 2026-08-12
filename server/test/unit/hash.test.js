// Unit test: SHA-256 hash + canonical JSON string

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sha256Hex, canonicalJsonString } from "../../src/utils/hash.js";

describe("Hash utilities", () => {
  it("sha256Hex produces 64-char hex", () => {
    const h = sha256Hex("hello");
    assert.equal(h.length, 64);
    assert.match(h, /^[a-f0-9]{64}$/);
  });

  it("sha256Hex is deterministic", () => {
    assert.equal(sha256Hex("test"), sha256Hex("test"));
  });

  it("canonicalJsonString sorts keys for stability", () => {
    const a = { b: 1, a: 2 };
    const b = { a: 2, b: 1 };
    assert.equal(canonicalJsonString(a), canonicalJsonString(b));
  });

  it("canonicalJsonString handles nested objects/arrays", () => {
    const a = { x: { z: 3, y: 2 }, list: [3, 1, 2] };
    const b = { x: { y: 2, z: 3 }, list: [1, 2, 3] };
    // arrays are NOT sorted (order matters for payload hash)
    assert.equal(canonicalJsonString(a), `{"list":[3,1,2],"x":{"y":2,"z":3}}`);
    assert.notEqual(canonicalJsonString(a), canonicalJsonString(b));
  });

  it("full round-trip: snapshot -> canonical -> hash -> verify", () => {
    const snapshot = {
      meta: { language: "ar", startedAt: "2026-01-01T00:00:00.000Z" },
      answers: { Q01_01: "self", Q02_01: 175, Q02_02: 70 },
      derived: { bmi: 22.86, overallTier: null },
      referenceNumber: "DK-2026-K2M3P4",
      submittedAt: "2026-01-01T12:00:00.000Z",
    };
    const json = canonicalJsonString(snapshot);
    const hash = sha256Hex(json);
    assert.equal(hash.length, 64);
    // Recomputing produces same hash
    assert.equal(sha256Hex(json), hash);
  });
});