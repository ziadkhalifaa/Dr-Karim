import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/appContext";
import { waUrl } from "../config";
import { navigate } from "../lib/router";
import Logo from "./Logo";
import {
  SunIcon,
  MoonIcon,
  BurgerIcon,
  CloseIcon,
  WhatsAppIcon,
  PulseIcon,
} from "./Icons";

const NAV = [
  { key: "home", href: "#home" },
  { key: "about", href: "#about" },
  { key: "services", href: "#services" },
  { key: "articles", href: "#articles" },
  { key: "contact", href: "#contact" },
];

export default function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme, lang, changeLang } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggleLang = () => changeLang(lang === "ar" ? "en" : "ar");

  const goAssessment = (e) => {
    e.preventDefault();
    navigate("/assessment");
  };

  return (
    <header
      className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}
    >
      <div className="container site-header__bar">
        <a href="#home" className="logo" aria-label={t("brand.name")}>
          <span className="logo__mark">
            <Logo size={64} />
          </span>
          <span className="logo__text">
            <span className="logo__name">{t("brand.name")}</span>
            <br />
            <span className="logo__title">{t("brand.title")}</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main">
          {NAV.map((item) => (
            <a key={item.key} href={item.href} className="main-nav__link">
              {t(`nav.${item.key}`)}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="lang-btn"
            onClick={toggleLang}
            aria-label="Language"
          >
            <span className="lang-btn__label">{lang === "ar" ? "EN" : "عربي"}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.7 2.6 4 5.7 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.7-4-9s1.3-6.4 4-9Z" />
            </svg>
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          <a href="/assessment" onClick={goAssessment} className="btn btn-accent header-book">
            <PulseIcon />
            <span>{t("nav.assess")}</span>
          </a>

          <button
            type="button"
            className="icon-btn burger"
            onClick={() => setOpen(true)}
            aria-label={t("misc.menu")}
          >
            <BurgerIcon />
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-drawer">
          <div className="mobile-drawer__head">
            <span className="logo">
              <span className="logo__mark">
                <Logo size={52} />
              </span>
              <span className="logo__name">{t("brand.name")}</span>
            </span>
            <button
              type="button"
              className="icon-btn"
              style={{ background: "var(--tint)", color: "var(--text)" }}
              onClick={() => setOpen(false)}
              aria-label={t("misc.close")}
            >
              <CloseIcon />
            </button>
          </div>
          <nav>
            {NAV.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {t(`nav.${item.key}`)}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-accent">
              <WhatsAppIcon />
              <span>{t("nav.book")}</span>
            </a>
            <button type="button" className="lang-btn" onClick={toggleLang}>
              {lang === "ar" ? "EN" : "عربي"}
            </button>
            <button type="button" className="icon-btn" onClick={toggleTheme}>
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}