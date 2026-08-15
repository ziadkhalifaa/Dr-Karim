import { sequelize } from "../config/database.js";
import { Content, ContentTranslation } from "../models/07_content_services_settings.js";
import { ok } from "../middleware/api-response.js";
import { AppError } from "../utils/errors.js";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF\s]+/g, (match) => match.trim().replace(/\s+/g, "-"))
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .substring(0, 100) + "-" + Date.now();
}

function getTenantId(req) {
  return req.tenant?.id || 1;
}

function requireDoctor(auth) {
  if (!auth) throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  if (!["doctor", "admin"].includes(auth.membership?.role)) throw new AppError(403, "FORBIDDEN", "Doctors only");
}

// ===== PUBLIC ROUTES =====

export async function listArticles(req, res, next) {
  try {
    const locale = req.query.lang || "ar";
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const offset = (page - 1) * limit;

    const { rows, count } = await Content.findAndCountAll({
      where: { status: "published", deleted_at: null },
      include: [
        { model: ContentTranslation, as: "translations", where: { locale }, required: false },
      ],
      order: [["published_at", "DESC"]],
      limit,
      offset,
    });

    return ok(res, 200, {
      articles: rows.map(formatArticle),
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) || 1 },
    });
  } catch (err) { next(err); }
}

export async function getArticle(req, res, next) {
  try {
    const locale = req.query.lang || "ar";
    const { slug } = req.params;

    const content = await Content.findOne({
      where: { slug, status: "published", deleted_at: null },
      include: [{ model: ContentTranslation, as: "translations", where: { locale }, required: false }],
    });

    if (!content) throw new AppError(404, "NOT_FOUND", "Article not found");
    return ok(res, 200, formatArticle(content));
  } catch (err) { next(err); }
}

// ===== DOCTOR ROUTES =====

export async function listAllArticles(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const locale = req.query.lang || "ar";
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status;

    const where = { tenant_id: tenantId, deleted_at: null };
    if (status) where.status = status;

    const { rows, count } = await Content.findAndCountAll({
      where,
      include: [{ model: ContentTranslation, as: "translations", where: { locale }, required: false }],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return ok(res, 200, {
      articles: rows.map(formatArticle),
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) || 1 },
    });
  } catch (err) { next(err); }
}

export async function createArticle(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { title, body, excerpt, authorName, readTimeMinutes, status } = req.body || {};
    if (!title?.trim()) throw new AppError(422, "VALIDATION_ERROR", "Title is required");

    const slug = slugify(title);
    const t = await sequelize.transaction();
    try {
      const article = await Content.create({
        tenant_id: tenantId,
        slug,
        status: status || "draft",
        excerpt: excerpt || null,
        author_name: authorName || null,
        read_time_minutes: readTimeMinutes || null,
        published_at: status === "published" ? new Date() : null,
      }, { transaction: t });

      await ContentTranslation.create({
        content_id: article.id,
        locale: "ar",
        title: title.trim(),
        body: body || "",
      }, { transaction: t });

      await t.commit();
      return ok(res, 201, { id: String(article.id), slug: article.slug });
    } catch (err) { await t.rollback(); throw err; }
  } catch (err) { next(err); }
}

export async function updateArticle(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { title, body, excerpt, authorName, readTimeMinutes, status } = req.body || {};

    const article = await Content.findOne({ where: { id, tenant_id: tenantId, deleted_at: null } });
    if (!article) throw new AppError(404, "NOT_FOUND", "Article not found");

    const updates = {};
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (authorName !== undefined) updates.author_name = authorName;
    if (readTimeMinutes !== undefined) updates.read_time_minutes = readTimeMinutes;
    if (status !== undefined) {
      updates.status = status;
      if (status === "published" && !article.published_at) updates.published_at = new Date();
    }
    await article.update(updates);

    if (title !== undefined || body !== undefined) {
      const trans = await ContentTranslation.findOne({ where: { content_id: id, locale: "ar" } });
      if (trans) {
        await trans.update({ title: title ?? trans.title, body: body ?? trans.body });
      } else {
        await ContentTranslation.create({ content_id: id, locale: "ar", title: title || "", body: body || "" });
      }
    }

    return ok(res, 200, { id: String(article.id), slug: article.slug, status: article.status });
  } catch (err) { next(err); }
}

export async function deleteArticle(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const article = await Content.findOne({ where: { id, tenant_id: tenantId, deleted_at: null } });
    if (!article) throw new AppError(404, "NOT_FOUND", "Article not found");

    await article.update({ deleted_at: new Date(), status: "archived" });
    return ok(res, 200, { deleted: true });
  } catch (err) { next(err); }
}

export async function uploadCover(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const article = await Content.findOne({ where: { id, tenant_id: tenantId, deleted_at: null } });
    if (!article) throw new AppError(404, "NOT_FOUND", "Article not found");

    if (!req.file) throw new AppError(422, "NO_FILE", "No file uploaded");

    // Build public URL  
    const baseUrl = process.env.APP_URL || "";
    const coverUrl = `${baseUrl}/uploads/covers/${req.file.filename}`;
    await article.update({ cover_image_url: coverUrl });

    return ok(res, 200, { coverImageUrl: coverUrl });
  } catch (err) { next(err); }
}

export async function uploadServiceCover(req, res, next) {
  try {
    requireDoctor(req.auth);
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const { Service } = await import("../models/07_content_services_settings.js");
    const service = await Service.findOne({ where: { id, tenant_id: tenantId, deleted_at: null } });
    if (!service) throw new AppError(404, "NOT_FOUND", "Service not found");

    if (!req.file) throw new AppError(422, "NO_FILE", "No file uploaded");

    // Build public URL  
    const baseUrl = process.env.APP_URL || "";
    const coverUrl = `${baseUrl}/uploads/covers/${req.file.filename}`;
    await service.update({ cover_image_url: coverUrl });

    return ok(res, 200, { coverImageUrl: coverUrl });
  } catch (err) { next(err); }
}

// ===== LEGACY ROUTES (kept for compatibility) =====

export async function getAllContent(req, res, next) {
  try {
    const locale = req.query.lang || "ar";
    const contentList = await Content.findAll({
      where: { status: "published", deleted_at: null },
      include: [{ model: ContentTranslation, as: "translations", where: { locale }, required: false }],
      order: [["published_at", "DESC"]],
      limit: 50,
    });
    res.json({ success: true, content: contentList.map(formatArticle) });
  } catch (error) { next(error); }
}

export async function getContentBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const locale = req.query.lang || "ar";
    const content = await Content.findOne({
      where: { slug, status: "published", deleted_at: null },
      include: [{ model: ContentTranslation, as: "translations", where: { locale }, required: false }],
    });
    if (!content) return res.status(404).json({ success: false, message: "Content not found" });
    res.json({ success: true, data: formatArticle(content) });
  } catch (error) { next(error); }
}

function formatArticle(content) {
  const trans = content.translations?.[0] || {};
  return {
    id: String(content.id),
    slug: content.slug,
    status: content.status,
    coverImageUrl: content.cover_image_url || null,
    excerpt: content.excerpt || trans.body?.replace(/<[^>]+>/g, "").substring(0, 180) || "",
    authorName: content.author_name || "د. كريم الليثي",
    readTimeMinutes: content.read_time_minutes || null,
    publishedAt: content.published_at || content.created_at,
    title: trans.title || "",
    body: trans.body || "",
  };
}
