import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ar } from "./locales/ar";
import { en } from "./locales/en";
import { assessmentAr } from "./locales/assessment.ar";
import { assessmentEn } from "./locales/assessment.en";

const savedLang =
  (typeof window !== "undefined" && localStorage.getItem("drke-lang")) || "ar";

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar, assessment: assessmentAr },
    en: { translation: en, assessment: assessmentEn },
  },
  lng: savedLang,
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("drke-lang", lng);
  }
});

export default i18n;