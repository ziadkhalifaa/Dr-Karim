// Question catalog — single source of truth for the assessment.
//
// Mirrors the approved 5-step nutrition intake form (reference design):
//   Step 1  Basic Information       Step 2  Your Goal
//   Step 3  Health Status           Step 4  Lifestyle & Habits
//   Step 5  Food Preferences
// Followed by a review step, then submission.
//
// type: single | multi | number | text | textarea | consent | phone
// required: "*" always | "o" optional | "c" conditionally required
//
// Notes:
//  - Q01_01 is the submission subject (always "self"); it is injected at
//    submit time and never rendered in the step flow.
//  - Codes that the backend reads for patient identity are kept (Q01_03 name,
//    Q01_04 age, Q01_05 sex, Q02_01 height, Q02_02 weight, Q02_06 target).

export const QUESTIONS_RAW = [
  // ============ Step 01 — Basic Information ============
  {
    id: "Q01_03",
    section: 1,
    type: "text",
    required: "*",
    labelAr: "الاسم",
    labelEn: "Name",
    placeholderAr: "اكتب اسمك",
    placeholderEn: "Type your name",
    validation: { type: "text", min: 2, max: 100 },
    dataPath: "patient.name",
  },
  {
    id: "Q01_04",
    section: 1,
    type: "number",
    required: "*",
    labelAr: "السن",
    labelEn: "Age",
    unit: { ar: "سنة", en: "years" },
    min: 0,
    max: 120,
    placeholderAr: "مثال: 28",
    placeholderEn: "e.g. 28",
    validation: { type: "number", min: 0, max: 120 },
    dataPath: "patient.ageYears",
  },
  {
    id: "Q01_05",
    section: 1,
    type: "single",
    required: "*",
    labelAr: "النوع",
    labelEn: "Gender",
    options: [
      { value: "male", ar: "ذكر", en: "Male" },
      { value: "female", ar: "أنثى", en: "Female" },
    ],
    validation: { type: "choice" },
    dataPath: "patient.sex",
  },
  {
    id: "Q02_01",
    section: 1,
    type: "number",
    required: "*",
    labelAr: "الطول (سم)",
    labelEn: "Height (cm)",
    unit: { ar: "سم", en: "cm" },
    min: 20,
    max: 250,
    placeholderAr: "170",
    placeholderEn: "170",
    validation: { type: "number", min: 20, max: 250 },
    dataPath: "measures.heightCm",
  },
  {
    id: "Q02_02",
    section: 1,
    type: "number",
    required: "*",
    labelAr: "الوزن الحالي (كجم)",
    labelEn: "Current weight (kg)",
    unit: { ar: "كجم", en: "kg" },
    min: 1,
    max: 400,
    placeholderAr: "75",
    placeholderEn: "75",
    validation: { type: "number", min: 1, max: 400 },
    dataPath: "measures.weightKg",
  },
  {
    id: "Q02_06",
    section: 1,
    type: "number",
    required: "o",
    labelAr: "الوزن المستهدف (كجم)",
    labelEn: "Target weight (kg)",
    unit: { ar: "كجم", en: "kg" },
    min: 1,
    max: 400,
    placeholderAr: "مثال: 68",
    placeholderEn: "e.g. 68",
    validation: { type: "number", min: 1, max: 400 },
    dataPath: "measures.targetKg",
  },

  // ============ Step 02 — Your Goal ============
  {
    id: "Q03_01",
    section: 2,
    type: "multi",
    required: "*",
    labelAr: "هدفك الأساسي؟",
    labelEn: "What is your primary goal?",
    options: [
      { value: "lose", ar: "إنقاص وزن", en: "Lose weight" },
      { value: "gain", ar: "زيادة وزن", en: "Gain weight" },
      { value: "maintain", ar: "تثبيت الوزن", en: "Maintain weight" },
      { value: "muscle", ar: "بناء عضل", en: "Build muscle" },
      { value: "health", ar: "تحسين حالة صحية", en: "Improve a health condition" },
      { value: "pregnancy", ar: "تغذية حمل / رضاعة", en: "Pregnancy / breastfeeding nutrition" },
    ],
    validation: { type: "choice" },
    dataPath: "goals.primary",
  },

  // ============ Step 03 — Health Status ============
  {
    id: "HEALTH_CONDITIONS",
    section: 3,
    type: "multi",
    required: "*",
    labelAr: "أمراض مزمنة",
    labelEn: "Chronic conditions",
    options: [
      { value: "diabetes", ar: "سكري", en: "Diabetes" },
      { value: "pressure", ar: "ضغط", en: "High blood pressure" },
      { value: "kidney", ar: "كلى", en: "Kidney" },
      { value: "liver", ar: "كبد", en: "Liver" },
      { value: "heart", ar: "قلب", en: "Heart" },
      { value: "thyroid", ar: "غدة درقية", en: "Thyroid" },
      { value: "none", ar: "لا يوجد", en: "None" },
    ],
    validation: { type: "choice" },
    dataPath: "medical.conditions",
  },
  {
    id: "HEALTH_MEDS",
    section: 3,
    type: "textarea",
    required: "o",
    labelAr: "أدوية بتاخدها بشكل مستمر",
    labelEn: "Medications you take regularly",
    placeholderAr: "اكتب اسم الدواء لو حابب",
    placeholderEn: "Type the medication name if you like",
    validation: { type: "text", max: 1000 },
    dataPath: "medications.notes",
  },
  {
    id: "HEALTH_ALLERGIES",
    section: 3,
    type: "text",
    required: "o",
    labelAr: "حساسية من أطعمة معينة",
    labelEn: "Food allergies",
    placeholderAr: "مثال: فول سوداني، لاكتوز",
    placeholderEn: "e.g. peanuts, lactose",
    validation: { type: "text", max: 300 },
    dataPath: "preferences.allergies.notes",
  },

  // ============ Step 04 — Lifestyle & Habits ============
  {
    id: "LIFESTYLE_JOB",
    section: 4,
    type: "single",
    required: "*",
    labelAr: "طبيعة الشغل",
    labelEn: "Job type",
    options: [
      { value: "desk", ar: "مكتبي", en: "Desk job" },
      { value: "mixed", ar: "حركة متوسطة", en: "Mixed activity" },
      { value: "active", ar: "حركة كتير", en: "Very active" },
    ],
    validation: { type: "choice" },
    dataPath: "lifestyle.jobType",
  },
  {
    id: "Q06_01",
    section: 4,
    type: "single",
    required: "*",
    labelAr: "معدل التمرين أسبوعيًا",
    labelEn: "Exercise per week",
    options: [
      { value: "none", ar: "مفيش", en: "None" },
      { value: "1_2", ar: "1–2 مرات", en: "1–2 times" },
      { value: "3_4", ar: "3–4 مرات", en: "3–4 times" },
      { value: "5_plus", ar: "5 مرات فأكتر", en: "5+ times" },
    ],
    validation: { type: "choice" },
    dataPath: "lifestyle.activityFrequency",
  },
  {
    id: "Q07_01",
    section: 4,
    type: "number",
    required: "*",
    labelAr: "عدد الوجبات في اليوم",
    labelEn: "Meals per day",
    unit: { ar: "وجبة", en: "meals" },
    min: 0,
    max: 10,
    placeholderAr: "مثال: 3",
    placeholderEn: "e.g. 3",
    validation: { type: "number", min: 0, max: 10 },
    dataPath: "eating.mealCount",
  },
  {
    id: "Q07_05",
    section: 4,
    type: "number",
    required: "*",
    labelAr: "كوب مية في اليوم تقريبًا",
    labelEn: "Glasses of water per day",
    unit: { ar: "كوب", en: "glasses" },
    min: 0,
    max: 30,
    placeholderAr: "مثال: 8",
    placeholderEn: "e.g. 8",
    validation: { type: "number", min: 0, max: 30 },
    dataPath: "eating.waterGlasses",
  },

  // ============ Step 05 — Food Preferences ============
  {
    id: "FOOD_DIET",
    section: 5,
    type: "single",
    required: "*",
    labelAr: "نوع الأكل",
    labelEn: "Diet type",
    options: [
      { value: "normal", ar: "عادي (لحوم وخضار)", en: "Normal (meat & vegetables)" },
      { value: "vegetarian", ar: "نباتي", en: "Vegetarian" },
      { value: "pescatarian", ar: "أسماك فقط بدون لحوم", en: "Pescatarian" },
    ],
    validation: { type: "choice" },
    dataPath: "preferences.dietType",
  },
  {
    id: "FOOD_DISLIKES",
    section: 5,
    type: "text",
    required: "o",
    labelAr: "أكلات مكروهة تمامًا",
    labelEn: "Foods you completely dislike",
    placeholderAr: "مثال: الملوخية، السمك",
    placeholderEn: "e.g. okra, fish",
    validation: { type: "text", max: 300 },
    dataPath: "preferences.dislikes",
  },
  {
    id: "FOOD_BUDGET",
    section: 5,
    type: "single",
    required: "*",
    labelAr: "الميزانية اليومية للأكل",
    labelEn: "Daily food budget",
    options: [
      { value: "low", ar: "محدودة", en: "Limited" },
      { value: "medium", ar: "متوسطة", en: "Medium" },
      { value: "high", ar: "مرنة", en: "Flexible" },
    ],
    validation: { type: "choice" },
    dataPath: "preferences.budget",
  },
  {
    id: "FOOD_COOKTIME",
    section: 5,
    type: "single",
    required: "*",
    labelAr: "وقت متاح للطبخ يوميًا",
    labelEn: "Cooking time available daily",
    options: [
      { value: "little", ar: "أقل من 20 دقيقة", en: "Less than 20 minutes" },
      { value: "medium", ar: "20–45 دقيقة", en: "20–45 minutes" },
      { value: "plenty", ar: "وقت مفتوح", en: "Unlimited time" },
    ],
    validation: { type: "choice" },
    dataPath: "preferences.cookTime",
  },
];

