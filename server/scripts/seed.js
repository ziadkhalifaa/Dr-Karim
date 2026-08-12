// Phase 1 seed data (architecture §20).
//
// Strategy: idempotent by natural key, version-aware, safe to re-run.
// Sources of truth (SINGLE SOURCE):
//   - Assessment: src/features/assessment/data/questions.js
//   - Flag rules: src/features/assessment/logic/flags.js
//   - Wording:    src/locales/assessment.{ar,en}.js + src/locales/{ar,en}.js
//   - Clinic:     src/config.js (CLINIC)
// The ESM loader hook resolves the frontend's extensionless relative imports
// so this script reads the EXACT same files the UI renders.
//
// NEVER edits applied migrations. Seeds only add idempotent reference data.

import { register } from "node:module";

// Must register BEFORE any frontend dynamic import (hook appends .js on miss).
register(new URL("./esm-loader.mjs", import.meta.url));

// ---- frontend sources (single source of truth) ----
const [{ QUESTIONS_RAW, QUESTIONS }, { FLAG_RULES }, { assessmentAr }, { assessmentEn }, { ar }, { en }, { CLINIC }] =
  await Promise.all([
    import("../../src/features/assessment/data/questions.js"),
    import("../../src/features/assessment/logic/flags.js"),
    import("../../src/locales/assessment.ar.js"),
    import("../../src/locales/assessment.en.js"),
    import("../../src/locales/ar.js"),
    import("../../src/locales/en.js"),
    import("../../src/config.js"),
  ]);

import { sequelize } from "../src/config/database.js";
import { models } from "../src/models/index.js";
import { canonicalizeEgyptianPhone, preserveDisplay } from "../src/config/phone.js";
import { conditionalForQuestion } from "../src/config/assessment-rules.js";

const {
  Tenant, Doctor,
  RelationshipCode, GoalCode, DietPatternCode, ReactionCode, SeverityCode,
  ConditionCode, AppointmentStatus, ServiceStatus,
  AssessmentDefinition, QuestionCatalog, QuestionVersionCfg,
  FlagRule, FlagRuleVersion,
  ServiceCategory, ServiceCategoryTranslation, Service, ServiceTranslation,
  ClinicInfo,
  PlatformSetting, FeatureFlag,
  VideoMeetingProvider,
  FoodItem, ExerciseItem,
} = models;

const NOW = new Date();
const TODAY = NOW.toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function upsert(Model, where, values) {
  const existing = await Model.findOne({ where });
  if (existing) {
    await existing.update(values);
    return { row: existing, created: false };
  }
  const row = await Model.create({ ...where, ...values });
  return { row, created: true };
}

async function seedCodeTable(Model, rows) {
  let created = 0;
  for (const r of rows) {
    const existing = await Model.findOne({ where: { code: r.code } });
    if (!existing) {
      await Model.create(r);
      created += 1;
    }
  }
  return created;
}

// ---------------------------------------------------------------------------
// 1. tenant + doctor
// ---------------------------------------------------------------------------

async function seedTenantAndDoctor() {
  const { row: tenant } = await upsert(
    Tenant,
    { slug: "dr-kareem" },
    { name: "Dr. Kareem Eliethy", is_default: true }
  );

  const phoneDisplay = CLINIC.phones[0];
  const phoneCanonical = canonicalizeEgyptianPhone(phoneDisplay);
  await upsert(
    Doctor,
    { tenant_id: tenant.id, email: CLINIC.email },
    {
      name: "Dr. Kareem Eliethy",
      title: null,
      phone_canonical: phoneCanonical,
      phone_display: preserveDisplay(phoneDisplay),
      active: true,
    }
  );
  return tenant;
}

// ---------------------------------------------------------------------------
// 2. reference code catalogs
// ---------------------------------------------------------------------------

function buildRelationshipCodes() {
  const opts = QUESTIONS_RAW.find((q) => q.id === "Q01_02").options;
  return opts.map((o) => ({ code: o.value, name_ar: o.ar, name_en: o.en, sort_order: 0 }));
}

