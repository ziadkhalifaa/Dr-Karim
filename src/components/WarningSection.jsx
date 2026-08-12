import { useTranslation } from "react-i18next";
import { CrossIcon, CheckIcon, PulseIcon } from "./Icons";

export default function WarningSection() {
  const { t } = useTranslation();
  const wrongList = t("warning.list", { returnObjects: true });
  const rightList = t("warning.goodList", { returnObjects: true });

  return (
    <section className="section" id="articles">
      <div className="container">
        <div className="services__head anim-rise">
          <span
            className="hero__kicker"
            style={{
              background: "var(--tint)",
              color: "var(--primary)",
              marginBottom: 14,
            }}
          >
            <PulseIcon />
            {t("warning.tag")}
          </span>
          <h2 className="sec-title">{t("warning.sectionTitle")}</h2>
        </div>

        <div className="warning">
          <div className="warn-card warn-card--no anim-slideR">
            <div className="warn-card__head">
              <span
                className="warn-card__badge"
                style={{ background: "var(--secondary)" }}
              >
                <CrossIcon />
              </span>
              {t("warning.title")}
            </div>
            <p className="warn-card__body">{t("warning.body")}</p>
            <ul className="warn-card__list">
              {wrongList.map((li, i) => (
                <li key={i}>{li}</li>
              ))}
            </ul>
          </div>

          <div className="warn-card warn-card--yes anim-slideL">
            <div className="warn-card__head">
              <span
                className="warn-card__badge"
                style={{ background: "var(--primary)" }}
              >
                <CheckIcon />
              </span>
              {t("warning.goodTitle")}
            </div>
            <p className="warn-card__body">{t("warning.goodBody")}</p>
            <ul className="warn-card__list">
              {rightList.map((li, i) => (
                <li key={i}>{li}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}