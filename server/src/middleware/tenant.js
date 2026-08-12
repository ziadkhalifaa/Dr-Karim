import env from "../config/env.js";
import { tenantService } from "../services/tenant.service.js";

// Tenant resolution middleware (architecture §7): reads X-Tenant-Slug header
// (default dr-kareem), lookups the tenant, attaches { id, slug } to req.tenant.
export async function tenantResolver(req, _res, next) {
  const slug = req.headers["x-tenant-slug"] || env.DEFAULT_TENANT_SLUG;
  try {
    const tenant = await tenantService.resolveOrThrow(slug);
    req.tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
}

export default tenantResolver;
