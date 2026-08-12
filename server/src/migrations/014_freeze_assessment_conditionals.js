// Migration 014 — freeze server-readable conditional rules for existing v1.0 rows.
import { Sequelize } from "sequelize";
import { conditionalForQuestion } from "../config/assessment-rules.js";

export async function up(queryInterface) {
  const [questions] = await queryInterface.sequelize.query("SELECT code FROM question_catalog");
  for (const { code } of questions) {
    const rule = conditionalForQuestion(code);
    if (!rule) continue;
    await queryInterface.sequelize.query(
      "UPDATE question_version_cfg qvc JOIN question_catalog qc ON qc.id = qvc.question_catalog_id SET qvc.conditional_json = :rule WHERE qc.code = :code",
      { replacements: { code, rule: JSON.stringify(rule) }, type: Sequelize.QueryTypes.UPDATE }
    );
  }
}
