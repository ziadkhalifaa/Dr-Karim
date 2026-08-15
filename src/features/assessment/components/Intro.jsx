import { useTranslation } from "react-i18next";

export default function Intro({ onStart }) {
  const { t } = useTranslation("assessment");
  const bullets = t("intro.bullets", { returnObjects: true });

  return (
    <div className="aq-screen aq-intro">
      <div className="aq-card aq-card--intro">
        <div className="aq-intro__badge" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <p className="aq-intro__kicker">{t("intro.kicker")}</p>
        <h1 className="aq-intro__title">{t("intro.title")}</h1>

        <div className="aq-intro__copy">
          <p className="aq-intro__lead">{t("intro.para1")}</p>
          <p>{t("intro.para2")}</p>
          <p className="aq-intro__strong">{t("intro.para3")}</p>
        </div>

        <div className="aq-intro__warn" role="note">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p>{t("intro.para4")}</p>
        </div>

        <p className="aq-intro__private">{t("intro.para5")}</p>

        <ul className="aq-intro__bullets">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <button type="button" className="aq-btn aq-btn--accent aq-intro__cta" onClick={onStart}>
          {t("intro.cta")}
        </button>
      </div>
    </div>
  );
}
