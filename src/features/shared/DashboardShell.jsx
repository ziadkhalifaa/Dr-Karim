import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Globe,
  Sun,
  Moon,
  Menu,
  LogOut,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { navigate } from "../../lib/router";
import { useApp } from "../../context/appContext";
import { useAuth } from "../../context/AuthProvider";

const ROLE_LABEL = {
  doctor: "dashboard.shell.roleDoctor",
  staff: "dashboard.shell.roleStaff",
  patient: "dashboard.shell.rolePatient",
};

export default function DashboardShell({ title, nav, navLabel, children }) {
  const { lang, changeLang, theme, toggleTheme } = useApp();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const onChange = () => setPath(window.location.pathname);
    const onPop = () => setPath(window.location.pathname);
    const orig = window.history.pushState;
    window.history.pushState = function (...args) {
      orig.apply(this, args);
      onChange();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.history.pushState = orig;
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const roleKey = ROLE_LABEL[user?.role] || "dashboard.shell.roleStaff";
  const initial = (user?.email || user?.role || "?").charAt(0).toUpperCase();
  const isActive = (p) => (p === "/doctor" || p === "/patient" ? path === p : path.startsWith(p));

  const NavList = () => (
    <>
      <span className="dash-nav-label">{navLabel || t("dashboard.nav.overview")}</span>
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            className={`dash-nav-item${isActive(item.path) ? " active" : ""}`}
            onClick={() => {
              navigate(item.path);
              setOpen(false);
            }}
          >
            <Icon />
            <span>{item.label}</span>
          </button>
        );
      })}
    </>
  );

  const SidebarContent = (
    <>
      <div className="dash-brand">
        <span className="dash-brand__mark">
          <img src="/assets/logo.png" alt={t("dashboard.shell.brandName")} />
        </span>
        <div>
          <div className="dash-brand__name">{t("dashboard.shell.brandName")}</div>
          <div className="dash-brand__sub">{t("dashboard.shell.brandTitle")}</div>
        </div>
      </div>

      <nav className="dash-sidebar__nav" aria-label="Workspace navigation">
        <NavList />
      </nav>

      <div className="dash-sidebar__foot">
        <div className="dash-user">
          <span className="dash-avatar">{initial}</span>
          <div className="dash-user__meta">
            <div className="dash-user__name">{user?.email || t("dashboard.shell.brandName")}</div>
            <div className="dash-user__role">{t(roleKey)}</div>
          </div>
        </div>
        <button className="dash-side-link" onClick={() => navigate("/")}>
          <ExternalLink size={16} />
          <span>{t("dashboard.shell.viewSite")}</span>
        </button>
        <button className="dash-side-link dash-side-link--danger" onClick={logout}>
          <LogOut size={16} />
          <span>{t("dashboard.shell.signOut")}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="dash">
      <aside className={`dash-sidebar${open ? "" : " dash-sidebar--hidden"}`}>
        {SidebarContent}
      </aside>

      {open && <div className="dash-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="dash-main">
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-icon-btn dash-burger"
            onClick={() => setOpen(true)}
            aria-label={t("dashboard.shell.menu")}
          >
            <Menu />
          </button>

          <div className="dash-topbar__title">
            <span className="dash-topbar__crumb">{t("dashboard.shell.brandTitle")}</span>
            <h1>{title}</h1>
          </div>

          <div className="dash-topbar__actions">
            <button
              type="button"
              className="dash-icon-btn"
              onClick={() => changeLang(lang === "ar" ? "en" : "ar")}
              aria-label="Change language"
              title={lang === "ar" ? "English" : "العربية"}
            >
              <Globe />
            </button>
            <button
              type="button"
              className="dash-icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </button>
            <span className="dash-chip">
              <ClipboardList />
              {t(roleKey)}
            </span>
            <button
              type="button"
              className="dash-icon-btn"
              onClick={logout}
              aria-label={t("dashboard.shell.signOut")}
            >
              <LogOut />
            </button>
          </div>
        </header>

        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}
