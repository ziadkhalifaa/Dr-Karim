import { models } from "../models/index.js";
import { maskIp } from "../utils/ip.js";

const { AuditLog } = models;

// Append-only audit rows (architecture §23). Never stores raw PHI in the
// generic metadata — only safe descriptors (reference number, tiers, counts).
export const auditService = {
  async record({ tenantId, action, entity, entityRef, metadata, ip, transaction, actorType = "system", actorId = "backend" }) {
    await AuditLog.create(
      {
        tenant_id: tenantId ?? null,
        actor_type: actorType,
        actor_id: actorId,
        action,
        entity,
        entity_id: null,
        entity_ref: entityRef || null,
        safe_metadata_json: metadata || null,
        source_ip_masked: maskIp(ip),
      },
      { transaction }
    );
  },
};

export default auditService;
