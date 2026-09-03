/**
 * coupon.controller.js
 * Doctor:  GET    /api/v1/coupons               → list all coupons
 *          POST   /api/v1/coupons               → create coupon
 *          PUT    /api/v1/coupons/:id           → update coupon
 *          DELETE /api/v1/coupons/:id           → delete coupon
 * Patient: POST   /api/v1/coupons/validate      → validate a coupon code → returns discount info
 */
import { Op } from "sequelize";
import { Coupon } from "../models/16_monetization.js";
import { ok } from "../middleware/api-response.js";
import { AppError } from "../utils/errors.js";

function tenantId(req) { return req.tenant?.id || 1; }

function requireDoctorRole(req) {
  if (!req.auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  const role = req.auth.membership?.role;
  if (!["doctor", "staff"].includes(role))
    throw new AppError(403, "FORBIDDEN", "Doctors only");
}

// GET /api/v1/coupons
export async function list(req, res, next) {
  try {
    requireDoctorRole(req);
    const rows = await Coupon.findAll({
      where: { tenant_id: tenantId(req) },
      order: [["created_at", "DESC"]],
    });
    return ok(res, 200, rows);
  } catch (e) { return next(e); }
}

// POST /api/v1/coupons
export async function create(req, res, next) {
  try {
    requireDoctorRole(req);
    const { code, discount_type, discount_value, max_uses, expires_at, active } = req.body;
    if (!code || !discount_type || discount_value == null)
      throw new AppError(400, "VALIDATION_ERROR", "code, discount_type, and discount_value are required");
    if (!["percentage", "fixed"].includes(discount_type))
      throw new AppError(400, "VALIDATION_ERROR", "discount_type must be 'percentage' or 'fixed'");
    if (discount_type === "percentage" && (discount_value <= 0 || discount_value > 100))
      throw new AppError(400, "VALIDATION_ERROR", "Percentage must be between 1 and 100");
    const row = await Coupon.create({
      tenant_id: tenantId(req),
      code: code.toUpperCase().trim(),
      discount_type,
      discount_value,
      max_uses: max_uses || null,
      used_count: 0,
      expires_at: expires_at || null,
      active: active ?? true,
    });
    return ok(res, 201, row);
  } catch (e) {
    if (e.name === "SequelizeUniqueConstraintError")
      return next(new AppError(409, "DUPLICATE_CODE", "Coupon code already exists"));
    return next(e);
  }
}

// PUT /api/v1/coupons/:id
export async function update(req, res, next) {
  try {
    requireDoctorRole(req);
    const row = await Coupon.findOne({ where: { id: req.params.id, tenant_id: tenantId(req) } });
    if (!row) throw new AppError(404, "NOT_FOUND", "Coupon not found");
    const fields = ["code", "discount_type", "discount_value", "max_uses", "expires_at", "active"];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        row[f] = f === "code" ? req.body[f].toUpperCase().trim() : req.body[f];
      }
    }
    await row.save();
    return ok(res, 200, row);
  } catch (e) { return next(e); }
}

// DELETE /api/v1/coupons/:id
export async function remove(req, res, next) {
  try {
    requireDoctorRole(req);
    const row = await Coupon.findOne({ where: { id: req.params.id, tenant_id: tenantId(req) } });
    if (!row) throw new AppError(404, "NOT_FOUND", "Coupon not found");
    await row.destroy();
    return ok(res, 200, { deleted: true });
  } catch (e) { return next(e); }
}

// POST /api/v1/coupons/validate  { code }  → returns discount info (patient or public)
export async function validate(req, res, next) {
  try {
    const { code } = req.body;
    if (!code) throw new AppError(400, "VALIDATION_ERROR", "code is required");

    const coupon = await Coupon.findOne({
      where: {
        tenant_id: tenantId(req),
        code: code.toUpperCase().trim(),
        active: true,
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } },
        ],
      },
    });
    if (!coupon) throw new AppError(404, "COUPON_INVALID", "Coupon not found or expired");

    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses)
      throw new AppError(410, "COUPON_EXHAUSTED", "Coupon usage limit reached");

    return ok(res, 200, {
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
    });
  } catch (e) { return next(e); }
}

export const couponController = { list, create, update, remove, validate };
