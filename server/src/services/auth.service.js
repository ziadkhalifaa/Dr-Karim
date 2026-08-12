import crypto from "node:crypto";
import { Op } from "sequelize";
import { models } from "../models/index.js";
import env from "../config/env.js";
import { canonicalizeEgyptianPhone } from "../config/phone.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, verifyPassword, randomToken, hashToken, signAccessToken, verifyAccessToken } from "../utils/auth-crypto.js";

const { AuthUser, AuthUserTenant, AuthRefreshToken, AuthPasswordReset, Tenant } = models;
const AUTH_INVALID = "AUTH_INVALID_CREDENTIALS";

function normalizeIdentifier(value) {
  const raw = String(value || "").trim();
  if (raw.includes("@")) return { email: raw.toLowerCase() };
  try { return { phone_canonical: canonicalizeEgyptianPhone(raw) }; } catch { return { email: raw.toLowerCase() }; }
}
function safeUser(user, membership) { return { id: String(user.id), role: membership.role, tenantId: String(membership.tenant_id), userType: user.user_type }; }
function accessToken(user, membership, familyId) {
  const now = Math.floor(Date.now() / 1000);
  return signAccessToken({ sub: String(user.id), tid: String(membership.tenant_id), role: membership.role, familyId, iat: now, exp: now + env.ACCESS_TOKEN_TTL_SECONDS, jti: crypto.randomUUID() }, env.AUTH_TOKEN_SECRET);
}
async function membershipFor(userId, tenantSlug) {
  const where = { user_id: userId, active: true };
  const rows = await AuthUserTenant.findAll({ where, include: [{ model: Tenant, required: true, attributes: ["id", "slug", "name"] }], raw: true, nest: true });
  const selected = tenantSlug ? rows.find((r) => r.tenant.slug === tenantSlug) : rows.find((r) => r.tenant.slug === env.DEFAULT_TENANT_SLUG) || rows[0];
  if (!selected) throw new AppError(403, "TENANT_ACCESS_DENIED", "Tenant access denied");
  return selected;
}

export const authService = {
  async login({ identifier, password, tenantSlug, userAgent, ip }) {
    const user = await AuthUser.findOne({ where: normalizeIdentifier(identifier) });
    if (!user || user.status !== "enabled" || (user.locked_until && new Date(user.locked_until) > new Date()) || !(await verifyPassword(password, user.password_hash))) {
      if (user && user.status === "enabled") {
        const failures = Number(user.failed_login_count || 0) + 1;
        await user.update({ failed_login_count: failures, locked_until: failures >= env.AUTH_MAX_FAILED_LOGINS ? new Date(Date.now() + env.AUTH_LOCKOUT_SECONDS * 1000) : null });
      }
      throw new AppError(401, AUTH_INVALID, "Invalid credentials");
    }
    const membership = await membershipFor(user.id, tenantSlug);
    await user.update({ failed_login_count: 0, locked_until: null, last_login_at: new Date() });
    const familyId = crypto.randomUUID(); const refresh = randomToken();
    await AuthRefreshToken.create({ user_id: user.id, tenant_id: membership.tenant_id, family_id: familyId, token_hash: hashToken(refresh), expires_at: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000), user_agent: userAgent || null, source_ip_masked: ip || null });
    return { accessToken: accessToken(user, membership, familyId), refreshToken: refresh, expiresIn: env.ACCESS_TOKEN_TTL_SECONDS, user: safeUser(user, membership) };
  },
  async refresh(refreshToken, userAgent, ip) {
    const tokenHash = hashToken(refreshToken); const row = await AuthRefreshToken.findOne({ where: { token_hash: tokenHash } });
    if (!row || row.revoked_at || new Date(row.expires_at) <= new Date()) throw new AppError(401, "AUTH_INVALID_REFRESH_TOKEN", "Invalid refresh token");
    const user = await AuthUser.findByPk(row.user_id); const membership = await AuthUserTenant.findOne({ where: { user_id: row.user_id, tenant_id: row.tenant_id, active: true } });
    if (!user || user.status !== "enabled" || !membership) throw new AppError(401, "AUTH_INVALID_REFRESH_TOKEN", "Invalid refresh token");
    const replacement = randomToken(); const replacementHash = hashToken(replacement);
    await row.update({ revoked_at: new Date(), replaced_by_hash: replacementHash, last_used_at: new Date() });
    await AuthRefreshToken.create({ user_id: row.user_id, tenant_id: row.tenant_id, family_id: row.family_id, token_hash: replacementHash, expires_at: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000), user_agent: userAgent || null, source_ip_masked: ip || null });
    return { accessToken: accessToken(user, membership, row.family_id), refreshToken: replacement, expiresIn: env.ACCESS_TOKEN_TTL_SECONDS, user: safeUser(user, membership) };
  },
  async logout(refreshToken, familyId) {
    if (refreshToken) await AuthRefreshToken.update({ revoked_at: new Date() }, { where: { token_hash: hashToken(refreshToken), revoked_at: null } });
    if (familyId) await AuthRefreshToken.update({ revoked_at: new Date() }, { where: { family_id: familyId, revoked_at: null } });
  },
  authenticateAccessToken(token) { const payload = verifyAccessToken(token, env.AUTH_TOKEN_SECRET); if (!payload) throw new AppError(401, "AUTH_INVALID_ACCESS_TOKEN", "Invalid or expired access token"); return payload; },
  async ensureActiveSession(payload) { const active = await AuthRefreshToken.findOne({ where: { family_id: payload.familyId, revoked_at: null, expires_at: { [Op.gt]: new Date() } } }); if (!active) throw new AppError(401, "AUTH_SESSION_REVOKED", "Session is no longer active"); return active; },
  async requestPasswordReset(identifier) { const user = await AuthUser.findOne({ where: normalizeIdentifier(identifier) }); if (!user) return { accepted: true }; const token = randomToken(); await AuthPasswordReset.create({ user_id: user.id, token_hash: hashToken(token), expires_at: new Date(Date.now() + env.PASSWORD_RESET_TTL_SECONDS * 1000) }); return { accepted: true, developmentToken: env.IS_PRODUCTION ? undefined : token }; },
  async confirmPasswordReset(token, password) { const row = await AuthPasswordReset.findOne({ where: { token_hash: hashToken(token), used_at: null, expires_at: { [Op.gt]: new Date() } } }); if (!row) throw new AppError(400, "AUTH_INVALID_RESET_TOKEN", "Invalid or expired reset token"); const user = await AuthUser.findByPk(row.user_id); await user.update({ password_hash: await hashPassword(password), password_changed_at: new Date(), failed_login_count: 0, locked_until: null }); await AuthPasswordReset.update({ used_at: new Date() }, { where: { id: row.id } }); await AuthRefreshToken.update({ revoked_at: new Date() }, { where: { user_id: row.user_id, revoked_at: null } }); return { accepted: true }; },
};
