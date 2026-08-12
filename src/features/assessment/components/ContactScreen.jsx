import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getSubject, getAgeYears } from "../logic/conditions";
import { validateQuestion } from "../validation/validate";
import { QUESTIONS_BY_ID } from "../data/questions";
import Field from "./Field";

// Contact step (spec "Contact-Capture Step" + CL17). patient ≠ contact person.
export default function ContactScreen({ state, setContact, setContactPerson, onSubmit, onBack, submitError }) {
  const { t } = useTranslation("assessment");
  const lang = state.meta.language || "ar";
  const [errors, setErrors] = useState({});

  const someone = getSubject(state) === "someone_else";
  const age = getAgeYears(state);
  const minor = someone && age !== null && age < 18;

  const contactIds = ["C01", someone && "C02", someone && "C03", "C04", "C05", "C06", "C07", "C08", "C09"].filter(Boolean);

  const contactValue = (id) => {
    const c = state.contact;
    switch (id) {
      case "C01": return c.patientName;
      case "C02": return c.contactPerson.name;
      case "C03": return c.contactPerson.relationship;
      case "C04": return c.handoffPhone;
      case "C05": return c.patientPhone;
      case "C06": return c.preference;
      case "C07": return c.email;
      case "C08": return c.bestTime;
      case "C09": return c.consent;
      default: return "";
    }
  };

  const changeValue = (id, value) => {
    if (id === "C02" || id === "C03") setContactPerson({ [id === "C02" ? "name" : "relationship"]: value });
    else if (id === "C01") setContact({ patientName: value });
    else if (id === "C04") setContact({ handoffPhone: value });
    else if (id === "C05") setContact({ patientPhone: value });
    else if (id === "C06") setContact({ preference: value });
    else if (id === "C07") setContact({ email: value });
    else if (id === "C08") setContact({ bestTime: value });
    else if (id === "C09") setContact({ consent: value });
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const submit = () => {
    const next = {};
    for (const id of contactIds) {
      const q = QUESTIONS_BY_ID[id];
      const required = q.required === "*" || (q.required === "c" && (id === "C02" || id === "C03"));
      if (required) {
        const err = validateQuestion(id, contactValue(id), state);
        if (err) next[id] = err;
      } else if (contactValue(id) !== "" && contactValue(id) !== false && contactValue(id) !== undefined) {
        const err = validateQuestion(id, contactValue(id), state);
        if (err) next[id] = err;
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      document
        .querySelector(`[data-cc="${Object.keys(next)[0]}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onSubmit();
  };

  return (
    <div className="aq-screen aq-contact">
      <h2 className="aq-screen__title">{t("contact.title")}</h2>
      <p className="aq-screen__sub">{t("contact.subtitle")}</p>

      <div className="aq-card aq-cc">
        {contactIds.map((id) => {
          const q = QUESTIONS_BY_ID[id];
          const errKey = errors[id] ? t(`errors.${errors[id]}`, { min: q.min, max: q.max }) : undefined;
          return (
            <div key={id} data-cc={id}>
              <Field
                q={q}
                value={contactValue(id)}
                onChange={(v) => changeValue(id, v)}
                error={errKey}
                required={q.required === "*" || (q.required === "c" && (id === "C02" || id === "C03"))}
                lang={lang}
              />
            </div>
          );
        })}
      </div>

      {minor && (
        <p className="aq-contact__note" role="status">
          {lang === "ar"
            ? `المسؤول عن هذا التقييم هو ولي الأمر/مقدّم الرعاية (${state.contact.contactPerson.relationship || ""}).`
            : `The responsible contact for this assessment is the guardian/caregiver (${state.contact.contactPerson.relationship || ""}).`}
        </p>
      )}

      {submitError && <p className="aq-contact__note" role="alert">{submitError}</p>}

      <p className="aq-contact__note">{t("contact.note")}</p>

      <div className="aq-actions">
        <button type="button" className="aq-btn aq-btn--ghost" onClick={onBack}>
          {t("ui.back")}
        </button>
        <button type="button" className="aq-btn aq-btn--primary" onClick={submit}>
          {t("contact.submit")}
        </button>
      </div>
    </div>
  );
}
