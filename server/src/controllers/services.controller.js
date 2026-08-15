import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { Service, ServiceTranslation, ServiceCategory, ServiceCategoryTranslation } from "../models/07_content_services_settings.js";
import { ok } from "../middleware/api-response.js";
import { AppError } from "../utils/errors.js";

function getTenantId(req) {
  return req.tenant?.id || 1;
}

function requireDoctor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  if (!["doctor", "admin"].includes(auth.membership?.role)) throw new AppError(403, "FORBIDDEN", "Doctors only");
}

export async function listServiceCategories(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const locale = req.query.lang || "ar";

    const categories = await ServiceCategory.findAll({
      where: { tenant_id: tenantId, deleted_at: null },
      include: [{ model: ServiceCategoryTranslation, as: "translations", where: { locale }, required: false }],
      order: [["sort_order", "ASC"]],
    });

    const data = categories.map((cat) => ({
      id: String(cat.id),
      code: cat.code,
      title: cat.translations?.[0]?.name || cat.code,
      active: cat.active,
    }));

    return ok(res, 200, { categories: data });
  } catch (err) { next(err); }
}

export async function listAllServices(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const locale = req.query.lang || "ar";

    const services = await Service.findAll({
      where: { tenant_id: tenantId, deleted_at: null },
      include: [{ model: ServiceTranslation, as: "translations", where: { locale }, required: false }],
      order: [["sort_order", "ASC"]],
    });

    const data = services.map((svc) => ({
      id: String(svc.id),
      code: svc.code,
      title: svc.translations?.[0]?.name || svc.code,
      body: svc.translations?.[0]?.description || "",
      coverImageUrl: svc.cover_image_url || null,
      categoryId: svc.service_category_id ? String(svc.service_category_id) : null,
      status: svc.status,
    }));

    return ok(res, 200, { services: data });
  } catch (err) { next(err); }
}

export async function createService(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { title, body, code, serviceCategoryId } = req.body || {};
    if (!title?.trim()) throw new AppError(422, "VALIDATION_ERROR", "Title is required");

    const safeCode = code || `svc-${Date.now()}`;
    const t = await sequelize.transaction();
    try {
      const service = await Service.create({
        tenant_id: tenantId,
        code: safeCode,
        service_category_id: serviceCategoryId ? Number(serviceCategoryId) : null,
        status: "active",
      }, { transaction: t });

      await ServiceTranslation.create({
        service_id: service.id,
        locale: "ar",
        name: title.trim(),
        description: body || "",
      }, { transaction: t });

      await t.commit();
      return ok(res, 201, { id: String(service.id), code: service.code });
    } catch (err) { await t.rollback(); throw err; }
  } catch (err) { next(err); }
}

export async function updateService(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { title, body, status, serviceCategoryId } = req.body || {};

    const service = await Service.findOne({ where: { id, tenant_id: tenantId, deleted_at: null } });
    if (!service) throw new AppError(404, "NOT_FOUND", "Service not found");

    if (status !== undefined) {
      await service.update({ status });
    }

    if (serviceCategoryId !== undefined) {
      await service.update({ service_category_id: serviceCategoryId ? Number(serviceCategoryId) : null });
    }

    if (title !== undefined || body !== undefined) {
      const trans = await ServiceTranslation.findOne({ where: { service_id: id, locale: "ar" } });
      if (trans) {
        await trans.update({ name: title ?? trans.name, description: body ?? trans.description });
      } else {
        await ServiceTranslation.create({ service_id: id, locale: "ar", name: title || "", description: body || "" });
      }
    }

    return ok(res, 200, { id: String(service.id), status: service.status });
  } catch (err) { next(err); }
}

export async function deleteService(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const service = await Service.findOne({ where: { id, tenant_id: tenantId, deleted_at: null } });
    if (!service) throw new AppError(404, "NOT_FOUND", "Service not found");

    await service.update({ deleted_at: new Date(), status: "archived" });
    return ok(res, 200, { deleted: true });
  } catch (err) { next(err); }
}
