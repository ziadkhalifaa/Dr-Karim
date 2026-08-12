import { useTranslation } from "react-i18next";

export default function StepActions({
  onBack,
  onNext,
  nextLabel,
  nextDisabled = false,
  showBack = true,
}) {
  const { t } = useTranslation("assessment");

  return (
    <div className="aq-actions">
      {showBack ? (
        <button type="button" className="aq-btn aq-btn--ghost" onClick={onBack}>
          {t("ui.back")}
        </button>
      ) : (
        <span className="aq-actions__spacer" />
      )}
      <button
        type="button"
        className="aq-btn aq-btn--primary"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel || t("ui.next")}
      </button>
    </div>
  );
}