import { useTranslation } from "react-i18next";
import { SECTIONS } from "../data/sections";

export default function ProgressBar({ sectionNo, progress, tier, lang, ariaLive }) {
  const { t } = useTranslation("assessment");
  const idx = sectionNo - 1;
  const section = SECTIONS[idx];
  const title = lang === "ar" ? section.titleAr : section.titleEn;

  return (
    <div className="aq-progress" role="group" aria-label={t("progress.label")}>
      <div className="aq-progress__row">
        <div className="aq-progress__step" aria-live="polite" aria-atomic="true">
          {t("ui.step", { n: sectionNo })}
        </div>
        <div className="aq-progress__title">{title}</div>
      </div>
      <div
        className="aq-progress__bar"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("progress.label")}
      >
        <span className="aq-progress__fill" style={{ inlineSize: `${progress}%` }} />
      </div>
      {tier === "urgent" && (
        <p className="aq-progress__urgent" role="status">
          {t("progress.urgentNotice")}
        </p>
      )}
      <span className="sr-only" aria-live="polite">
        {ariaLive}
      </span>
    </div>
  );
}