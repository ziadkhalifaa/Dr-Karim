import { useState } from "react";
import { useTranslation } from "react-i18next";
import { QUESTIONS_BY_ID } from "../data/questions";
import { validateQuestion } from "../validation/validate";

const REVIEW_ORDER = [
  "Q01_03", "Q01_04", "Q01_05", "Q02_01", "Q02_02", "Q02_06",
  "Q03_01", "HEALTH_CONDITIONS", "HEALTH_MEDS", "HEALTH_ALLERGIES",
  "LIFESTYLE_JOB", "Q06_01", "Q07_01", "Q07_05",
  "FOOD_DIET", "FOOD_DISLIKES", "FOOD_BUDGET", "FOOD_COOKTIME",
];

function optionLabel(q, value, lang) {
  const opt = (q.options || []).find((o) => o.value === value);
  if (opt) return lang === "ar" ? opt.ar : opt.en;
  return value;
}

function multiLabel(q, values, lang) {
  if (!Array.isArray(values) || values.length === 0) return "—";
  return values
    .map((v) => optionLabel(q, v, lang))
    .join(lang === "ar" ? "، " : ", ");
}

export default function ReviewStep({ state, setContact, setAck, onSubmit, onBack, submitError }) {
  const { t } = useTranslation("assessment");
  const lang = state.meta.language || "ar";
  const [errors, setErrors] = useState({});

  const answers = state.answers;
  const value = (id) => answers[id];

  const summaryRows = REVIEW_ORDER.filter((id) => QUESTIONS_BY_ID[id]).map((id) => {
    const q = QUESTIONS_BY_ID[id];
    const v = value(id);
    const isEmpty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    const label = q.type === "multi" ? multiLabel(q, v, lang) : optionLabel(q, v, lang);
    return {
      id,
      label: lang === "ar" ? q.labelAr : q.labelEn,
      text: isEmpty ? "—" : label,
    };
  });

  const phone = state.contact.handoffPhone || "";
  const consent = state.contact.consent;
  const ackAccurate = state.acknowledgements.accurate;
  const ackNoDiagnosis = state.acknowledgements.noDiagnosis;

  const update = (id, v) => {
    if (id === "C01") setContact({ patientName: v });
    if (id === "C04") setContact({ handoffPhone: v });
    if (id === "C09") setContact({ consent: v });
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const submit = () => {
    const next = {};
    const phoneErr = validateQuestion("C04", phone, state);
    if (phoneErr) next.C04 = phoneErr;
    if (!consent) next.C09 = "consent";
    if (!ackAccurate) next.ACK_ACCURATE = "consent";
    if (!ackNoDiagnosis) next.ACK_NO_DIAGNOSIS = "consent";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = document.querySelector(`[data-cc="${Object.keys(next)[0]}"]`);
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onSubmit({
      patientName: state.contact.patientName || answers.Q01_03 || "",
      contactPerson: null,
      handoffPhone: phone,
      patientPhone: "",
      preference: "whatsapp",
      consent: true,
    });
  };

  return (
    <div className="aq-screen aq-review">
      <div className="aq-card aq-review__card">
        <h2 className="aq-review__title">{t("review.title")}</h2>
        <p className="aq-review__desc">{t("review.desc")}</p>

        <div className="aq-review__rows">
          {summaryRows.map((row) => (
            <div key={row.id} className="aq-review__item">
              <span className="aq-review__k">{row.label}</span>
              <span className="aq-review__v">{row.text}</span>
            </div>
          ))}
        </div>

        <div className="aq-review__contact">
          <h3>{t("review.contactTitle")}</h3>
          <div className="aq-intake__field" data-cc="C01">
            <label className="aq-label" htmlFor="aq-C01">
              {lang === "ar" ? "الاسم الكامل" : "Full name"}
            </label>
            <input
              id="aq-C01"
              className="aq-input"
              type="text"
              value={state.contact.patientName || answers.Q01_03 || ""}
              onChange={(e) => update("C01", e.target.value)}
            />
          </div>
          <div className="aq-intake__field" data-cc="C04">
            <label className="aq-label" htmlFor="aq-C04">
              {lang === "ar" ? "رقم الموبايل (واتساب)" : "Mobile phone (WhatsApp)"}
              <span className="aq-req" aria-hidden="true">*</span>
            </label>
            <input
              id="aq-C04"
              className={`aq-input ${errors.C04 ? "is-invalid" : ""}`}
              type="tel"
              dir="ltr"
              placeholder="01xxxxxxxxx"
              value={phone}
              onChange={(e) => update("C04", e.target.value)}
            />
            {errors.C04 && (
              <p className="aq-error" role="alert">
                {t(`errors.${errors.C04}`)}
              </p>
            )}
          </div>
          <label
            className={`aq-ack ${consent ? "is-checked" : ""}`}
            data-cc="C09"
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => update("C09", e.target.checked)}
            />
            <span className="aq-consent__box" aria-hidden="true">
              {consent ? "✓" : ""}
            </span>
            <span>{lang === "ar" ? "أوافق على التواصل بخصوص التقييم." : "I agree to be contacted about my assessment."}</span>
          </label>
        </div>

        <div className="aq-review__acks">
          <label
            className={`aq-ack ${ackAccurate ? "is-checked" : ""}`}
            data-cc="ACK_ACCURATE"
          >
            <input
              type="checkbox"
              checked={ackAccurate}
              onChange={(e) => {
                setAck("accurate", e.target.checked);
                if (errors.ACK_ACCURATE) setErrors((prev) => ({ ...prev, ACK_ACCURATE: undefined }));
              }}
            />
            <span className="aq-consent__box" aria-hidden="true">
              {ackAccurate ? "✓" : ""}
            </span>
            <span>{lang === "ar" ? "أؤكد إن المعلومات اللي فوق صحيحة." : "I confirm the information above is accurate."}</span>
          </label>
          <label
            className={`aq-ack ${ackNoDiagnosis ? "is-checked" : ""}`}
            data-cc="ACK_NO_DIAGNOSIS"
          >
            <input
              type="checkbox"
              checked={ackNoDiagnosis}
              onChange={(e) => {
                setAck("noDiagnosis", e.target.checked);
                if (errors.ACK_NO_DIAGNOSIS) setErrors((prev) => ({ ...prev, ACK_NO_DIAGNOSIS: undefined }));
              }}
            />
            <span className="aq-consent__box" aria-hidden="true">
              {ackNoDiagnosis ? "✓" : ""}
            </span>
            <span>
              {lang === "ar"
                ? "فاهم إن الاستمارة أداة لجمع البيانات — مش تشخيص طبي، وهيتراجع من الدكتور قبل أي خطة."
                : "I understand this is a data-collection form — not a diagnosis — and it will be reviewed by the doctor before any plan."}
            </span>
          </label>
        </div>

        {submitError && <p className="aq-review__error" role="alert">{submitError}</p>}

        <div className="aq-actions">
          <button type="button" className="aq-btn aq-btn--ghost" onClick={onBack}>
            {t("ui.back")}
          </button>
          <button type="button" className="aq-btn aq-btn--primary" onClick={submit}>
            {t("review.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
