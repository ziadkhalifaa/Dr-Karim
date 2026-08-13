import { useTranslation } from "react-i18next";

export default function Intro({ onStart }) {
  const { t } = useTranslation("assessment");
  const bullets = t("intro.bullets", { returnObjects: true });

  return (
    <div className="aq-screen aq-intro">
      <div className="aq-card aq-card--intro">
        <div className="aq-intro__media">
          <img src="/assets/drkarim.png" alt="" className="aq-intro__img" />
        </div>
        <p className="aq-intro__kicker">{t("intro.kicker")}</p>
        <h1 className="aq-intro__title">{t("intro.title")}</h1>
        <div className="aq-intro__copy">
          <p>{t("intro.para1")}</p>
          <p>{t("intro.para2")}</p>
          <p className="aq-intro__strong">{t("intro.para3")}</p>
          <p className="aq-intro__strong aq-intro__warn">{t("intro.para4")}</p>
          <p>{t("intro.para5")}</p>
        </div>
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