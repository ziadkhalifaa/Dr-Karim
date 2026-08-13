// Red-flag derivation (docs/assessment-spec.md §6) — CURRENT approved rules only.
//
// Flags are ROUTING METADATA ONLY. They never diagnose, prescribe, recommend
// treatment, generate a diet, or make a medical decision. Two tiers only:
// STANDARD / URGENT.
//
// Guardrails honoured here:
//   - BMI is informational only and NEVER a routing input (RS5/RS6 are defined
//     but INERT — see below).
//   - No child percentile thresholds. Minor growth concern = RS9 only.
//   - Cortisone/steroid use = prominent STANDARD flag (RS14), NOT URGENT.
// Severity is configurable data (future doctor-controlled register).

import { getWeightKg, getConditions } from "./conditions";

const T = { URGENT: "urgent", STANDARD: "standard" };

function anyNonNone(arr = []) {
  return Array.isArray(arr) && (arr.includes("none") ? arr.length > 1 : arr.length > 0);
}

function listHas(rows, predicate) {
  return Array.isArray(rows) && rows.some(predicate);
}

function msg(ar, en) {
  return { ar, en };
}

// ---- rule triggers (order matters only for display) ----
export const FLAG_RULES = [
  // --- URGENT ---
  {
    ruleId: "RU1",
    tier: T.URGENT,
    refs: ["Q04_E1"],
    test: (s) => s.answers.Q04_E1 === "currently",
    message: msg(
      "بيانات تحتاج مراجعة عاجلة من الطبيب — سيتم التواصل معاك بأسرع وقت.",
      "Your data requires urgent doctor review — you will be contacted promptly."
    ),
  },
  {
    ruleId: "RU2",
    tier: T.URGENT,
    refs: ["Q04_06"],
    test: (s) => anyNonNone(s.answers.Q04_06),
    message: msg(
      "إجابتك شملت أعراضًا حادة تستدعي مراجعة طبية عاجلة.",
      "Your answers included acute symptoms that require urgent medical review."
    ),
  },
  {
    ruleId: "RU3",
    tier: T.URGENT,
    refs: ["Q04_04", "Q04_04b"],
    test: (s) => {
      if (s.answers.Q04_04 !== "lost") return false;
      const kg = Number(s.answers.Q04_04b);
      const w = getWeightKg(s);
      if (!Number.isFinite(kg) || !w) return false;
      return kg / w > 0.1; // lost >10% of body weight — all ages including minors
    },
    message: msg(
      "فقدان غير مقصود لأكثر من 10% من الوزن — يحتاج مراجعة عاجلة.",
      "Unintentional loss of more than 10% of body weight — requires urgent review."
    ),
  },
  {
    ruleId: "RU4",
    tier: T.URGENT,
    refs: ["Q04_D1", "Q04_D3"],
    test: (s) =>
      s.answers.Q04_D1 === "type1" && s.answers.Q04_D3 === "daily",
    message: msg(
      "سكري نوع 1 مع هبوط سكر يومي — يحتاج مراجعة عاجلة.",
      "Type 1 diabetes with daily hypoglycemia — requires urgent review."
    ),
  },
  {
    ruleId: "RU5",
    tier: T.URGENT,
    refs: ["Q08_02"],
    test: (s) =>
      listHas(
        s.answers.Q08_02,
        (row) => row && row.reaction === "anaphylaxis"
      ),
    message: msg(
      "حساسية غذائية مع تاريخ من الحساسية المفرطة — يحتاج مراجعة عاجلة.",
      "Food allergy with a history of anaphylaxis — requires urgent review."
    ),
  },
  {
    ruleId: "RU6",
    tier: T.URGENT,
    refs: ["Q04_05"],
    test: (s) =>
      s.answers.Q04_05 === "ongoing" || s.answers.Q04_05 === "planned",
    message: msg(
      "عملية سمنة جارية أو مخطّط لها — يحتاج مراجعة عاجلة.",
      "Ongoing or planned bariatric surgery — requires urgent review."
    ),
  },
  {
    ruleId: "RU7",
    tier: T.URGENT,
    refs: ["Q04_03", "Q04_02"],
    test: (s) =>
      s.answers.Q04_03 === "pregnant" && getConditions(s).length > 0,
    message: msg(
      "حمل مع حالة مزمنة — يحتاج مراجعة عاجلة.",
      "Pregnancy with a chronic condition — requires urgent review."
    ),
  },
  {
    ruleId: "RU8",
    tier: T.URGENT,
    refs: ["Q04_C1"],
    test: (s) => s.answers.Q04_C1 === true,
    message: msg(
      "علاج كيماوي/إشعاعي نشط — يحتاج مراجعة عاجلة.",
      "Active cancer treatment — requires urgent review."
    ),
  },
  {
    ruleId: "RU9",
    tier: T.URGENT,
    refs: ["Q05_04", "Q04_D3"],
    test: (s) => {
      const hypo = s.answers.Q04_D3;
      return (
        s.answers.Q05_04 === true &&
        (hypo === "weekly" || hypo === "daily")
      );
    },
    message: msg(
      "إنسولين مع هبوط سكر متكرر — يحتاج مراجعة عاجلة.",
      "Insulin with recurring hypoglycemia — requires urgent review."
    ),
  },

  // --- STANDARD ---
  {
    ruleId: "RS1",
    tier: T.STANDARD,
    refs: ["Q04_D1"],
    test: (s) =>
      s.answers.Q04_D1 === "type2" || s.answers.Q04_D1 === "prediabetes",
    message: msg(
      "سكري من النوع 2 / ما قبل السكري — بيانات سيراجعها الطبيب.",
      "Type 2 diabetes / prediabetes — data the doctor will review."
    ),
  },
  {
    ruleId: "RS2",
    tier: T.STANDARD,
    refs: ["Q04_02"],
    test: (s) => {
      const flagged = [
        "insulin_resistance",
        "thyroid",
        "PCOS",
        "fatty_liver",
        "hypertension",
        "high_cholesterol",
        "anemia",
        "osteoporosis",
        "GI",
        "autoimmune",
        "mental_health",
      ];
      return getConditions(s).some((c) => flagged.includes(c));
    },
    message: msg(
      "بعض الحالات الصحية المسجلة سيراجعها الطبيب.",
      "Some recorded health conditions will be reviewed by the doctor."
    ),
  },
  {
    ruleId: "RS3",
    tier: T.STANDARD,
    refs: ["Q08_02"],
    test: (s) =>
      listHas(
        s.answers.Q08_02,
        (row) =>
          row && row.reaction && row.reaction !== "anaphylaxis"
      ),
    message: msg(
      "حساسية غذائية — بيانات سيراجعها الطبيب.",
      "Food allergies — data the doctor will review."
    ),
  },
  {
    ruleId: "RS4",
    tier: T.STANDARD,
    refs: ["Q08_03"],
    test: (s) => anyNonNone(s.answers.Q08_03),
    message: msg(
      "عدم تحمّل غذائي — بيانات سيراجعها الطبيب.",
      "Food intolerances — data the doctor will review."
    ),
  },
  // RS5 / RS6 (overweight / underweight) are NOT derived in this version:
  // they require BMI categorization, and BMI is informational only and never a
  // routing input. TODO(future): reintroduce only with an explicitly approved
  // clinical reference and a configurable severity register.
  {
    ruleId: "RS7",
    tier: T.STANDARD,
    refs: ["Q04_03"],
    test: (s) => {
      if (s.answers.Q04_03 !== "pregnant") return false;
      return getConditions(s).length === 0; // pregnancy alone
    },
    message: msg(
      "حمل — ستتم مراجعة البيانات من الطبيب قبل أي خطة.",
      "Pregnancy — data will be reviewed by the doctor before any plan."
    ),
  },
  {
    ruleId: "RS8",
    tier: T.STANDARD,
    refs: ["Q06_08", "Q06_09"],
    test: (s) => {
      const smoke = ["yes", "former"].includes(s.answers.Q06_08);
      const alcohol = ["occasionally", "weekly", "daily"].includes(
        s.answers.Q06_09
      );
      return smoke || alcohol;
    },
    message: msg(
      "تدخين / كحول — بيانات سيراجعها الطبيب.",
      "Smoking / alcohol — data the doctor will review."
    ),
  },
  {
    ruleId: "RS9",
    tier: T.STANDARD,
    refs: ["Q02_07"],
    test: (s) => {
      const concerns = s.answers.Q02_07;
      return (
        Array.isArray(concerns) &&
        concerns.length > 0 &&
        !(concerns.length === 1 && concerns[0] === "none")
      );
    },
    message: msg(
      "قلق من النمو أشار إليه ولي الأمر — بيانات سيراجعها الطبيب.",
      "Growth concern reported by the guardian — data the doctor will review."
    ),
  },
  {
    ruleId: "RS10",
    tier: T.STANDARD,
    refs: ["Q04_04", "Q04_04b"],
    test: (s) => {
      const change = s.answers.Q04_04;
      if (change !== "lost" && change !== "gained") return false;
      const kg = Number(s.answers.Q04_04b);
      const w = getWeightKg(s);
      if (!Number.isFinite(kg) || !w) return false;
      return kg / w < 0.1; // unintentional change under 10%
    },
    message: msg(
      "تغيّر غير مقصود في الوزن — بيانات سيراجعها الطبيب.",
      "Unintentional weight change — data the doctor will review."
    ),
  },
  {
    ruleId: "RS11",
    tier: T.STANDARD,
    refs: ["Q04_05"],
    test: (s) => s.answers.Q04_05 === "past",
    message: msg(
      "عملية سمنة سابقة — بيانات سيراجعها الطبيب.",
      "Past bariatric surgery — data the doctor will review."
    ),
  },
  {
    ruleId: "RS12",
    tier: T.STANDARD,
    refs: ["Q04_E1"],
    test: (s) => s.answers.Q04_E1 === "past",
    message: msg(
      "تاريخ سابق مع اضطرابات الأكل — بيانات سيراجعها الطبيب.",
      "Past history of eating disorders — data the doctor will review."
    ),
  },
  {
    ruleId: "RS13",
    tier: T.STANDARD,
    refs: ["Q06_05"],
    test: (s) => {
      const h = Number(s.answers.Q06_05);
      return Number.isFinite(h) && h < 6;
    },
    message: msg(
      "نوم أقل من 6 ساعات — بيانات سيراجعها الطبيب.",
      "Less than 6 hours of sleep — data the doctor will review."
    ),
  },
  {
    ruleId: "RS14",
    tier: T.STANDARD,
    refs: ["Q05_06"],
    test: (s) => {
      const current = s.answers.Q05_06 === "yes";
      const past = s.answers.Q05_06 === "previously";
      return current || past;
    },
    message: msg(
      "استخدام كورتيزون/ستيرويد — بيانات سيراجعها الطبيب بتركيز.",
      "Cortisone/steroid use — data will get prominent doctor review."
    ),
  },
];

export function deriveFlags(answers) {
  const state = { answers };
  return FLAG_RULES.filter((r) => r.test(state)).map((r) => ({
    ruleId: r.ruleId,
    tier: r.tier,
    questionRefs: r.refs,
    message: r.message,
    status: "pending",
  }));
}

export function overallTier(flags) {
  if (flags.some((f) => f.tier === T.URGENT)) return T.URGENT;
  if (flags.length > 0) return T.STANDARD;
  return null;
}

export function hasUrgentFlag(flags) {
  return flags.some((f) => f.tier === T.URGENT);
}

export function hasStandardFlag(flags) {
  return flags.some((f) => f.tier === T.STANDARD);
}

export const TIER = T;