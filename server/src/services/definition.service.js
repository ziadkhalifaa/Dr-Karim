import { models } from "../models/index.js";
import { AppError, ERROR_CODES } from "../utils/errors.js";

const { AssessmentDefinition, QuestionVersionCfg, QuestionCatalog } = models;

export const definitionService = {
  // Resolve the active published definition (Phase 1 seed: nutrition-assessment v1.0).
  // Exactly one active definition is permitted (architecture §4).
  async loadActive(options = {}) {
    const t = options.transaction;
    const def = await AssessmentDefinition.findOne({
      where: { is_active: true, status: "published" },
      transaction: t,
      raw: true,
    });
    if (!def) {
      throw new AppError(503, ERROR_CODES.ASSESSMENT_VERSION_UNKNOWN, "No active assessment definition configured");
    }
    return def;
  },

  // Load the frozen question configuration for a definition (architecture §4).
  // Authoritative for type / options / ranges / required / sort_order.
  async loadQuestions(definitionId, options = {}) {
    const t = options.transaction;
    const rows = await QuestionVersionCfg.findAll({
      where: { definition_id: definitionId },
      include: [{ model: QuestionCatalog, required: true }],
      transaction: t,
      raw: true,
      nest: true,
    });
    return rows.map((r) => ({
      code: r.question_catalog.code,
      section: r.question_catalog.section_no,
      type: r.question_catalog.question_type,
      dataPath: r.question_catalog.data_path,
      required: r.required,
      options: r.options_json || null,
      validation: r.validation_json || null,
      conditional: r.conditional_json || null,
      sort: r.sort_order,
    }));
  },

  // Reject incompatible/unknown submitted versions (architecture §4).
  checkVersion(activeVersion, clientVersion) {
    if (!clientVersion || typeof clientVersion !== "string") {
      throw new AppError(409, ERROR_CODES.ASSESSMENT_VERSION_MISMATCH, "Missing assessment version");
    }
    if (clientVersion !== activeVersion) {
      throw new AppError(
        409,
        ERROR_CODES.ASSESSMENT_VERSION_MISMATCH,
        `Assessment version ${clientVersion} is not the active version ${activeVersion}`
      );
    }
  },
};

export default definitionService;
