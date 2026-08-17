import { useTranslation } from "react-i18next";
import { useApp } from "../../../context/appContext";
import { navigate } from "../../../lib/router";
import { SunIcon, MoonIcon } from "../../../components/Icons";

export default function AssessmentHeader() {
  const { t } = useTranslation();
  const { theme, toggleTheme, lang, changeLang } = useApp();
  const ap = useTranslation("assessment");

  const goHome = (e) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <header className="aq-header">
      <div className="aq-header__bar">
        <a href="/" onClick={goHome} className="aq-header__logo" aria-label={t("brand.name")}>
          <span className="aq-header__mark">
            <img src="/assets/logo.png" alt={t("brand.name")} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
          </span>
          <span className="aq-header__brand">
            <span className="aq-header__name">{t("brand.name")}</span>
            <span className="aq-header__sub">{t("brand.title")}</span>
          </span>
        </a>

        <div className="aq-header__actions">
          <button
            type="button"
            className="aq-header__action"
            onClick={() => changeLang(lang === "ar" ? "en" : "ar")}
            aria-label="Language"
          >
            <span>{lang === "ar" ? "EN" : "عربي"}</span>
          </button>
          <button
            type="button"
            className="aq-header__action"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
          <button type="button" className="aq-header__home" onClick={goHome}>
            {ap.t("ui.home")}
          </button>
        </div>
      </div>
    </header>
  );
}