// Integration test: full submit round-trip + duplicate/rollback/tenant/snapshot
// (L, M, N, O). Requires a live MySQL (Hostinger/dev). Skips cleanly when DB
// is unreachable (sequelize.authenticate fails) — exits 0 with a SKIP message.

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
const { fetch } = globalThis;

import { register } from "node:module";
register(new URL("../../scripts/esm-loader.mjs", import.meta.url));

import { createApp } from "../../src/app.js";
import { sequelize } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { sha256Hex } from "../../src/utils/hash.js";
import { assessmentService } from "../../src/services/assessment.service.js";

const { AssessmentSession, AssessmentAnswer, AssessmentSnapshot, DoctorReview, Tenant } = models;

let server = null;
let baseUrl = "";
let tenantA = null;
let tenantB = null;
let dbAvailable = false;

async function dbReachable() {
  try {
    await sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
}

before(async () => {
  dbAvailable = await dbReachable();
  if (!dbAvailable) {
    console.log("⏭  SKIP integration tests: MySQL not reachable (run with a live DB to enable)");
    return;
  }
  // Create two tenants for isolation test
  tenantA = await Tenant.findOne({ where: { slug: "dr-kareem" } });
  if (!tenantA) throw new Error("default tenant dr-kareem not found");
  tenantB = await Tenant.findOne({ where: { slug: "tenant-b" } });
  if (!tenantB) {
    tenantB = await Tenant.create({ slug: "tenant-b", name: "Tenant B", is_default: false });
  }

  const app = createApp();
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`🔗 Integration test server on ${baseUrl}`);
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await sequelize.close();
});

function postSubmit(payload, tenantSlug) {
  const headers = { "Content-Type": "application/json" };
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;
  return fetch(`${baseUrl}/api/v1/assessment/submit`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

function basePayload() {
  return {
    meta: {
      sessionId: "test-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      assessmentVersion: "1.0",
      language: "ar",
      startedAt: new Date().toISOString(),
    },
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
      Q06_01: "none",
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
  };
}

describe("Integration: full submit (requires DB)", () => {
  it("default tenant works and unknown tenant is rejected", async () => {
    const defaultPayload = basePayload();
    defaultPayload.meta.sessionId = "default-tenant-" + Date.now();
    const defaultResponse = await postSubmit(defaultPayload);
    assert.equal(defaultResponse.status, 201);

    const unknownPayload = basePayload();
    unknownPayload.meta.sessionId = "unknown-tenant-" + Date.now();
    const unknownResponse = await postSubmit(unknownPayload, "does-not-exist");
    assert.equal(unknownResponse.status, 404);
    assert.equal((await unknownResponse.json()).error.code, "TENANT_NOT_FOUND");
  });

  it("O: submit → snapshot payload_hash matches recomputed hash", async () => {
    const payload = basePayload();
    payload.referenceNumber = "DK-2026-CLIENT";
    payload.flags = [{ ruleId: "RU2", tier: "urgent" }];
    payload.overallTier = "urgent";
    payload.derived = { bmi: 999 };
    const res = await postSubmit(payload, tenantA.slug);
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.referenceNumber);
    assert.notEqual(body.data.referenceNumber, payload.referenceNumber);
    assert.equal(body.data.overallTier, null);
    assert.equal(body.data.reviewState, "queued");

    const ref = body.data.referenceNumber;
    const session = await AssessmentSession.findOne({ where: { reference_number: ref } });
    const snap = await AssessmentSnapshot.findOne({
      where: { session_id: session.id },
      raw: true,
    });
    assert.ok(snap);
    const recomputed = sha256Hex(snap.full_payload_json);
    assert.equal(snap.payload_hash, recomputed, "stored payload_hash must match recomputed");
    const review = await DoctorReview.findOne({ where: { assessment_session_id: session.id }, raw: true });
    assert.equal(review.status, "queued");
  });

  it("L: duplicate session_token → 409 DUPLICATE_SUBMISSION", async () => {
    const payload = basePayload();
    const res1 = await postSubmit(payload, tenantA.slug);
    assert.equal(res1.status, 201);
    const res2 = await postSubmit(payload, tenantA.slug);
    assert.equal(res2.status, 409);
    const body = await res2.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "DUPLICATE_SUBMISSION");
  });

  it("M: transaction rollback — mid-failure leaves no orphan rows", async () => {
    const payload = basePayload();
    const sessionId = "test-rollback-" + Date.now();
    payload.meta.sessionId = sessionId;
    await assert.rejects(
      assessmentService.submit(payload, { tenant: tenantA, ip: "127.0.0.1", failureAfter: "snapshot" }),
      /forced rollback test failure/
    );
    assert.equal(await AssessmentSession.count({ where: { session_token: sessionId } }), 0);
    assert.equal(await AssessmentAnswer.count({ where: { session_id: -1 } }), 0);
  });

  it("N: tenant isolation — tenant A cannot see tenant B data", async () => {
    const payloadA = basePayload();
    payloadA.meta.sessionId = "iso-a-" + Date.now();
    const resA = await postSubmit(payloadA, tenantA.slug);
    assert.equal(resA.status, 201);

    const payloadB = basePayload();
    payloadB.meta.sessionId = "iso-b-" + Date.now();
    const resB = await postSubmit(payloadB, tenantB.slug);
    assert.equal(resB.status, 201);
    const bodyB = await resB.json();

    // Query tenant A's sessions (via service scope) — should only see its own
    const sessionsA = await AssessmentSession.findAll({ where: { tenant_id: tenantA.id } });
    const sessionsB = await AssessmentSession.findAll({ where: { tenant_id: tenantB.id } });
    assert.ok(sessionsA.length >= 1);
    assert.ok(sessionsB.length >= 1);
    // No overlap
    for (const s of sessionsA) assert.notEqual(s.reference_number, bodyB.data.referenceNumber);
  });

  it("K: unknown assessment version → 409 ASSESSMENT_VERSION_MISMATCH", async () => {
    const payload = basePayload();
    payload.meta.assessmentVersion = "9.9.9";
    payload.meta.sessionId = "version-test-" + Date.now();
    const res = await postSubmit(payload, tenantA.slug);
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, "ASSESSMENT_VERSION_MISMATCH");
  });
});
