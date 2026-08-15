/**
 * public.controller.js
 * Handles all public-facing endpoints:
 *  - GET  /services         → list services (from DB, with translations)
 *  - GET  /settings         → clinic info + platform settings
 *  - POST /contact          → store a contact form submission
 *  - GET  /doctor/contacts  → doctor sees all contact messages (protected)
 */
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import {
  Service, ServiceTranslation, ServiceCategory, ServiceCategoryTranslation,
  ClinicInfo, PlatformSetting,
} from "../models/07_content_services_settings.js";
import { ok } from "../middleware/api-response.js";
import { AppError } from "../utils/errors.js";

// ────────────────────────────────────────────────────────────
// Contact Message model (lazily defined here to avoid migration
// changes — uses "contact_message" table synced on startup).
// ────────────────────────────────────────────────────────────
export const ContactMessage = sequelize.define(
  "contact_message",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: 1 },
    name: { type: DataTypes.STRING(190), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: "contact_message", underscored: true }
);

// Auto-create table if it doesn't exist (safe, non-destructive)
ContactMessage.sync({ alter: false, force: false }).catch(() => {
  // Try with alter on failure (first boot)
  ContactMessage.sync({ alter: true }).catch(console.error);
});

function getTenantId(req) {
  return req.tenant?.id || 1;
}

function requireDoctor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  if (!["doctor", "admin"].includes(auth.membership?.role))
    throw new AppError(403, "FORBIDDEN", "Doctors only");
}

// ──────────────────────────
// GET /api/v1/public/services
// ──────────────────────────
export async function listServices(req, res, next) {
  try {
    const locale = req.query.lang || "ar";

    const categories = await ServiceCategory.findAll({
      where: { active: true, deleted_at: null },
      include: [
        {
          model: ServiceCategoryTranslation,
          as: "translations",
          where: { locale },
          required: false,
        },
        {
          model: Service,
          as: "services",
          where: { status: "active", deleted_at: null },
          required: false,
          include: [
            {
              model: ServiceTranslation,
              as: "translations",
              where: { locale },
              required: false,
            },
          ],
        },
      ],
      order: [["sort_order", "ASC"]],
    });

    const data = categories.map((cat) => ({
      id: String(cat.id),
      code: cat.code,
      title: cat.translations?.[0]?.name || cat.code,
      description: cat.translations?.[0]?.description || "",
      items: (cat.services || []).map((svc) => ({
        id: String(svc.id),
        code: svc.code,
        title: svc.translations?.[0]?.name || svc.code,
        body: svc.translations?.[0]?.description || "",
        coverImageUrl: svc.cover_image_url || null,
      })),
    }));

    return ok(res, 200, { groups: data });
  } catch (err) { next(err); }
}

import { Package, PackageEntitlement } from "../models/16_monetization.js";

// ──────────────────────────
// GET /api/v1/public/packages
// ──────────────────────────
export async function listPackages(req, res, next) {
  try {
    const packages = await Package.findAll({
      where: { active: true, tenant_id: 1 },
      order: [["sort_order", "ASC"]],
    });

    const entitlements = await PackageEntitlement.findAll({
      where: { package_id: packages.map(p => p.id) },
    });

    const data = packages.map(pkg => {
      const features = entitlements.filter(e => e.package_id === pkg.id && e.allowed);
      return {
        id: String(pkg.id),
        name: pkg.name,
        slug: pkg.slug,
        description: pkg.description,
        durationValue: pkg.duration_value,
        durationUnit: pkg.duration_unit,
        price: Number(pkg.price),
        currency: pkg.currency,
        features: features.map(f => f.code), // Code will be translated on frontend or stored as ar
      };
    });

    return ok(res, 200, { packages: data });
  } catch (err) { next(err); }
}

// ──────────────────────────────
// GET /api/v1/public/settings
// ──────────────────────────────
export async function getPublicSettings(req, res, next) {
  try {
    const tenantId = 1; // clinic info is always for tenant 1 on this single-tenant deployment

    // Clinic info (name, address, phones, email)
    const clinic = await ClinicInfo.findOne({
      where: { tenant_id: tenantId, active: true },
    });

    // Platform settings — fetch all public-facing keys
    const PUBLIC_KEYS = ["whatsapp_number", "facebook_url", "youtube_url", "tiktok_url", "maps_url", "phone_1", "phone_2", "email"];
    const settings = await PlatformSetting.findAll({
      where: { tenant_id: tenantId, key: PUBLIC_KEYS },
    });

    const settingsMap = {};
    for (const s of settings) settingsMap[s.key] = s.value;

    return ok(res, 200, {
      clinic: clinic
        ? {
            name: clinic.name,
            address: clinic.address,
            phone: clinic.phone_display || settingsMap.phone_1 || null,
            email: clinic.email || settingsMap.email || null,
          }
        : null,
      social: {
        whatsapp: settingsMap.whatsapp_number || null,
        facebook: settingsMap.facebook_url || null,
        youtube: settingsMap.youtube_url || null,
        tiktok: settingsMap.tiktok_url || null,
      },
      maps: settingsMap.maps_url || null,
    });
  } catch (err) { next(err); }
}

// ──────────────────────────────
// POST /api/v1/public/contact
// ──────────────────────────────
export async function submitContact(req, res, next) {
  try {
    const { name, email, message } = req.body || {};
    if (!name?.trim()) throw new AppError(422, "VALIDATION_ERROR", "الاسم مطلوب");
    if (!message?.trim()) throw new AppError(422, "VALIDATION_ERROR", "الرسالة مطلوبة");

    const record = await ContactMessage.create({
      tenant_id: 1,
      name: name.trim(),
      email: email?.trim() || null,
      message: message.trim(),
    });

    return ok(res, 201, { id: String(record.id), success: true });
  } catch (err) { next(err); }
}

// ──────────────────────────────────────
// GET /api/v1/public/doctor/contacts
// (doctor only — see all messages)
// ──────────────────────────────────────
export async function listContacts(req, res, next) {
  try {
    requireDoctor(req.auth);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await ContactMessage.findAndCountAll({
      where: { tenant_id: 1 },
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return ok(res, 200, {
      messages: rows.map((m) => ({
        id: String(m.id),
        name: m.name,
        email: m.email,
        message: m.message,
        isRead: m.is_read,
        createdAt: m.created_at,
      })),
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) || 1 },
    });
  } catch (err) { next(err); }
}

// ──────────────────────────────────────
// PATCH /api/v1/public/doctor/contacts/:id/read
// ──────────────────────────────────────
export async function markContactRead(req, res, next) {
  try {
    requireDoctor(req.auth);
    const msg = await ContactMessage.findOne({ where: { id: req.params.id } });
    if (!msg) throw new AppError(404, "NOT_FOUND", "Message not found");
    await msg.update({ is_read: true });
    return ok(res, 200, { success: true });
  } catch (err) { next(err); }
}
