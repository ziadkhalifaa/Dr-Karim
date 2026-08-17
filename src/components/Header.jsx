import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/appContext";
import { usePublicSettings } from "../hooks/usePublicSettings";
import { navigate, useRoute } from "../lib/router";
import { motion, AnimatePresence } from "framer-motion";
import { SunIcon, MoonIcon, CloseIcon, WhatsAppIcon, PulseIcon } from "./Icons";
import { LogIn, Menu, Globe, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthProvider";

const NAV = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "articles", href: "/articles" },
  { key: "contact", href: "/contact" },
];

export default function Header() {
  const { t } = useTranslation();
  const { settings } = usePublicSettings();
  const { theme, toggleTheme, lang, changeLang } = useApp();
  const { user, authenticated, logout } = useAuth();
  const path = useRoute();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isStaff = authenticated && user?.role !== "patient";
  const acctHref = user?.role === "patient" ? "/patient" : "/doctor";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
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

  const goLogin = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const goAcct = (e) => {
    e.preventDefault();
    navigate(acctHref);
  };

  const navTo = (e, href) => {
    e.preventDefault();
    setOpen(false);
    navigate(href);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 110, damping: 22 }}
      className={`site-header ${scrolled ? "is-scrolled" : ""}`}
    >
      <div className="container site-header__inner">
        <a
          href="/"
          className="site-header__brand"
          aria-label={t("brand.name")}
          onClick={(e) => navTo(e, "/")}
        >
          <img src="/assets/logo.png" alt={t("brand.name")} />
        </a>

        <nav className="site-header__nav" aria-label="Main">
          {NAV.map((item) => {
            const isActive = path === item.href;
            return (
              <a
                key={item.key}
                href={item.href}
                className={`site-header__link ${isActive ? "is-active" : ""}`}
                onClick={(e) => navTo(e, item.href)}
              >
                {t(`nav.${item.key}`)}
              </a>
            );
          })}
        </nav>

        <div className="site-header__actions">
          <button
            type="button"
            className="site-header__lang"
            onClick={toggleLang}
            aria-label="Language"
          >
            <Globe size={16} />
            {lang === "ar" ? "EN" : "عربي"}
          </button>

          <button
            type="button"
            className="site-header__icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          {authenticated && (
            <button
              type="button"
              className="site-header__icon"
              onClick={logout}
              aria-label={t("dashboard.shell.signOut")}
              title={t("dashboard.shell.signOut")}
            >
              <LogOut size={18} />
            </button>
          )}

          {authenticated ? (
            <a href={acctHref} onClick={goAcct} className="site-header__login">
              <LayoutDashboard size={18} />
              <span>{user?.role === "patient" ? t("nav.myAccount") : t("nav.dashboard")}</span>
            </a>
          ) : (
            <a href="/login" onClick={goLogin} className="site-header__login">
              <LogIn size={18} />
              <span>{t("nav.login", "دخول")}</span>
            </a>
          )}

          {!isStaff && (
            <a href="/assessment" onClick={goAssessment} className="site-header__cta">
              <PulseIcon />
              <span>{t("nav.assess")}</span>
            </a>
          )}

          <button
            type="button"
            className="site-header__icon site-header__burger"
            onClick={() => setOpen(true)}
            aria-label={t("misc.menu")}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: lang === "ar" ? 80 : -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: lang === "ar" ? 80 : -80 }}
            transition={{ type: "spring", stiffness: 180, damping: 26 }}
            className="mobile-menu"
          >
            <div className="mobile-menu__head">
              <a href="/" onClick={(e) => navTo(e, "/")} className="site-header__brand">
                <img src="/assets/logo.png" alt={t("brand.name")} style={{ height: 44 }} />
              </a>
              <button
                type="button"
                className="site-header__icon"
                onClick={() => setOpen(false)}
                aria-label={t("misc.close")}
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="mobile-menu__nav">
              {NAV.map((item) => {
                const isActive = path === item.href;
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    className={`mobile-menu__link ${isActive ? "is-active" : ""}`}
                    onClick={(e) => navTo(e, item.href)}
                  >
                    {t(`nav.${item.key}`)}
                  </a>
                );
              })}
            </nav>

            <div className="mobile-menu__foot">
              {authenticated ? (
                <a href={acctHref} onClick={goAcct} className="site-header__login">
                  <LayoutDashboard size={18} />
                  <span>{user?.role === "patient" ? t("nav.myAccount") : t("nav.dashboard")}</span>
                </a>
              ) : (
                <a href="/login" onClick={goLogin} className="site-header__login">
                  <LogIn size={18} />
                  <span>{t("nav.login", "تسجيل الدخول")}</span>
                </a>
              )}
              {!isStaff && (
                <a href="/assessment" onClick={goAssessment} className="site-header__cta" style={{ justifyContent: "center" }}>
                  <PulseIcon />
                  <span>{t("nav.assess")}</span>
                </a>
              )}
              {authenticated && (
                <button onClick={logout} className="site-header__login" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <LogOut size={18} />
                  <span>{t("dashboard.shell.signOut")}</span>
                </button>
              )}
              <a
                href={settings?.social?.whatsapp || "#"}
                target="_blank"
                rel="noreferrer"
                className="site-header__login"
              >
                <WhatsAppIcon />
                <span>{t("nav.book")}</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
