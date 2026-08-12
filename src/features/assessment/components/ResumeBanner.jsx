import { useTranslation } from "react-i18next";

export default function ResumeBanner({ onContinue, onStartOver }) {
  const { t } = useTranslation("assessment");

  return (
    <div className="aq-resume" role="dialog" aria-live="polite">
      <div className="aq-card aq-resume__card">
        <h2 className="aq-resume__title">{t("resume.title")}</h2>
        <p className="aq-resume__body">{t("resume.body")}</p>
        <p className="aq-resume__note">{t("resume.note")}</p>
        <div className="aq-resume__actions">
          <button type="button" className="aq-btn aq-btn--primary" onClick={onContinue}>
            {t("resume.continue")}
          </button>
          <button type="button" className="aq-btn aq-btn--ghost" onClick={onStartOver}>
            {t("resume.startOver")}
          </button>
        </div>
      </div>
    </div>
  );
}