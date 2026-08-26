import { ok } from "../middleware/api-response.js";
import { storeService } from "../services/store.service.js";
import fs from "node:fs";
import path from "node:path";
import { uploadsRoot } from "../config/uploads.js";

function getTenantId(req) {
  return req.tenant?.id || 1;
}
function requireDoctor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  if (!["doctor", "admin"].includes(auth.membership?.role)) throw new AppError(403, "FORBIDDEN", "Doctors only");
}

/* ===================== PUBLIC ===================== */
export async function publicProducts(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    const q = req.query;
    const cats = q.category ? String(q.category).split(",").map(Number).filter(Boolean) : null;
    const result = await storeService.listProducts(tenantId, {
      status: "active",
      search: q.search || undefined,
      categoryIds: cats && cats.length ? cats : undefined,
      featured: q.featured === "1" || q.featured === "true" ? true : undefined,
      freeShipping: q.freeShipping === "1" || q.freeShipping === "true" || q.freeShipping === "on" ? true : undefined,
      ratingMin: q.rating || undefined,
      priceMin: q.priceMin || undefined,
      priceMax: q.priceMax || undefined,
      inStock: q.inStock === "1" || q.inStock === "true" || q.inStock === "on" ? true : undefined,
      sort: q.sort || undefined,
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 24,
    });
    return ok(res, 200, result);
  } catch (err) { next(err); }
}

export async function publicCategories(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    const cats = await storeService.listCategories(tenantId, { onlyActive: true });
    return ok(res, 200, { categories: cats });
  } catch (err) { next(err); }
}

export async function publicProduct(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    const product = await storeService.getProductBySlug(tenantId, req.params.slug);
    return ok(res, 200, { product });
  } catch (err) { next(err); }
}

export async function getReviews(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    const product = await storeService.getProductBySlug(tenantId, req.params.slug);
    const reviews = await storeService.listReviews(tenantId, product.id);
    return ok(res, 200, { reviews });
  } catch (err) { next(err); }
}

export async function postReview(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    const product = await storeService.getProductBySlug(tenantId, req.params.slug);
    const userId = req.auth?.user?.id;
    if (!userId) throw new AppError(401, "UNAUTHENTICATED", "سجّل الدخول كمريض لتقييم المنتج");
    const review = await storeService.createReview(tenantId, product.id, userId, {
      rating: req.body?.rating,
      comment: req.body?.comment,
      orderId: req.body?.orderId,
      images: req.body?.images,
    });
    return ok(res, 201, { review });
  } catch (err) { next(err); }
}

export async function uploadReviewImages(req, res, next) {
  try {
    requireRole(req.auth, "patient");
    const files = req.files || [];
    const urls = files.map((f) => `/uploads/reviews/${f.filename}`);
    return ok(res, 200, { urls });
  } catch (err) { next(err); }
}

export async function doctorReviews(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const reviews = await storeService.listAllReviews(tenantId);
    return ok(res, 200, { reviews });
  } catch (err) { next(err); }
}

export async function doctorReplyReview(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const review = await storeService.doctorReply(tenantId, req.params.id, {
      reply: req.body?.reply,
      doctorId: req.auth?.user?.id,
    });
    return ok(res, 200, { review });
  } catch (err) { next(err); }
}

export async function deleteReview(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const result = await storeService.deleteReview(tenantId, req.params.id);
    return ok(res, 200, result);
  } catch (err) { next(err); }
}

export async function checkout(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    // patientId is only trusted if the caller is authenticated as that patient.
    let patientId = null;
    if (req.auth?.membership?.role === "patient" && req.body?.patientId) {
      patientId = req.body.patientId;
    }
    const order = await storeService.createOrder(tenantId, {
      ...req.body,
      patientId,
      userId: req.auth?.user?.id,
    });
    return ok(res, 201, { order });
  } catch (err) { next(err); }
}

