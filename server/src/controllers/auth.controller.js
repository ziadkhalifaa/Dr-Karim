import { ok } from "../middleware/api-response.js";
import { authService } from "../services/auth.service.js";

export const authController = {
  async login(req, res, next) { try { return ok(res, 200, await authService.login({ ...req.body, tenantSlug: req.body?.tenantSlug || req.headers["x-tenant-slug"], userAgent: req.get("user-agent"), ip: req.ip })); } catch (err) { return next(err); } },
  async refresh(req, res, next) { try { return ok(res, 200, await authService.refresh(req.body?.refreshToken, req.get("user-agent"), req.ip)); } catch (err) { return next(err); } },
  async logout(req, res, next) { try { await authService.logout(req.body?.refreshToken, req.auth?.token?.familyId); return ok(res, 200, { loggedOut: true }); } catch (err) { return next(err); } },
  async me(req, res, next) { try { if (!req.auth) return next(new Error("auth middleware missing")); return ok(res, 200, { id: String(req.auth.user.id), role: req.auth.membership.role, tenantId: String(req.auth.membership.tenant_id), userType: req.auth.user.user_type, doctorId: req.auth.user.doctor_id ? String(req.auth.user.doctor_id) : null, patientId: req.auth.user.patient_id ? String(req.auth.user.patient_id) : null }); } catch (err) { return next(err); } },
  async requestReset(req, res, next) { try { return ok(res, 202, await authService.requestPasswordReset(req.body?.identifier)); } catch (err) { return next(err); } },
  async confirmReset(req, res, next) { try { return ok(res, 200, await authService.confirmPasswordReset(req.body?.token, req.body?.password)); } catch (err) { return next(err); } },
};
