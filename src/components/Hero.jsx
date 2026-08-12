import { useTranslation } from "react-i18next";
import { navigate } from "../lib/router";
import PlateArt from "./Artwork";
import { PulseIcon, AppleIcon, PlanIcon, SupportIcon } from "./Icons";

export default function Hero() {
  const { t } = useTranslation();

  const goAssessment = (e) => {
    e.preventDefault();
    navigate("/assessment");
  };

  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero__inner">
          <h1 className="hero__title anim-rise">
            {t("hero.title1")}
            <strong>{t("hero.title2")}</strong>
          </h1>
          <p className="hero__subtitle anim-rise">{t("hero.subtitle")}</p>
          <div className="hero__cta-row">
            <a href="/assessment" onClick={goAssessment} className="btn btn-accent anim-pop">
              <PulseIcon />
              {t("hero.cta")}
            </a>
            <a href="#about" className="btn btn-outline anim-pop">
              {t("hero.ctaSecondary")}
            </a>
          </div>
          <p className="hero__trust anim-rise">{t("hero.trust")}</p>
        </div>

        <div className="hero__wrap">
          <PlateArt className="hero__art anim-pop" />
          <div className="hero__chip hero__chip--1 anim-pop">
            <span className="chip-ico" style={{ background: "var(--secondary)" }}>
              <AppleIcon />
            </span>
            <span>{t("hero.chip1")}</span>
          </div>
          <div className="hero__chip hero__chip--2 anim-pop">
            <span className="chip-ico" style={{ background: "var(--primary)" }}>
              <PlanIcon />
            </span>
            <span>{t("hero.chip2")}</span>
          </div>
          <div className="hero__chip hero__chip--3 anim-pop">
            <span className="chip-ico" style={{ background: "var(--gold)" }}>
              <SupportIcon />
            </span>
            <span>{t("hero.chip3")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
