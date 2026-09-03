/**
 * testimonial.controller.js
 * Public:  GET  /api/v1/public/testimonials         → list published testimonials
 * Doctor:  GET  /api/v1/testimonials                → list all (incl. unpublished)
 *          POST /api/v1/testimonials                → create
 *          PUT  /api/v1/testimonials/:id            → update
 *          DELETE /api/v1/testimonials/:id          → delete
 */
import { Testimonial } from "../models/07_content_services_settings.js";
import { ok } from "../middleware/api-response.js";
import { AppError } from "../utils/errors.js";

function tenantId(req) { return req.tenant?.id || 1; }

function requireDoctorRole(req) {
  if (!req.auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  const role = req.auth.membership?.role;
  if (!["doctor", "staff"].includes(role))
    throw new AppError(403, "FORBIDDEN", "Doctors only");
}

// GET /api/v1/public/testimonials — public, published only
export async function listPublic(req, res, next) {
  try {
    const rows = await Testimonial.findAll({
      where: { tenant_id: tenantId(req), is_published: true },
      order: [["sort_order", "ASC"], ["created_at", "DESC"]],
      attributes: ["id", "patient_name", "patient_subtitle", "content", "rating", "image_url"],
    });
    return ok(res, 200, rows);
  } catch (e) { return next(e); }
}

// GET /api/v1/testimonials — doctor, all including unpublished
export async function listAll(req, res, next) {
  try {
    requireDoctorRole(req);
    const rows = await Testimonial.findAll({
      where: { tenant_id: tenantId(req) },
      order: [["sort_order", "ASC"], ["created_at", "DESC"]],
    });
    return ok(res, 200, rows);
  } catch (e) { return next(e); }
}

// POST /api/v1/testimonials
export async function create(req, res, next) {
  try {
    requireDoctorRole(req);
    const { patient_name, patient_subtitle, content, rating, image_url, is_published, sort_order } = req.body;
    if (!patient_name || !content) throw new AppError(400, "VALIDATION_ERROR", "patient_name and content are required");
    const row = await Testimonial.create({
      tenant_id: tenantId(req),
      patient_name,
      patient_subtitle: patient_subtitle || null,
      content,
      rating: rating ?? 5,
      image_url: image_url || null,
      is_published: is_published ?? false,
      sort_order: sort_order ?? 0,
    });
    return ok(res, 201, row);
  } catch (e) { return next(e); }
}

// PUT /api/v1/testimonials/:id
export async function update(req, res, next) {
  try {
    requireDoctorRole(req);
    const row = await Testimonial.findOne({ where: { id: req.params.id, tenant_id: tenantId(req) } });
    if (!row) throw new AppError(404, "NOT_FOUND", "Testimonial not found");
    const fields = ["patient_name", "patient_subtitle", "content", "rating", "image_url", "is_published", "sort_order"];
    for (const f of fields) { if (req.body[f] !== undefined) row[f] = req.body[f]; }
    await row.save();
    return ok(res, 200, row);
  } catch (e) { return next(e); }
}

// DELETE /api/v1/testimonials/:id
export async function remove(req, res, next) {
  try {
    requireDoctorRole(req);
    const row = await Testimonial.findOne({ where: { id: req.params.id, tenant_id: tenantId(req) } });
    if (!row) throw new AppError(404, "NOT_FOUND", "Testimonial not found");
    await row.destroy();
    return ok(res, 200, { deleted: true });
  } catch (e) { return next(e); }
}

export const testimonialController = { listPublic, listAll, create, update, remove };
