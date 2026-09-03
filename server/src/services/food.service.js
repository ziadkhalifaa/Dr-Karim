import { Op } from "sequelize";
import { models } from "../models/index.js";
import { AppError } from "../utils/errors.js";

const { FoodItem } = models;

function escapeLike(value) {
  return String(value || "").replace(/[\\%_]/gu, (m) => `\\${m}`);
}

export const foodService = {
  async list({ query = {} }) {
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
    const page = Math.max(Number(query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const where = { active: true };
    if (query.q && String(query.q).trim()) {
      const like = { [Op.like]: `%${escapeLike(query.q)}%` };
      where[Op.or] = [{ name_ar: like }, { name_en: like }];
    }
    
    if (query.category) {
      where.category_code = query.category;
    }

    const { rows, count } = await FoodItem.findAndCountAll({
      where,
      limit,
      offset,
      order: [["name_ar", "ASC"]],
      raw: true,
    });

    return {
      items: rows.map(row => ({
        id: String(row.id),
        code: row.code,
        nameAr: row.name_ar,
        nameEn: row.name_en,
        category: row.category_code,
        unit: row.unit,
        macros: row.macros_json || {}
      })),
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) || 1 }
    };
  },

  async create(data) {
    if (!data.nameAr) throw new AppError("الاسم بالعربية مطلوب", 400);
    // Generate a unique code if none provided
    const code = data.code || `food_${Date.now().toString(36)}`;
    const item = await FoodItem.create({
      code,
      name_ar: data.nameAr,
      name_en: data.nameEn || "",
      category_code: data.category || "general",
      unit: data.unit || "100g",
      macros_json: data.macros || {},
      active: true,
    });
    return {
      id: String(item.id),
      code: item.code,
      nameAr: item.name_ar,
      nameEn: item.name_en,
      category: item.category_code,
      unit: item.unit,
      macros: item.macros_json || {}
    };
  },

  async update(id, data) {
    const item = await FoodItem.findByPk(id);
    if (!item) throw new AppError("الصنف غير موجود", 404);

    if (data.nameAr !== undefined) item.name_ar = data.nameAr;
    if (data.nameEn !== undefined) item.name_en = data.nameEn;
    if (data.category !== undefined) item.category_code = data.category;
    if (data.unit !== undefined) item.unit = data.unit;
    if (data.macros !== undefined) item.macros_json = data.macros;
    if (data.active !== undefined) item.active = data.active;

    await item.save();

    return {
      id: String(item.id),
      code: item.code,
      nameAr: item.name_ar,
      nameEn: item.name_en,
      category: item.category_code,
      unit: item.unit,
      macros: item.macros_json || {},
      active: item.active
    };
  },

  async remove(id) {
    const item = await FoodItem.findByPk(id);
    if (!item) throw new AppError("الصنف غير موجود", 404);
    
    // Soft delete to preserve references in existing meals
    item.active = false;
    await item.save();
    return { success: true };
  }
};

export default foodService;
