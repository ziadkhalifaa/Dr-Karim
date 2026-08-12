// 9 question-bearing sections (docs/assessment-spec.md §2). Section titles are
// display labels; questions are partitioned by their `section` field.
// "Safety / Doctor Review" is NOT a question section — it is a dedicated flow
// step rendered by SafetyScreen after Section 09 (see AssessmentPage).

export const SECTIONS = [
  { no: 1, titleAr: "معلومات أساسية", titleEn: "Basic Information" },
  { no: 2, titleAr: "قياسات الجسم", titleEn: "Body Measurements" },
  { no: 3, titleAr: "الأهداف", titleEn: "Goals" },
  { no: 4, titleAr: "التاريخ الطبي والصحي", titleEn: "Medical & Health History" },
  { no: 5, titleAr: "الأدوية", titleEn: "Medications" },
  { no: 6, titleAr: "نمط الحياة والنشاط البدني", titleEn: "Lifestyle & Physical Activity" },
  { no: 7, titleAr: "العادات الغذائية", titleEn: "Eating Habits" },
  { no: 8, titleAr: "تفضيلات الطعام والقيود", titleEn: "Food Preferences & Restrictions" },
  { no: 9, titleAr: "التحديات والالتزام", titleEn: "Lifestyle Challenges & Adherence" },
];

export const SECTION_IDS = SECTIONS.map((s) => s.no);