// Q01_01 (subject) is injected at submit time as "self" — never rendered.
export const SUBJECT_DEFAULT = "self";

// Consent/notice items handled inside the review step before submission.
const REVIEW_ACKS = [
  {
    id: "ACK_ACCURATE",
    section: 10,
    type: "consent",
    required: "*",
    labelAr: "أؤكد إن المعلومات اللي فوق صحيحة.",
    labelEn: "I confirm the information above is accurate.",
    validation: { type: "consent" },
    dataPath: "acknowledgements.accurate",
  },
  {
    id: "ACK_NO_DIAGNOSIS",
    section: 10,
    type: "consent",
    required: "*",
    labelAr: "فاهم إن الاستمارة أداة لجمع البيانات — مش تشخيص طبي، وهيتراجع من الدكتور قبل أي خطة.",
    labelEn: "I understand this is a data-collection form — not a diagnosis — and it will be reviewed by the doctor before any plan.",
    validation: { type: "consent" },
    dataPath: "acknowledgements.noDiagnosis",
  },
];

// Contact-capture fields shown in the review step (section:0 keeps them out
// of the 5-step question flow; they are rendered by the review step).
const CONTACT_QUESTIONS = [
  {
    id: "C01", section: 0, type: "text", required: "*",
    labelAr: "الاسم الكامل", labelEn: "Full name",
    helpAr: "معبأ من الإجابة السابقة — قابل للتعديل",
    helpEn: "Prefilled from your earlier answer — editable",
    validation: { type: "text", min: 2, max: 100 },
    dataPath: "contact.patientName",
  },
  {
    id: "C04", section: 0, type: "phone", required: "*",
    labelAr: "رقم الموبايل (واتساب)", labelEn: "Mobile phone (WhatsApp)",
    validation: { type: "phone" },
    dataPath: "contact.handoffPhone",
  },
  {
    id: "C09", section: 0, type: "consent", required: "*",
    labelAr: "أوافق على التواصل بخصوص التقييم.", labelEn: "I agree to be contacted about my assessment.",
    validation: { type: "consent" },
    dataPath: "contact.consent",
  },
];

export const QUESTIONS = [
  ...QUESTIONS_RAW,
  ...REVIEW_ACKS,
  ...CONTACT_QUESTIONS,
];

export const QUESTIONS_BY_ID = Object.freeze(
  Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))
);
