// 5-step intake (mirrors the reference nutrition-intake form).
// Each section is rendered as a single step showing all of its questions.

export const SECTIONS = [
  {
    no: 1,
    titleAr: "البيانات الأساسية",
    titleEn: "Basic Information",
    subtitleAr: "عشان نحسب احتياجك اليومي من السعرات بدقة.",
    subtitleEn: "So we can calculate your daily calorie needs accurately.",
  },
  {
    no: 2,
    titleAr: "الهدف من النظام",
    titleEn: "Your Goal",
    subtitleAr: "اختر هدف أو أكتر — دي هتوجّه كل تفاصيل النظام.",
    subtitleEn: "Choose one or more goals — they will guide every detail of your plan.",
  },
  {
    no: 3,
    titleAr: "الحالة الصحية",
    titleEn: "Health Status",
    subtitleAr: "أي معلومة هنا بتخلي النظام آمن أكتر — راجعها مع طبيبك المعالج لو محتاج.",
    subtitleEn: "Anything here makes your plan safer — review it with your doctor if needed.",
  },
  {
    no: 4,
    titleAr: "النشاط والعادات",
    titleEn: "Lifestyle & Habits",
    subtitleAr: "طبيعة يومك بتحدد احتياجك الفعلي من الطاقة.",
    subtitleEn: "Your everyday routine determines your actual energy needs.",
  },
  {
    no: 5,
    titleAr: "التفضيلات الغذائية",
    titleEn: "Food Preferences",
    subtitleAr: "آخر خطوة — عشان النظام يكون قابل للتنفيذ فعلًا مش بس نظري.",
    subtitleEn: "Last step — so your plan is actually doable, not just theoretical.",
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.no);
