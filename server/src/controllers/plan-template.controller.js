import { models } from "../models/index.js";
import { AppError } from "../utils/errors.js";

const { PlanTemplate } = models;

export const planTemplateController = {
  async list(req, res, next) {
    try {
      const doctorId = req.auth.user.doctor_id;
      if (!doctorId) throw new AppError(403, "FORBIDDEN", "A doctor profile is required");
      const { domain } = req.query;
      
      const where = { tenant_id: req.tenant.id, doctor_id: doctorId };
      if (domain) {
        where.domain = domain;
      }
      
      const templates = await PlanTemplate.findAll({
        where,
        order: [["created_at", "DESC"]],
        raw: true,
      });
      
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const doctorId = req.auth.user.doctor_id;
      if (!doctorId) throw new AppError(403, "FORBIDDEN", "A doctor profile is required");
      const { domain, name, description, content_json, image_url } = req.body;
      
      if (!domain || !name || !content_json) {
        throw new AppError(422, "VALIDATION_ERROR", "Domain, name, and content_json are required");
      }
      if (!["nutrition", "exercise"].includes(domain)) {
        throw new AppError(422, "VALIDATION_ERROR", "Invalid domain");
      }
      
      const template = await PlanTemplate.create({
        tenant_id: req.tenant.id,
        doctor_id: doctorId,
        domain,
        name,
        description: description || null,
        image_url: image_url || null,
        content_json,
      });
      
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const doctorId = req.auth.user.doctor_id;
      if (!doctorId) throw new AppError(403, "FORBIDDEN", "A doctor profile is required");
      const { id } = req.params;
      
      const template = await PlanTemplate.findOne({
        where: { id, tenant_id: req.tenant.id, doctor_id: doctorId },
      });
      
      if (!template) {
        throw new AppError(404, "TEMPLATE_NOT_FOUND", "Plan template not found");
      }
      
      await template.destroy();
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  },
};
