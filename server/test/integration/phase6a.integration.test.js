import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { sequelize } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { configurationService } from "../../src/services/configuration.service.js";
import { paymentService } from "../../src/services/payment.service.js";

const { Tenant } = models;
let available = false; let tenantA; let tenantB;
before(async () => { try { await sequelize.authenticate(); available = true; } catch { return; } tenantA = await Tenant.findOne({ where: { slug: "dr-kareem" } }); tenantB = await Tenant.create({ slug: `phase6a-${Date.now()}`, name: "Phase 6A Tenant", is_default: false }); });
after(async () => { if (available) await sequelize.close(); });

describe("Phase 6A tenant payment settings", { concurrency: false }, () => {
  it("keeps payment destinations isolated by tenant", async (t) => { if (!available) return t.skip(); const auth = { membership: { role: "doctor" }, user: { id: "phase6a-doctor" } }; await configurationService.updateSettings({ tenantId: tenantA.id, auth, body: { vodafoneCash: { enabled: true, destination: "tenant-a-test" } }, ip: "127.0.0.1" }); await configurationService.updateSettings({ tenantId: tenantB.id, auth, body: { vodafoneCash: { enabled: true, destination: "tenant-b-test" } }, ip: "127.0.0.1" }); const a = await paymentService.settings({ tenantId: tenantA.id }); const b = await paymentService.settings({ tenantId: tenantB.id }); assert.equal(a.vodafone_cash.destination, "tenant-a-test"); assert.equal(b.vodafone_cash.destination, "tenant-b-test"); });
});
