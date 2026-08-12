import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, signAccessToken, verifyAccessToken } from "../../src/utils/auth-crypto.js";
import { requireRole } from "../../src/middleware/auth.js";

describe("authentication cryptography", () => {
  it("hashes passwords without storing plaintext and verifies correctly", async () => {
    const hash = await hashPassword("A-very-strong-password!");
    assert.notEqual(hash, "A-very-strong-password!"); assert.match(hash, /^scrypt\$/);
    assert.equal(await verifyPassword("A-very-strong-password!", hash), true);
    assert.equal(await verifyPassword("wrong-password", hash), false);
  });
  it("signs, validates, expires, and rejects tampered access tokens", () => {
    const secret = "test-secret"; const token = signAccessToken({ sub: "1", exp: Math.floor(Date.now() / 1000) + 30 }, secret);
    assert.equal(verifyAccessToken(token, secret).sub, "1"); assert.equal(verifyAccessToken(`${token}x`, secret), null);
    const expired = signAccessToken({ exp: Math.floor(Date.now() / 1000) - 1 }, secret); assert.equal(verifyAccessToken(expired, secret), null);
  });

  it("enforces reusable role authorization", () => {
    const allow = requireRole("doctor", "staff");
    const req = { auth: { membership: { role: "doctor" } } };
    let error;
    allow(req, {}, (err) => { error = err; });
    assert.equal(error, undefined);

    const deny = requireRole("doctor");
    const patientRequest = { auth: { membership: { role: "patient" } } };
    deny(patientRequest, {}, (err) => { error = err; });
    assert.equal(error?.code, "ROLE_FORBIDDEN");
  });
});