function buildGoalCodes() {
  const opts = QUESTIONS_RAW.find((q) => q.id === "Q03_01").options;
  return opts.map((o) => ({ code: o.value, name_ar: o.ar, name_en: o.en, sort_order: 0 }));
}

function buildDietPatternCodes() {
  const opts = QUESTIONS_RAW.find((q) => q.id === "Q08_04").options;
  return opts.map((o) => ({ code: o.value, name_ar: o.ar, name_en: o.en, sort_order: 0 }));
}

function buildReactionCodes() {
  const q = QUESTIONS_RAW.find((x) => x.id === "Q08_02");
  const col = q.columns.find((c) => c.key === "reaction");
  return col.options.map((o) => ({ code: o.value, name_ar: o.ar, name_en: o.en, sort_order: 0 }));
}

function buildSeverityCodes() {
  const reaction = buildReactionCodes();
  return reaction.map((r, i) => ({ ...r, sort_order: i }));
}

function buildConditionCodes() {
  const opts = QUESTIONS_RAW.find((q) => q.id === "Q04_02").options;
  return opts.map((o) => ({ code: o.value, name_ar: o.ar, name_en: o.en, sort_order: 0 }));
}

function buildAppointmentStatuses() {
  return [
    { code: "pending", name_ar: "قيد الانتظار", name_en: "Pending" },
    { code: "confirmed", name_ar: "مؤكد", name_en: "Confirmed" },
    { code: "cancelled", name_ar: "ملغي", name_en: "Cancelled" },
    { code: "completed", name_ar: "مكتمل", name_en: "Completed" },
    { code: "no_show", name_ar: "لم يحضر", name_en: "No-show" },
  ].map((r, i) => ({ ...r, sort_order: i }));
}

function buildServiceStatuses() {
  return [
    { code: "active", name_ar: "نشط", name_en: "Active" },
    { code: "inactive", name_ar: "غير نشط", name_en: "Inactive" },
    { code: "archived", name_ar: "مؤرشف", name_en: "Archived" },
  ].map((r, i) => ({ ...r, sort_order: i }));
}

async function seedReferenceCodes() {
  const created = {};
  created.relationship_code = await seedCodeTable(RelationshipCode, buildRelationshipCodes());
  created.goal_code = await seedCodeTable(GoalCode, buildGoalCodes());
  created.diet_pattern_code = await seedCodeTable(DietPatternCode, buildDietPatternCodes());
  created.reaction_code = await seedCodeTable(ReactionCode, buildReactionCodes());
  created.severity_code = await seedCodeTable(SeverityCode, buildSeverityCodes());
  created.condition_code = await seedCodeTable(ConditionCode, buildConditionCodes());
  created.appointment_status = await seedCodeTable(AppointmentStatus, buildAppointmentStatuses());
  created.service_status = await seedCodeTable(ServiceStatus, buildServiceStatuses());
  return created;
}

// ---------------------------------------------------------------------------
// 3. assessment definition v1.0 + question_catalog + question_version_cfg
// ---------------------------------------------------------------------------

// Q10_01–03 consents (spec §3 Safety) are NOT in questions.js — they live in the
// Safety screen and their rendered copy is locale safety.ack*.
function buildQ10Snippets() {
  return [
    {
      id: "Q10_01",
      section: 10,
      type: "consent",
      required: "*",
      labelAr: assessmentAr.safety.ackAccurate,
      labelEn: assessmentEn.safety.ackAccurate,
      dataPath: "acknowledgements.accurate",
      validation: { type: "consent" },
      conditional: null,
    },
    {
      id: "Q10_02",
      section: 10,
      type: "consent",
      required: "*",
      labelAr: assessmentAr.safety.ackNoDiagnosis,
      labelEn: assessmentEn.safety.ackNoDiagnosis,
      dataPath: "acknowledgements.noDiagnosis",
      validation: { type: "consent" },
      conditional: null,
    },
    {
      id: "Q10_03",
      section: 10,
      type: "consent",
      required: "c", // "* only if ≥1 URGENT flag" (spec §3)
      labelAr: assessmentAr.safety.ackUrgent,
      labelEn: assessmentEn.safety.ackUrgent,
      dataPath: "acknowledgements.urgent",
      validation: { type: "consent" },
      conditional: { requiresUrgentFlag: true },
    },
  ];
}

