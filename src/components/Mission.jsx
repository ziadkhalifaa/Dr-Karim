import { useTranslation } from "react-i18next";
import { waUrl } from "../config";
import { WhatsAppIcon } from "./Icons";

export default function Mission() {
  const { t } = useTranslation();

  return (
    <section className="section" id="about">
      <div className="container">
        <div className="mission">
          <div className="stat-card anim-slideR">
            <div className="stat-card__badge" style={{ padding: "0" }}>
              <img src="/assets/logo.png" alt="Dr Kareem Logo" style={{ width: "120px", height: "120px", objectFit: "contain" }} />
            </div>
            <p className="stat-card__meta">
              {t("mission.years")}
              <br />
            </p>
            <div className="stat-card__num">
              {t("mission.yearsNum")}
              <span className="unit"> {t("mission.yearsUnit")}</span>
            </div>
            <p className="stat-card__text">{t("mission.yearsText")}</p>
          </div>

          <div className="mission__body anim-slideL">
            <h2 className="mission__title">
              <div className="sec-title">
                {t("mission.title")} <strong>{t("mission.title2")}</strong>
              </div>
            </h2>
            <p className="mission__text">{t("mission.body")}</p>
            <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              <WhatsAppIcon />
              {t("mission.cta")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}