import { Package, PackageEntitlement } from "../models/16_monetization.js";
import { ok } from "../middleware/api-response.js";
import { AppError } from "../utils/errors.js";
import { sequelize } from "../config/database.js";

function getTenantId(req) {
  return req.tenant?.id || 1;
}

function requireDoctor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  if (!["doctor", "admin"].includes(auth.membership?.role)) throw new AppError(403, "FORBIDDEN", "Doctors only");
}

export async function listPackages(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);

    const packages = await Package.findAll({
      where: { tenant_id: tenantId },
      order: [["sort_order", "ASC"]],
    });

    const entitlements = await PackageEntitlement.findAll({
      where: { package_id: packages.map(p => p.id) },
    });

    const data = packages.map(pkg => {
      const features = entitlements.filter(e => e.package_id === pkg.id);
      return {
        id: String(pkg.id),
        name: pkg.name,
        slug: pkg.slug,
        description: pkg.description,
        durationValue: pkg.duration_value,
        durationUnit: pkg.duration_unit,
        price: Number(pkg.price),
        currency: pkg.currency,
        active: pkg.active,
        sortOrder: pkg.sort_order,
        features: features.map(f => ({
          id: String(f.id),
          code: f.code,
          allowed: f.allowed,
        })),
      };
    });

    return ok(res, 200, { packages: data });
  } catch (err) { next(err); }
}

export async function createPackage(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { name, slug, description, durationValue, durationUnit, price, active, features } = req.body || {};

    if (!name || !slug || !price) throw new AppError(422, "VALIDATION_ERROR", "Missing required fields");

    const t = await sequelize.transaction();
    try {
      const maxSort = await Package.max("sort_order", { where: { tenant_id: tenantId } });
      const newPkg = await Package.create({
        tenant_id: tenantId,
        name,
        slug,
        description: description || null,
        duration_value: durationValue || 1,
        duration_unit: durationUnit || "month",
        price,
        active: active !== undefined ? active : true,
        sort_order: (maxSort || 0) + 1,
      }, { transaction: t });

      if (features && features.length > 0) {
        const entData = features.map(f => ({
          tenant_id: tenantId,
          package_id: newPkg.id,
          code: f.code || f,
          allowed: typeof f.allowed === "boolean" ? f.allowed : true,
        }));
        await PackageEntitlement.bulkCreate(entData, { transaction: t });
      }

      await t.commit();
      return ok(res, 201, { id: String(newPkg.id) });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) { next(err); }
}

export async function updatePackage(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { name, slug, description, durationValue, durationUnit, price, active, features } = req.body || {};

    const pkg = await Package.findOne({ where: { id, tenant_id: tenantId } });
    if (!pkg) throw new AppError(404, "NOT_FOUND", "Package not found");

    const t = await sequelize.transaction();
    try {
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (slug !== undefined) updates.slug = slug;
      if (description !== undefined) updates.description = description;
      if (durationValue !== undefined) updates.duration_value = durationValue;
      if (durationUnit !== undefined) updates.duration_unit = durationUnit;
      if (price !== undefined) updates.price = price;
      if (active !== undefined) updates.active = active;

      await pkg.update(updates, { transaction: t });

      if (features) {
        await PackageEntitlement.destroy({ where: { package_id: id }, transaction: t });
        if (features.length > 0) {
          const entData = features.map(f => ({
            tenant_id: tenantId,
            package_id: id,
            code: f.code || f,
            allowed: typeof f.allowed === "boolean" ? f.allowed : true,
          }));
          await PackageEntitlement.bulkCreate(entData, { transaction: t });
        }
      }

      await t.commit();
      return ok(res, 200, { id: String(pkg.id) });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) { next(err); }
}

export async function deletePackage(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const pkg = await Package.findOne({ where: { id, tenant_id: tenantId } });
    if (!pkg) throw new AppError(404, "NOT_FOUND", "Package not found");

    // Soft delete not supported on Package out of the box in this schema, so we physically delete
    // or we just set active=false. We will set active=false to avoid breaking existing subscriptions.
    await pkg.update({ active: false });
    
    return ok(res, 200, { success: true });
  } catch (err) { next(err); }
}