function normalizeQuestion(q) {
  const validation = {
    ...(q.validation || {}),
    unit: q.unit,
    min: q.min,
    max: q.max,
    step: q.step,
    scale: q.scaleMin !== undefined
      ? {
          min: q.scaleMin,
          max: q.scaleMax,
          labelLowAr: q.labelLowAr,
          labelLowEn: q.labelLowEn,
          labelHighAr: q.labelHighAr,
          labelHighEn: q.labelHighEn,
        }
      : undefined,
    columns: q.columns,
  };
  for (const k of Object.keys(validation)) {
    if (validation[k] === undefined) delete validation[k];
  }
  return {
    code: q.id,
    section_no: q.section,
    question_type: q.type,
    data_path: q.dataPath || null,
    label_ar: q.labelAr,
    label_en: q.labelEn,
    help_ar: q.helpAr || null,
    help_en: q.helpEn || null,
    placeholder_ar: q.placeholderAr || null,
    placeholder_en: q.placeholderEn || null,
    required: q.required,
    options_json: q.options || null,
    validation_json: validation,
    conditional_json: conditionalForQuestion(q.id),
  };
}

async function seedAssessmentDefinition(tenant) {
  const { row: def } = await upsert(
    AssessmentDefinition,
    { code: "nutrition-assessment" },
    {
      version: "1.0",
      title_ar: "التقييم الغذائي",
      title_en: "Nutrition Assessment",
      status: "published",
      is_active: true,
      published_at: NOW,
    }
  );

  const contactQuestions = QUESTIONS.filter((q) => q.section === 0);
  const allQuestions = [
    ...QUESTIONS_RAW,
    ...buildQ10Snippets(),
    ...contactQuestions,
  ];
  let sort = 0;
  let catCreated = 0;
  let cfgCreated = 0;

  for (const q of allQuestions) {
    sort += 1;
    const normalized = normalizeQuestion(q);

    const { row: cat } = await upsert(
      QuestionCatalog,
      { code: normalized.code },
      {
        section_no: normalized.section_no,
        question_type: normalized.question_type,
        data_path: normalized.data_path,
      }
    );
    if (cat.code === normalized.code) catCreated += 1; // counters only

    const existingCfg = await QuestionVersionCfg.findOne({
      where: { definition_id: def.id, question_catalog_id: cat.id },
    });
    if (!existingCfg) {
      await QuestionVersionCfg.create({
        definition_id: def.id,
        question_catalog_id: cat.id,
        sort_order: sort,
        label_ar: normalized.label_ar,
        label_en: normalized.label_en,
        help_ar: normalized.help_ar,
        help_en: normalized.help_en,
        placeholder_ar: normalized.placeholder_ar,
        placeholder_en: normalized.placeholder_en,
        required: normalized.required,
        options_json: normalized.options_json,
        validation_json: normalized.validation_json,
        conditional_json: normalized.conditional_json,
      });
      cfgCreated += 1;
    }
  }

  // Re-anchor definition on tenant (belongsTo Tenant) — definition is GLOBAL,
  // so no tenant_id column; this call is a no-op kept for API symmetry.
  void tenant;

  return { total: allQuestions.length, catCreated, cfgCreated };
}

// ---------------------------------------------------------------------------
// 4. flag_rule + flag_rule_version v1.0 (RU1–RU9 URGENT, RS1–RS14 STANDARD)
// ---------------------------------------------------------------------------

const FLAG_TITLES = {
  RU1: "Active eating disorder",
  RU2: "Acute symptoms",
  RU3: "Unintentional weight loss >10%",
  RU4: "Type 1 diabetes + daily hypoglycemia",
  RU5: "Anaphylaxis food allergy",
  RU6: "Ongoing/planned bariatric surgery",
  RU7: "Pregnancy + chronic condition",
  RU8: "Active cancer treatment",
  RU9: "Insulin + recurring hypoglycemia",
  RS1: "Type 2 diabetes / prediabetes",
  RS2: "Notable health conditions",
  RS3: "Food allergies (non-anaphylaxis)",
  RS4: "Food intolerances",
  RS5: "Overweight/obesity (INERT)",
  RS6: "Underweight (INERT)",
  RS7: "Pregnancy alone",
  RS8: "Smoking / alcohol",
  RS9: "Minor growth concern",
  RS10: "Unintentional weight change <10%",
  RS11: "Past bariatric surgery",
  RS12: "Past eating disorder",
  RS13: "Sleep <6 hours",
  RS14: "Cortisone/steroid use",
};

