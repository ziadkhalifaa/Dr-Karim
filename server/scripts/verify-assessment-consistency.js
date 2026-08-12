// Consistency verifier: seeded assessment catalog + flag rules vs the approved
// frontend single-source files (architecture §20 "single-source check").
//
// Behavior:
//   - Loads the SAME frontend sources the UI renders (via the ESM loader hook).
//   - Connects to MySQL; if unreachable, reports DB connection status and exits
//     (migrations/seeds must run first).
//   - Compares seeded question_version_cfg / flag_rule_version rows against
//     the frontend expectation and prints a per-item mismatch report.
//   - Exit code 0 when consistent, 1 on any mismatch (CI/verify gate).
//
// Usage: node scripts/verify-assessment-consistency.js

import { register } from "node:module";
register(new URL("./esm-loader.mjs", import.meta.url));

const [{ QUESTIONS_RAW, QUESTIONS }, { FLAG_RULES }, { assessmentAr }, { assessmentEn }] =
  await Promise.all([
    import("../../src/features/assessment/data/questions.js"),
    import("../../src/features/assessment/logic/flags.js"),
    import("../../src/locales/assessment.ar.js"),
    import("../../src/locales/assessment.en.js"),
  ]);

import { sequelize } from "../src/config/database.js";
import { models } from "../src/models/index.js";

const { AssessmentDefinition, QuestionCatalog, QuestionVersionCfg, FlagRule, FlagRuleVersion } = models;

const PROBLEMS = [];
const NOTES = [];

function report(kind, message) {
  PROBLEMS.push({ kind, message });
}

// ---- expected catalog (mirrors seed.js normalization) ----

const Q10 = [
  {
    id: "Q10_01", section: 10, type: "consent", required: "*",
    labelAr: assessmentAr.safety.ackAccurate, labelEn: assessmentEn.safety.ackAccurate,
    dataPath: "acknowledgements.accurate",
  },
  {
    id: "Q10_02", section: 10, type: "consent", required: "*",
    labelAr: assessmentAr.safety.ackNoDiagnosis, labelEn: assessmentEn.safety.ackNoDiagnosis,
    dataPath: "acknowledgements.noDiagnosis",
  },
  {
    id: "Q10_03", section: 10, type: "consent", required: "c",
    labelAr: assessmentAr.safety.ackUrgent, labelEn: assessmentEn.safety.ackUrgent,
    dataPath: "acknowledgements.urgent",
  },
];

const CONTACT_QUESTIONS = QUESTIONS.filter((q) => q.section === 0);
const EXPECTED = [...QUESTIONS_RAW, ...Q10, ...CONTACT_QUESTIONS];

async function verifyCatalog(def) {
  const catalogRows = await QuestionCatalog.findAll({ raw: true });
  const byCode = new Map(catalogRows.map((r) => [r.code, r]));

  if (catalogRows.length !== EXPECTED.length) {
    report("count", `question_catalog has ${catalogRows.length} rows; frontend source has ${EXPECTED.length}.`);
  }

  const missingCodes = [];
  for (const q of EXPECTED) {
    if (!byCode.has(q.id)) {
      missingCodes.push(q.id);
      continue;
    }
    const row = byCode.get(q.id);
    if (row.section_no !== q.section) {
      report("section", `${q.id}: catalog section_no=${row.section_no}, frontend=${q.section}.`);
    }
    if (row.question_type !== q.type) {
      report("type", `${q.id}: catalog question_type=${row.question_type}, frontend=${q.type}.`);
    }
    if ((row.data_path || null) !== (q.dataPath || null)) {
      report("dataPath", `${q.id}: catalog data_path=${row.data_path}, frontend=${q.dataPath}.`);
    }
  }
  if (missingCodes.length) {
    report("catalog", `missing question_catalog rows: ${missingCodes.join(", ")}.`);
  }

  const cfgRows = await QuestionVersionCfg.findAll({
    where: { definition_id: def.id },
    include: [{ model: QuestionCatalog, as: undefined }],
    raw: true,
  });
  const cfgByCode = new Map(cfgRows.map((r) => [r["question_catalog.code"], r]));

  if (cfgRows.length !== EXPECTED.length) {
    report("count", `question_version_cfg has ${cfgRows.length} rows for def v${def.version}; expected ${EXPECTED.length}.`);
  }

  for (const q of EXPECTED) {
    const row = cfgByCode.get(q.id);
    if (!row) {
      report("cfg", `question_version_cfg missing ${q.id}.`);
      continue;
    }
    if (row.required !== q.required) {
      report("required", `${q.id}: cfg required=${row.required}, frontend=${q.required}.`);
    }
    if (row.label_ar !== q.labelAr) {
      report("labelAr", `${q.id}: label_ar differs from frontend.`);
    }
    if (row.label_en !== q.labelEn) {
      report("labelEn", `${q.id}: label_en differs from frontend.`);
    }
    if (q.options) {
      const expectedOpts = q.options.map((o) => `${o.value}|${o.ar}|${o.en}`);
      const actual = Array.isArray(row.options_json) ? row.options_json.map((o) => `${o.value}|${o.ar}|${o.en}`) : [];
      const same = expectedOpts.length === actual.length && expectedOpts.every((v, i) => v === actual[i]);
      if (!same) {
        report("options", `${q.id}: options_json differs from frontend.`);
      }
    }
    if (q.helpAr !== undefined && row.help_ar !== q.helpAr) {
      report("helpAr", `${q.id}: help_ar differs from frontend.`);
    }
    if (q.helpEn !== undefined && row.help_en !== q.helpEn) {
      report("helpEn", `${q.id}: help_en differs from frontend.`);
    }
  }

  NOTES.push(`question_catalog rows: ${catalogRows.length} (catalog) / ${cfgRows.length} (cfg v${def.version}).`);
}

