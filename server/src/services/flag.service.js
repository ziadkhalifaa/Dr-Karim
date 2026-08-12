import { Op } from "sequelize";
import { models } from "../models/index.js";
import { deriveFlags, overallTier as computeOverallTier, hasUrgentFlag } from "./frontend-rules.service.js";

const { FlagRule, FlagRuleVersion, AssessmentFlag } = models;

// Server-side flag derivation (Phase 2 §9). Runs the APPROVED derivation logic
// from the single-source frontend module over the validated canonical answers.
// Maps fired rule ids to the versioned flag_rule + flag_rule_version rows
// (architecture §3) so each assessment_flag row carries the published snapshot
// columns (tier, message ar/en, question refs). Returns the per-flag rows to
// persist plus the authoritative overall tier (spec §10). BMI/percentiles
// NEVER route — RS5/RS6 are inert and not present in FLAG_RULES (guardrail).

export const flagService = {
  async derive(answers, tenantId, sessionId, transaction) {
    const derived = deriveFlags(answers);
    const canonicalRule = await FlagRule.findOne({
      where: { active: true },
      order: [["rule_id", "ASC"]],
      transaction,
      raw: true,
    });
    const canonicalVersion = canonicalRule ? await FlagRuleVersion.findOne({
      where: { flag_rule_id: canonicalRule.id, published_at: { [Op.lte]: new Date() }, [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: new Date() } }] },
      order: [["effective_from", "DESC"], ["published_at", "DESC"], ["id", "DESC"]],
      transaction,
      raw: true,
    }) : null;
    const resolved = [];

    for (const d of derived) {
      const rule = await FlagRule.findOne({
        where: { rule_id: d.ruleId, active: true },
        transaction,
        raw: true,
      });
      if (!rule) continue;

      const version = await FlagRuleVersion.findOne({
        where: { flag_rule_id: rule.id, published_at: { [Op.lte]: new Date() }, [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: new Date() } }] },
        order: [["effective_from", "DESC"], ["published_at", "DESC"], ["id", "DESC"]],
        transaction,
        raw: true,
      });
      if (!version) continue;

      const triggerContext = {};
      for (const ref of d.questionRefs) {
        if (answers[ref] !== undefined) triggerContext[ref] = answers[ref];
      }

      resolved.push({
        tenant_id: tenantId,
        session_id: sessionId,
        flag_rule_id: rule.id,
        rule_id: rule.rule_id,
        flag_rule_version_id: version.id,
        rule_version: version.version,
        tier: version.tier,
        message_ar: version.message_ar,
        message_en: version.message_en,
        question_refs_json: version.question_refs_json || d.questionRefs,
        trigger_context_json: triggerContext,
        status: "pending",
      });
    }

    const overall = computeOverallTier(derived); // "urgent" | "standard" | null
    return {
      rows: resolved,
      overallTier: overall,
      hasUrgent: hasUrgentFlag(derived),
      versionIdForSession: canonicalVersion?.id || null,
    };
  },
};

// Re-export so callers can derive tier without persisting if needed.
export { computeOverallTier, hasUrgentFlag, AssessmentFlag };

export default flagService;




