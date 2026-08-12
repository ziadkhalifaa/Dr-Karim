import { Content, ContentTranslation, ContentCategory, ContentCategoryTranslation } from "../models/07_content_services_settings.js";

/**
 * Get all content entries grouped by category, with translations.
 */
export async function getAllContent(req, res, next) {
  try {
    const locale = req.query.lang || "ar";

    // We assume tenant_id = 1 for the clinic since it's a single-clinic app
    const categories = await ContentCategory.findAll({
      where: { active: true },
      include: [
        {
          model: ContentCategoryTranslation,
          as: "translations",
          where: { locale },
          required: false,
        },
      ],
      order: [["sort_order", "ASC"]],
    });

    const contentList = await Content.findAll({
      where: { status: "published" },
      include: [
        {
          model: ContentTranslation,
          as: "translations",
          where: { locale },
          required: false,
        },
      ],
    });

    res.json({ success: true, categories, content: contentList });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single content entry by slug
 */
export async function getContentBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const locale = req.query.lang || "ar";

    const content = await Content.findOne({
      where: { slug, status: "published" },
      include: [
        {
          model: ContentTranslation,
          as: "translations",
          where: { locale },
          required: false,
        },
      ],
    });

    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
}
