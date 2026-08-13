// 9 question-bearing sections (docs/assessment-spec.md §2). Section titles are
// display labels; questions are partitioned by their `section` field.
// "Safety / Doctor Review" is NOT a question section — it is a dedicated flow
// step rendered by SafetyScreen after Section 09 (see AssessmentPage).

export const SECTIONS = [
  {
    no: 1,
    titleAr: "معلومات أساسية",
    titleEn: "Basic Information",
    subtitleAr: "خلينا نتعرف عليك",
    subtitleEn: "Let's get to know you",
  },
  {
    no: 2,
    titleAr: "قياسات الجسم",
    titleEn: "Body Measurements",
    subtitleAr: "أرقام بسيطة — ٤٠ ثانية",
    subtitleEn: "A few simple numbers",
  },
  {
    no: 3,
    titleAr: "الأهداف",
    titleEn: "Goals",
    subtitleAr: "مفيش خطة من غير هدف واضح",
    subtitleEn: "No plan without a clear goal",
  },
  {
    no: 4,
    titleAr: "التاريخ الطبي والصحي",
    titleEn: "Medical & Health History",
    subtitleAr: "مهم جدًا لسلامتك",
    subtitleEn: "Important for your safety",
  },
  {
    no: 5,
    titleAr: "الأدوية",
    titleEn: "Medications",
    subtitleAr: "أي أدوية أو مكملات بتاخدها",
    subtitleEn: "Any medications you take",
  },
  {
    no: 6,
    titleAr: "نمط الحياة والنشاط البدني",
    titleEn: "Lifestyle & Physical Activity",
    subtitleAr: "روتينك اليومي بيوضح كتير",
    subtitleEn: "Your daily routine says a lot",
  },
  {
    no: 7,
    titleAr: "العادات الغذائية",
    titleEn: "Eating Habits",
    subtitleAr: "عاداتك الغذائية الأساسية",
    subtitleEn: "Your core eating habits",
  },
  {
    no: 8,
    titleAr: "تفضيلات الطعام والقيود",
    titleEn: "Food Preferences & Restrictions",
    subtitleAr: "عشان الخطة تبقى مناسبة ليك",
    subtitleEn: "So your plan fits your life",
  },
  {
    no: 9,
    titleAr: "التحديات والالتزام",
    titleEn: "Challenges & Adherence",
    subtitleAr: "خطوة واحدة بس وتبقى خلصت",
    subtitleEn: "One more step and you're done",
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.no);
