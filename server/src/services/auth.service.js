import crypto from "node:crypto";
import { Op } from "sequelize";
import { models, sequelize } from "../models/index.js";
import env from "../config/env.js";
import { canonicalizeEgyptianPhone } from "../config/phone.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, verifyPassword, randomToken, hashToken, signAccessToken, verifyAccessToken } from "../utils/auth-crypto.js";
import { tenantService } from "./tenant.service.js";

const { AuthUser, AuthUserTenant, AuthRefreshToken, AuthPasswordReset, Tenant, AssessmentSession, DoctorReview, Patient } = models;
const AUTH_INVALID = "AUTH_INVALID_CREDENTIALS";

function canonicalPhoneOrThrow(value) {
  try { return canonicalizeEgyptianPhone(value); } catch { throw new AppError(422, "REGISTRATION_PHONE_INVALID", "A valid Egyptian phone number is required"); }
}

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
  // Phase 6D patient onboarding: account creation right after assessment
  // submission. Creates Patient (pending_payment) + AuthUser + membership, and
  // binds the account to the assessment session's review so the doctor's
  // clinical confirmation later resolves into the same person.
  async register({ fullName, phone, password, email, assessmentReference, tenantSlug, userAgent, ip }) {
    const canonicalPhone = canonicalPhoneOrThrow(phone);
    const name = String(fullName || "").trim().slice(0, 100);
    if (!name) throw new AppError(422, "REGISTRATION_VALIDATION_ERROR", "Full name is required");
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      throw new AppError(422, "REGISTRATION_VALIDATION_ERROR", "Password must be 8–128 characters");
    }
    const safeEmail = email && typeof email === "string" && email.includes("@") ? email.toLowerCase().trim().slice(0, 190) : null;

    const tenant = await tenantService.resolveOrThrow(tenantSlug || env.DEFAULT_TENANT_SLUG);

    const existing = await AuthUser.findOne({ where: { phone_canonical: canonicalPhone } });
    if (existing) throw new AppError(409, "ACCOUNT_ALREADY_EXISTS", "An account with this phone number already exists");

    // Optional link to the completed assessment: dedupe existing accounts by
    // reusing the patient a doctor already confirmed from this session.
    const session = assessmentReference
      ? await AssessmentSession.findOne({ where: { tenant_id: tenant.id, status: "submitted", [Op.or]: [{ session_token: assessmentReference }, { reference_number: assessmentReference }] } })
      : null;
    if (assessmentReference && !session) throw new AppError(422, "REGISTRATION_ASSESSMENT_NOT_FOUND", "Assessment reference not found");

    let boundReview = null;
    if (session) boundReview = await DoctorReview.findOne({ where: { assessment_session_id: session.id, tenant_id: tenant.id }, attributes: ["id", "patient_id"] });

    let created;
    await sequelize.transaction(async (t) => {
      let patientId = boundReview?.patient_id || null;
      if (!patientId) {
        const patient = await Patient.create({
          tenant_id: tenant.id,
          full_name: name,
          email: safeEmail,
          phone_canonical: canonicalPhone,
          phone_display: String(phone || "").trim(),
          status: "pending_payment", // activated by an approved payment (§6D)
          source_session_id: session?.id || null,
        }, { transaction: t });
        patientId = patient.id;
        if (session && boundReview) await DoctorReview.update({ patient_id: patient.id }, { where: { id: boundReview.id }, transaction: t });
      }
      const user = await AuthUser.create({
        email: safeEmail,
        phone_canonical: canonicalPhone,
        password_hash: await hashPassword(password),
        user_type: "patient",
        patient_id: patientId,
        status: "enabled",
      }, { transaction: t });
      await AuthUserTenant.create({ user_id: user.id, tenant_id: tenant.id, role: "patient", active: true }, { transaction: t });
      created = user;
    });

    const membership = await membershipFor(created.id, tenant.slug);
    const familyId = crypto.randomUUID(); const refresh = randomToken();
    await AuthRefreshToken.create({ user_id: created.id, tenant_id: membership.tenant_id, family_id: familyId, token_hash: hashToken(refresh), expires_at: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000), user_agent: userAgent || null, source_ip_masked: ip || null });
    return { accessToken: accessToken(created, membership, familyId), refreshToken: refresh, expiresIn: env.ACCESS_TOKEN_TTL_SECONDS, user: safeUser(created, membership) };
  },
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
