import { useTranslation } from "react-i18next";
import { waUrl } from "../config";
import PlateArt, { ResultsArt } from "./Artwork";
import { WhatsAppIcon } from "./Icons";

export default function CareSection() {
  const { t } = useTranslation();

  return (
    <section className="section">
      <div className="container">
        <div className="care">
          <div className="care-card care-card--brand anim-slideR">
            <h3 className="card-title">{t("care.title")}</h3>
            <p className="card-body">{t("care.body")}</p>
            <div>
              <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-accent">
                <WhatsAppIcon />
                {t("care.cta")}
              </a>
            </div>
          </div>

          <div className="care__img anim-pop">
            <PlateArt />
          </div>

          <div className="care-card care-card--tint anim-slideL">
            <h3 className="card-title">{t("care.guideTitle")}</h3>
            <p className="card-body">{t("care.guideBody")}</p>
          </div>
        </div>

        <div className="spacer" />

        <div className="programs">
          <div className="programs__card anim-slideL">
            <h3 className="card-title">{t("care.programsTitle")}</h3>
            <p className="card-body">{t("care.programsBody")}</p>
          </div>
          <div className="care__img anim-pop">
            <ResultsArt />
          </div>
        </div>
      </div>
    </section>
  );
}