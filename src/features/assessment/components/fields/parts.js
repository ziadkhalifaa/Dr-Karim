// Shared field helpers.

export function pickLabel(item, lang) {
  if (!item) return "";
  return lang === "ar" ? item.ar ?? item.labelAr : item.en ?? item.labelEn;
}

export function pickByLang(lang, ar, en) {
  return lang === "ar" ? ar : en;
}

// id deduplicated + lang-scoped for stable label/for associations
export function fieldId(questionId, suffix) {
  return `aq-${questionId}${suffix ? `-${suffix}` : ""}`;
}