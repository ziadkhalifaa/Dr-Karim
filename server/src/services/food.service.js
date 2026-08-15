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
  }
};

export default foodService;
