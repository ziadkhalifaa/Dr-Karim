import { useState } from "react";
import { useTranslation } from "react-i18next";
import { hasUrgentFlag, hasStandardFlag } from "../logic/flags";
import { hasAcuteSymptoms } from "../logic/conditions";
import { getBmi } from "../assessmentState/selectors";

export default function SafetyScreen({ state, flags, onAck, onNext, onBack }) {
  const { t } = useTranslation("assessment");
  const lang = state.meta.language || "ar";
  const [errors, setErrors] = useState({});

  const urgent = hasUrgentFlag(flags);
  const standard = hasStandardFlag(flags);
  const emergency = hasAcuteSymptoms(state);
  const bmi = getBmi(state);

  const ackKeys = ["accurate", "noDiagnosis"];
  if (urgent) ackKeys.push("urgent");

  const ackLabelKey = (key) =>
    key === "accurate" ? "ackAccurate" : key === "urgent" ? "ackUrgent" : "ackNoDiagnosis";

  const submit = () => {
    const missing = ackKeys.filter((k) => state.acknowledgements[k] !== true);
    if (missing.length > 0) {
      setErrors(Object.fromEntries(missing.map((k) => [k, true])));
      document
        .querySelector(`[data-ack="${missing[0]}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onNext();
  };

  const handleAck = (key, checked) => {
    onAck(key, checked);
    if (checked) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <div className="aq-screen aq-safety">
      <p className="aq-screen__kicker">{t("safety.kicker")}</p>
      <h2 className="aq-screen__title">{t("safety.title")}</h2>
      <p className="aq-screen__sub">{t("safety.subtitle")}</p>

      <div className="aq-card aq-reminder">
        <h3 className="aq-reminder__title">{t("safety.reminderTitle")}</h3>
        <ul className="aq-reminder__list">
          <li>{t("safety.reminder1")}</li>
          <li>{t("safety.reminder2")}</li>
          <li>{t("safety.reminder3")}</li>
        </ul>
      </div>

      {urgent && (
        <div className="aq-flagblock aq-flagblock--urgent" role="status">
          <h3>{t("safety.urgentTitle")}</h3>
          <p>{t("safety.urgentText")}</p>
        </div>
      )}
      {standard && !urgent && (
        <div className="aq-flagblock aq-flagblock--standard">
          <h3>{t("safety.standardTitle")}</h3>
          <p>{t("safety.standardText")}</p>
        </div>
      )}
      {!urgent && !standard && (
        <div className="aq-flagblock aq-flagblock--none">
          <h3>{t("safety.noFlagsTitle")}</h3>
          <p>{t("safety.noFlagsText")}</p>
        </div>
      )}

      {flags.length > 0 && (
        <ul className="aq-flaglist">
          {flags.map((f) => (
            <li key={f.ruleId} className={`aq-flagitem aq-flagitem--${f.tier}`}>
              <span className="aq-flagitem__tier">
                {f.tier === "urgent" ? t("safety.urgentNotice") : t("safety.standardTitle")}
              </span>
              <span className="aq-flagitem__msg">
                {lang === "ar" ? f.message.ar : f.message.en}
              </span>
            </li>
          ))}
        </ul>
      )}

      {bmi && <p className="aq-bmi">{t("safety.bmi", { bmi })}</p>}

      {emergency && (
        <div className="aq-emergency" role="alert">
          <h3>{t("safety.emergencyTitle")}</h3>
          <p>{t("safety.emergencyText")}</p>
        </div>
      )}

      <div className="aq-card aq-acks">
        <p className="aq-label">{t("safety.acknowledgementsTitle")}</p>
        {ackKeys.map((key) => {
          const checked = state.acknowledgements[key] === true;
          return (
            <label
              key={key}
              data-ack={key}
              className={`aq-ack ${checked ? "is-checked" : ""} ${errors[key] ? "is-invalid" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => handleAck(key, e.target.checked)}
              />
              <span className="aq-consent__box" aria-hidden="true">
                {checked ? "✓" : ""}
              </span>
              <span>{t(`safety.${ackLabelKey(key)}`)}</span>
            </label>
          );
        })}
      </div>

      <div className="aq-actions">
        <button type="button" className="aq-btn aq-btn--ghost" onClick={onBack}>
          {t("ui.back")}
        </button>
        <button type="button" className="aq-btn aq-btn--primary" onClick={submit}>
          {t("ui.next")}
        </button>
      </div>
    </div>
  );
}