// RS5/RS6 are reserved in the spec (§6) but INERT: BMI is informational only
// and never a routing input (flags.js guardrail). Seeded as inactive reference
// rows so the RS numbering stays complete.
const INERT_FLAGS = [
  {
    ruleId: "RS5",
    tier: "standard",
    refs: [],
    message: {
      ar: "زيادة وزن/سمنة بدون علامات أخرى — معلومة فقط، ليست معيار توجيه (خاملة في هذا الإصدار).",
      en: "Overweight/obesity without co-morbid flags — informational only, not a routing input (inert in this version).",
    },
  },
  {
    ruleId: "RS6",
    tier: "standard",
    refs: [],
    message: {
      ar: "نحافة بدون أعراض خطيرة — معلومة فقط، ليست معيار توجيه (خاملة في هذا الإصدار).",
      en: "Underweight without red-flag symptoms — informational only, not a routing input (inert in this version).",
    },
  },
];

async function seedFlags() {
  const rules = [...FLAG_RULES, ...INERT_FLAGS];
  let ruleCreated = 0;
  let versionCreated = 0;

  for (const r of rules) {
    const { row: rule } = await upsert(
      FlagRule,
      { rule_id: r.ruleId },
      {
        title: FLAG_TITLES[r.ruleId] || r.ruleId,
        tier: r.tier,
        active: !r.ruleId.startsWith("RS5") && !r.ruleId.startsWith("RS6"),
      }
    );
    ruleCreated += 1;

    const existingVersion = await FlagRuleVersion.findOne({
      where: { flag_rule_id: rule.id, version: "1.0" },
    });
    if (existingVersion) continue;

    await FlagRuleVersion.create({
      flag_rule_id: rule.id,
      version: "1.0",
      tier: r.tier,
      trigger_json: {
        source: "src/features/assessment/logic/flags.js",
        ruleId: r.ruleId,
        inert: !rule.active,
        semantics: "Frontend derivation is NOT reimplemented server-side in Phase 1 (catalog/storage only).",
      },
      question_refs_json: r.refs,
      message_ar: r.message.ar,
      message_en: r.message.en,
      severity_config_json: null,
      published_at: NOW,
      effective_from: TODAY,
      effective_to: null,
    });
    versionCreated += 1;
  }

  return { ruleCreated, versionCreated };
}

// ---------------------------------------------------------------------------
// 5. services (from locale services.groups)
// ---------------------------------------------------------------------------

