import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getSubject, getAgeYears } from "../logic/conditions";
import { validateQuestion } from "../validation/validate";
import { QUESTIONS_BY_ID } from "../data/questions";
import Field from "./Field";

const GUARDIAN_RELATIONSHIPS = ["parent", "grandparent", "legal_guardian"];

// Contact step (spec "Contact-Capture Step" + CL17). patient ≠ contact person.
// C02/C03 (contact person name + relationship) are shown only when assessing
// someone else or a minor — the relationship is prefilled from Q01_02 for
// someone_else so the question is not asked twice.
export default function ContactScreen({ state, setContact, onSubmit, onBack, submitError }) {
  const { t } = useTranslation("assessment");
  const lang = state.meta.language || "ar";
  const [errors, setErrors] = useState({});

  const someone = getSubject(state) === "someone_else";
  const age = getAgeYears(state);
  const isMinor = age !== null && age < 18;

  const needsContactPerson = someone || isMinor;
  const needsRelationship = isMinor && !someone;

  const contactIds = [
    "C01",
    ...(needsContactPerson ? ["C02"] : []),
    ...(needsRelationship ? ["C03"] : []),
    "C04",
    "C05",
    "C06",
    "C09",
  ];

  const relationDefault = state.answers.Q01_02 || state.contact.contactPerson.relationship || "";

  const contactValue = (id) => {
    const c = state.contact;
    switch (id) {
      case "C01": return c.patientName;
      case "C02": return c.contactPerson.name;
      case "C03": return c.contactPerson.relationship || relationDefault;
      case "C04": return c.handoffPhone;
      case "C05": return c.patientPhone;
      case "C06": return c.preference;
      case "C09": return c.consent;
      default: return "";
    }
  };

  const changeValue = (id, value) => {
    const c = state.contact;
    if (id === "C01") setContact({ patientName: value });
    else if (id === "C02") setContact({ contactPerson: { ...c.contactPerson, name: value } });
    else if (id === "C03") setContact({ contactPerson: { ...c.contactPerson, relationship: value } });
    else if (id === "C04") setContact({ handoffPhone: value });
    else if (id === "C05") setContact({ patientPhone: value });
    else if (id === "C06") setContact({ preference: value });
    else if (id === "C09") setContact({ consent: value });
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const submit = () => {
    const next = {};
    for (const id of contactIds) {
      const q = QUESTIONS_BY_ID[id];
      const required = q.required === "*" || q.required === "c";
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

    const relationship =
      state.contact.contactPerson.relationship || state.answers.Q01_02 || "";
    const contactPerson = {
      name:
        state.contact.contactPerson.name ||
        (someone ? state.contact.patientName : ""),
      relationship,
      isGuardian: isMinor && GUARDIAN_RELATIONSHIPS.includes(relationship),
    };
    onSubmit({
      patientName: state.contact.patientName,
      contactPerson,
      handoffPhone: state.contact.handoffPhone,
      patientPhone: state.contact.patientPhone,
      preference: state.contact.preference,
      consent: state.contact.consent,
    });
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
                required={q.required === "*" || q.required === "c"}
                lang={lang}
              />
            </div>
          );
        })}
      </div>

      {isMinor && (
        <p className="aq-contact__note" role="status">
          {lang === "ar"
            ? `المسؤول عن هذا التقييم هو ولي الأمر/مقدّم الرعاية (${relationDefault}).`
            : `The responsible contact for this assessment is the guardian/caregiver (${relationDefault}).`}
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
