import { models } from "../models/index.js";
import env from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { authService } from "../services/auth.service.js";
import { tenantService } from "../services/tenant.service.js";

const { AuthUser, AuthUserTenant } = models;

export async function authenticateOptional(req, _res, next) {
  const header = req.headers.authorization;
  if (!header) return next();
  try {
    const payload = authService.authenticateAccessToken(header.replace(/^Bearer\s+/iu, ""));
    await authService.ensureActiveSession(payload);
    const user = await AuthUser.findByPk(payload.sub, { attributes: { exclude: ["password_hash"] }, raw: true });
    const membership = await AuthUserTenant.findOne({ where: { user_id: payload.sub, tenant_id: payload.tid, active: true }, raw: true });
    if (!user || !membership || user.status !== "enabled") throw new AppError(401, "AUTH_INVALID_ACCESS_TOKEN", "Invalid or expired access token");
    req.auth = { user, membership, token: payload };
  } catch (err) { return next(err); }
  return next();
}

export function requireAuth(req, _res, next) {
  if (!req.auth) return next(new AppError(401, "AUTH_REQUIRED", "Authentication required"));
  return next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth) return next(new AppError(401, "AUTH_REQUIRED", "Authentication required"));
    if (!roles.includes(req.auth.membership.role)) return next(new AppError(403, "ROLE_FORBIDDEN", "Insufficient role"));
    return next();
  };
}

export async function requireTenantAccess(req, _res, next) {
  try {
    if (req.auth) {
      const requested = req.headers["x-tenant-slug"];
      const tenant = requested ? await tenantService.resolveOrThrow(requested) : await tenantService.resolveById(req.auth.membership.tenant_id);
      if (String(tenant.id) !== String(req.auth.membership.tenant_id)) throw new AppError(403, "TENANT_ACCESS_DENIED", "Tenant access denied");
      req.tenant = tenant;
      return next();
    }
    if (env.AUTH_REQUIRED) return next(new AppError(401, "AUTH_REQUIRED", "Authentication required"));
    const tenant = await tenantService.resolveOrThrow(req.headers["x-tenant-slug"] || env.DEFAULT_TENANT_SLUG);
    req.tenant = tenant;
    return next();
  } catch (err) { return next(err); }
}