async function buildServices(tenant) {
  const enGroups = en.services.groups;
  const arGroups = ar.services.groups;
  const CATEGORIES = [
    { code: "core", enTitle: enGroups[0].title, arTitle: arGroups[0].title, services: [
      { code: "therapeutic-nutrition", enTitle: enGroups[0].items[0].title, enBody: enGroups[0].items[0].body, arTitle: arGroups[0].items[0].title, arBody: arGroups[0].items[0].body },
    ]},
    { code: "weight-management", enTitle: enGroups[1].title, arTitle: arGroups[1].title, services: [
      { code: "obesity-treatment", enTitle: enGroups[1].items[0].title, enBody: enGroups[1].items[0].body, arTitle: arGroups[1].items[0].title, arBody: arGroups[1].items[0].body },
      { code: "underweight-treatment", enTitle: enGroups[1].items[1].title, enBody: enGroups[1].items[1].body, arTitle: arGroups[1].items[1].title, arBody: arGroups[1].items[1].body },
    ]},
    { code: "health-conditions", enTitle: enGroups[2].title, arTitle: arGroups[2].title, services: [
      { code: "insulin-resistance", enTitle: enGroups[2].items[0].title, enBody: enGroups[2].items[0].body, arTitle: arGroups[2].items[0].title, arBody: arGroups[2].items[0].body },
      { code: "thyroid-disorders", enTitle: enGroups[2].items[1].title, enBody: enGroups[2].items[1].body, arTitle: arGroups[2].items[1].title, arBody: arGroups[2].items[1].body },
      { code: "diabetes-children", enTitle: enGroups[2].items[2].title, enBody: enGroups[2].items[2].body, arTitle: arGroups[2].items[2].title, arBody: arGroups[2].items[2].body },
    ]},
  ];

  const created = { categories: 0, services: 0, translations: 0 };
  let idx = 0;
  for (const c of CATEGORIES) {
    const { row: cat } = await upsert(
      ServiceCategory,
      { code: c.code },
      { tenant_id: tenant.id, sort_order: idx++, active: true, deleted_at: null }
    );
    created.categories += 1;
    await seedServiceTranslations(ServiceCategoryTranslation, "service_category_id", cat.id, c, created);

    let sIdx = 0;
    for (const s of c.services) {
      const { row: svc } = await upsert(
        Service,
        { code: s.code },
        { tenant_id: tenant.id, service_category_id: cat.id, status: "active", sort_order: sIdx++, deleted_at: null }
      );
      created.services += 1;
      await seedServiceTranslations(ServiceTranslation, "service_id", svc.id, s, created);
    }
  }
  return created;
}

async function seedServiceTranslations(Model, fk, parentId, item, created) {
  const rows = [
    { locale: "en", name: item.enTitle, description: item.enBody },
    { locale: "ar", name: item.arTitle, description: item.arBody },
  ];
  for (const r of rows) {
    const existing = await Model.findOne({ where: { [fk]: parentId, locale: r.locale } });
    if (!existing) {
      await Model.create({ [fk]: parentId, ...r });
      created.translations += 1;
    }
  }
}

// ---------------------------------------------------------------------------
// 6. clinic info (working_hour intentionally left empty — no approved hours)
// ---------------------------------------------------------------------------

async function seedClinicInfo(tenant) {
  const phoneDisplay = CLINIC.phones[0];
  await upsert(
    ClinicInfo,
    { tenant_id: tenant.id, name: "Dr. Kareem Eliethy" },
    {
      address: CLINIC.address,
      phone_canonical: canonicalizeEgyptianPhone(phoneDisplay),
      phone_display: preserveDisplay(phoneDisplay),
      email: CLINIC.email,
      active: true,
    }
  );
}

// ---------------------------------------------------------------------------
// 7. platform settings + feature flags
// ---------------------------------------------------------------------------

async function seedPlatform(tenant) {
  const tenantId = tenant.id;
  const settings = [
    { tenant_id: tenantId, key: "assessment_version_active", value: "1.0", value_type: "string", description: "Active assessment definition version (dr-kareem)." },
    { tenant_id: tenantId, key: "pregnancy_visibility_rule", value: JSON.stringify({ minAge: 12, maxAge: 55 }), value_type: "json", description: "Q04_03 visibility rule (spec §4 CL14) — configurable." },
    { tenant_id: tenantId, key: "draft_retention_days", value: "30", value_type: "number", description: "Draft session retention days (§9 policy proposal — unenforced until ratified)." },
    { tenant_id: tenantId, key: "contact_preference_default", value: "whatsapp", value_type: "string", description: "Default preferred contact method (C06)." },
  ];
  const flags = [
    { key: "video_conferencing_enabled", enabled: false, description: "Live video sessions (Daily.co integration is a future phase)." },
    { key: "appointment_booking_enabled", enabled: false, description: "Self-serve appointment booking (future phase)." },
    { key: "online_payments_enabled", enabled: false, description: "Online payments (future phase)." },
    { key: "checkin_enabled", enabled: false, description: "Recurring patient check-ins (future phase)." },
    { key: "plan_generation_enabled", enabled: false, description: "Automated plan generation (future phase; gated by doctor review)." },
  ];
  let s = 0;
  let f = 0;
  for (const p of settings) {
    const existing = await PlatformSetting.findOne({ where: { key: p.key, tenant_id: tenantId } });
    if (!existing) { await PlatformSetting.create(p); s += 1; }
  }
  for (const fl of flags) {
    const existing = await FeatureFlag.findOne({ where: { key: fl.key } });
    if (!existing) { await FeatureFlag.create(fl); f += 1; }
  }
  return { settingsCreated: s, flagsCreated: f };
}