async function verifyFlags() {
  const rules = await FlagRule.findAll({ raw: true });
  const versions = await FlagRuleVersion.findAll({ raw: true });
  const allRuleIds = new Set([...FLAG_RULES.map((r) => r.ruleId), "RS5", "RS6"]);

  for (const r of FLAG_RULES) {
    const row = rules.find((x) => x.rule_id === r.ruleId);
    if (!row) {
      report("flag", `flag_rule missing ${r.ruleId}.`);
      continue;
    }
    if (row.tier !== r.tier) {
      report("flag", `${r.ruleId}: flag_rule tier=${row.tier}, frontend=${r.tier}.`);
    }
    if (r.ruleId.startsWith("RS5") || r.ruleId.startsWith("RS6")) {
      if (row.active) report("flag", `${r.ruleId} must be seeded inactive (INERT).`);
    }
    const v = versions.find((x) => x.flag_rule_id === row.id && x.version === "1.0");
    if (!v) {
      report("flag", `${r.ruleId}: flag_rule_version v1.0 missing.`);
      continue;
    }
    if (v.message_ar !== r.message.ar || v.message_en !== r.message.en) {
      report("flag", `${r.ruleId}: flag_rule_version message differs from frontend.`);
    }
    const refsActual = Array.isArray(v.question_refs_json) ? v.question_refs_json : [];
    const refsExpected = r.refs || [];
    if (refsActual.join(",") !== refsExpected.join(",")) {
      report("flag", `${r.ruleId}: question_refs differ (db=[${refsActual}] vs src=[${refsExpected}]).`);
    }
  }

  for (const id of ["RS5", "RS6"]) {
    const row = rules.find((x) => x.rule_id === id);
    if (!row) {
      report("flag", `flag_rule missing INERT ${id}.`);
      continue;
    }
    if (row.active) {
      report("flag", `${id} must be seeded inactive (INERT).`);
    }
    const v = versions.find((x) => x.flag_rule_id === row.id && x.version === "1.0");
    if (!v) report("flag", `${id}: flag_rule_version v1.0 missing.`);
  }

  const missingRuleIds = [...allRuleIds].filter((id) => !rules.some((r) => r.rule_id === id));
  if (missingRuleIds.length) {
    report("flag", `missing flag_rule ids: ${missingRuleIds.join(", ")}.`);
  }

  NOTES.push(`flag_rule rows: ${rules.length}; flag_rule_version v1.0 rows: ${versions.filter((v) => v.version === "1.0").length}.`);
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL — running consistency verification.");
  } catch (err) {
    console.error(`DB connection failed: ${err.message}`);
    console.error("Run migrations + seeds first (npm run db:migrate, then npm run db:seed).");
    process.exit(2);
  }

  try {
    const def = await AssessmentDefinition.findOne({ where: { code: "nutrition-assessment", version: "1.0" } });
    if (!def) {
      report("definition", "assessment_definition nutrition-assessment v1.0 not found.");
    } else {
      await verifyCatalog(def);
    }
    await verifyFlags();

    console.log("\n--- summary ---");
    for (const n of NOTES) console.log(`  • ${n}`);

    if (PROBLEMS.length === 0) {
      console.log("Consistent: seeded catalog + flags match the approved frontend source (single-source check PASSED).");
      process.exitCode = 0;
    } else {
      console.log(`\nMISMATCHES (${PROBLEMS.length}):`);
      for (const p of PROBLEMS) console.log(`  [${p.kind}] ${p.message}`);
      process.exitCode = 1;
    }
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error("Verify failed:", err.message);
  process.exit(1);
});
