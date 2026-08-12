import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppContext } from "./appContext";

export function AppProvider({ children }) {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("drke-theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const lang = i18n.language;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("drke-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b2430" : "#123b4a");
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  const changeLang = (l) => i18n.changeLanguage(l);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, changeLang }}>
      {children}
    </AppContext.Provider>
  );
}