// ---------------------------------------------------------------------------
// 8. thin catalogs (video provider, food, exercise)
// ---------------------------------------------------------------------------

async function seedThinCatalogs() {
  await upsert(
    VideoMeetingProvider,
    { code: "daily" },
    { name: "Daily.co", enabled: true }
  );

  const foods = [
    { code: "rice_brown", name_ar: "أرز بني", name_en: "Brown rice", category_code: "grains", unit: "cup" },
    { code: "chicken_breast", name_ar: "صدر دجاج", name_en: "Chicken breast", category_code: "protein", unit: "g" },
    { code: "lentils", name_ar: "عدس", name_en: "Lentils", category_code: "legumes", unit: "cup" },
    { code: "greek_yogurt", name_ar: "زبادي يوناني", name_en: "Greek yogurt", category_code: "dairy", unit: "cup" },
    { code: "olive_oil", name_ar: "زيت زيتون", name_en: "Olive oil", category_code: "fats", unit: "tbsp" },
    { code: "oats", name_ar: "شوفان", name_en: "Oats", category_code: "grains", unit: "cup" },
    { code: "egg", name_ar: "بيض", name_en: "Egg", category_code: "protein", unit: "piece" },
    { code: "banana", name_ar: "موز", name_en: "Banana", category_code: "fruit", unit: "piece" },
    { code: "apple", name_ar: "تفاح", name_en: "Apple", category_code: "fruit", unit: "piece" },
    { code: "spinach", name_ar: "سبانخ", name_en: "Spinach", category_code: "vegetables", unit: "cup" },
  ];
  const exercises = [
    { code: "brisk_walking", name_ar: "مشي سريع", name_en: "Brisk walking", category_code: "cardio", description: null, instructions: null },
    { code: "bodyweight_squats", name_ar: "قرفصاء بوزن الجسم", name_en: "Bodyweight squats", category_code: "strength", description: null, instructions: null },
    { code: "push_ups", name_ar: "ضغط", name_en: "Push-ups", category_code: "strength", description: null, instructions: null },
    { code: "plank", name_ar: "بلانك", name_en: "Plank", category_code: "core", description: null, instructions: null },
    { code: "stretching", name_ar: "تمدد", name_en: "Stretching", category_code: "flexibility", description: null, instructions: null },
  ];

  let foodCreated = 0;
  let exerciseCreated = 0;
  for (const f of foods) {
    const existing = await FoodItem.findOne({ where: { code: f.code } });
    if (!existing) { await FoodItem.create({ ...f, active: true }); foodCreated += 1; }
  }
  for (const e of exercises) {
    const existing = await ExerciseItem.findOne({ where: { code: e.code } });
    if (!existing) { await ExerciseItem.create({ ...e, active: true }); exerciseCreated += 1; }
  }
  return { foodCreated, exerciseCreated };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL.");

    const tenant = await seedTenantAndDoctor();
    console.log(`tenant + doctor seeded (tenant id=${tenant.id}).`);

    const codes = await seedReferenceCodes();
    console.log("reference codes:", JSON.stringify(codes));

    const assessment = await seedAssessmentDefinition(tenant);
    console.log(`assessment definition: ${assessment.total} questions, ${assessment.cfgCreated} config rows created.`);

    const flags = await seedFlags();
    console.log(`flag rules: ${flags.ruleCreated} rules, ${flags.versionCreated} versions created.`);

    const services = await buildServices(tenant);
    console.log("services:", JSON.stringify(services));

    await seedClinicInfo(tenant);
    console.log("clinic info seeded (working_hour empty — no approved hours).");

    const platform = await seedPlatform(tenant);
    console.log("platform:", JSON.stringify(platform));

    const thin = await seedThinCatalogs();
    console.log("thin catalogs:", JSON.stringify(thin));

    console.log("Seed complete. Idempotent — safe to re-run.");
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.stack || err.message);
  process.exit(1);
});
