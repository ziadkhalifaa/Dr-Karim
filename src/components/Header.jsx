import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/appContext";
import { usePublicSettings } from "../hooks/usePublicSettings";
import { navigate } from "../lib/router";
import Logo from "./Logo";
import { motion, AnimatePresence } from "framer-motion";
import {
  SunIcon,
  MoonIcon,
  BurgerIcon,
  CloseIcon,
  WhatsAppIcon,
  PulseIcon,
} from "./Icons";
import { LogIn } from "lucide-react";

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

  const goLogin = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(6, 30, 20, 0.85)" : "rgba(6, 30, 20, 1)",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
        color: "var(--on-brand)",
        boxShadow: scrolled ? "0 10px 40px rgba(0,0,0,0.15)" : "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="container site-header__bar">
        <a
          href="/"
          className="logo"
          aria-label={t("brand.name")}
          onClick={(e) => { e.preventDefault(); navigate("/"); }}
        >
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="logo__mark"
          >
            <img
              src="/assets/logo.png"
              alt={t("brand.name")}
              style={{ height: "54px", width: "auto", objectFit: "contain" }}
            />
          </motion.span>
          <span className="logo__text">
            <span className="logo__title">{t("brand.title")}</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main">
          {NAV.map((item, i) => (
            <motion.a
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={item.key}
              href={item.href}
              className="main-nav__link"
              onClick={(e) => { e.preventDefault(); navigate(item.href); }}
            >
              {t(`nav.${item.key}`)}
            </motion.a>
          ))}
        </nav>

        <div className="header-actions">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </motion.button>

          {/* Login Button */}
          <motion.a 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            href="/login" 
            onClick={goLogin} 
            style={{ 
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "14px", 
              border: "1.5px solid rgba(255,255,255,0.2)",
              color: "#fff", fontSize: "15px", fontWeight: "800",
              transition: "all 0.2s"
            }}
          >
            <LogIn size={18} />
            <span>{t("nav.login", "دخول")}</span>
          </motion.a>

          {/* Assessment Button */}
          <motion.a 
            whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(5, 150, 105, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            href="/assessment" 
            onClick={goAssessment} 
            style={{ 
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%)",
              color: "#fff", padding: "12px 22px", borderRadius: "14px",
              fontSize: "15px", fontWeight: "800", border: "none",
              boxShadow: "0 4px 15px rgba(5, 150, 105, 0.2)"
            }}
          >
            <PulseIcon />
            <span>{t("nav.assess")}</span>
          </motion.a>

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

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mobile-drawer"
          >
            <div className="mobile-drawer__head">
              <span className="logo">
                <span className="logo__mark">
                  <img
                    src="/assets/logo.png"
                    alt={t("brand.name")}
                    style={{ height: "44px", width: "auto", objectFit: "contain" }}
                  />
                </span>
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
              {NAV.map((item, i) => (
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {t(`nav.${item.key}`)}
                </motion.a>
              ))}
              <motion.a
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: NAV.length * 0.05 }}
                href="/login"
                onClick={(e) => {
                  setOpen(false);
                  goLogin(e);
                }}
                style={{ color: "var(--primary)" }}
              >
                <LogIn size={20} style={{ display: 'inline-block', marginInlineEnd: 10, verticalAlign: 'middle' }} />
                {t("nav.login", "تسجيل الدخول")}
              </motion.a>
            </nav>
            <div className="header-actions">
              <a href="/assessment" onClick={(e) => { setOpen(false); goAssessment(e); }} className="btn btn-accent" style={{ flex: 1, borderRadius: "14px" }}>
                <PulseIcon />
                <span>{t("nav.assess")}</span>
              </a>
            </div>
            <div className="header-actions" style={{ marginTop: "12px", justifyContent: "space-between" }}>
              <a href={settings?.social?.whatsapp || "#"} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ border: "1px solid var(--line)", color: "var(--text)", padding: "10px 16px" }}>
                <WhatsAppIcon />
                <span>{t("nav.book")}</span>
              </a>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="lang-btn" style={{ color: "var(--text)", border: "1px solid var(--line)" }} onClick={toggleLang}>
                  {lang === "ar" ? "EN" : "عربي"}
                </button>
                <button type="button" className="icon-btn" style={{ color: "var(--text)", border: "1px solid var(--line)", background: "transparent" }} onClick={toggleTheme}>
                  {theme === "light" ? <MoonIcon /> : <SunIcon />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}