export async function submitPayment(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    const payment = await storeService.createPayment(tenantId, req.params.id, req.body || {});
    return ok(res, 201, { payment });
  } catch (err) { next(err); }
}

/* ===================== DOCTOR: CATEGORIES ===================== */
export async function doctorCategories(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const cats = await storeService.listCategories(tenantId);
    return ok(res, 200, { categories: cats });
  } catch (err) { next(err); }
}
export async function createCategory(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const cat = await storeService.createCategory(tenantId, req.body || {});
    return ok(res, 201, { category: cat });
  } catch (err) { next(err); }
}
export async function updateCategory(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const cat = await storeService.updateCategory(tenantId, req.params.id, req.body || {});
    return ok(res, 200, { category: cat });
  } catch (err) { next(err); }
}
export async function deleteCategory(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const r = await storeService.deleteCategory(tenantId, req.params.id);
    return ok(res, 200, r);
  } catch (err) { next(err); }
}

/* ===================== DOCTOR: PRODUCTS ===================== */
export async function doctorProducts(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const r = await storeService.listAllProducts(tenantId);
    return ok(res, 200, { products: r.products, categoryCounts: r.categoryCounts });
  } catch (err) { next(err); }
}
export async function createProduct(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const product = await storeService.createProduct(tenantId, req.body || {});
    return ok(res, 201, { product });
  } catch (err) { next(err); }
}
export async function updateProduct(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const product = await storeService.updateProduct(tenantId, req.params.id, req.body || {});
    return ok(res, 200, { product });
  } catch (err) { next(err); }
}
export async function deleteProduct(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const r = await storeService.deleteProduct(tenantId, req.params.id);
    return ok(res, 200, r);
  } catch (err) { next(err); }
}
export async function uploadProductImage(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    if (!req.file) throw new AppError(422, "VALIDATION_ERROR", "لم يتم رفع صورة");
    const baseUrl = process.env.APP_URL || "";
    const url = `${baseUrl}/uploads/products/${req.file.filename}`;
    const product = await storeService.appendProductImage(tenantId, req.params.id, url);
    return ok(res, 200, { product });
  } catch (err) { next(err); }
}

/* ===================== DOCTOR: ORDERS / PAYMENTS ===================== */
export async function doctorOrders(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const result = await storeService.listOrders(tenantId, {
      status: req.query.status || undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 30,
    });
    return ok(res, 200, result);
  } catch (err) { next(err); }
}
export async function doctorOrder(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const order = await storeService.getOrder(tenantId, req.params.id);
    return ok(res, 200, { order });
  } catch (err) { next(err); }
}
export async function updateOrderStatus(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const order = await storeService.updateOrderStatus(tenantId, req.params.id, req.body?.status);
    return ok(res, 200, { order });
  } catch (err) { next(err); }
}
export async function doctorPayments(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const payments = await storeService.listPayments(tenantId, { status: req.query.status || "pending" });
    return ok(res, 200, { payments });
  } catch (err) { next(err); }
}
export async function reviewPayment(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const approve = req.body?.action === "approve";
    const result = await storeService.reviewPayment(tenantId, req.params.id, {
      approve,
      reviewerId: req.auth?.user?.id,
      reason: req.body?.reason,
    });
    return ok(res, 200, result);
  } catch (err) { next(err); }
}

/* TEMP PERSISTENCE TEST */
export async function persistTest(req, res) {
  const p = path.join(uploadsRoot, ".persist-test.txt");
  if (req.query.clean === "1") { try { fs.unlinkSync(p); } catch {} return res.json({ cleaned: true }); }
  if (req.query.write === "1") {
    fs.writeFileSync(p, `written-at-${Date.now()}`);
    return res.json({ wrote: true, path: p, uploadsRoot });
  }
  let exists = false, content = null;
  try { content = fs.readFileSync(p, "utf8"); exists = true; } catch {}
  return res.json({ exists, content, uploadsRoot, path: p });
}
