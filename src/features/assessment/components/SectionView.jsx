import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Field from "./Field";
import { pickByLang } from "./fields/parts";
import { SECTIONS } from "../data/sections";
import { validateQuestion } from "../validation/validate";
import { isRequired } from "../logic/conditions";

export default function SectionView({
  sectionNo,
  questions,
  state,
  mobileIndex,
  isMobile,
  onAnswer,
  errors,
  warnings = [],
}) {
  const { t } = useTranslation("assessment");
  const lang = state.meta.language || "ar";
  const titleRef = useRef(null);
  const bodyRef = useRef(null);

  const section = SECTIONS[sectionNo - 1];
  const title = pickByLang(lang, section.titleAr, section.titleEn);
  const shownIds = isMobile
    ? questions.slice(mobileIndex, mobileIndex + 1)
    : questions;

  // Focus management: section title on section change (desktop) / on mobile
  // the current question becomes focusable and receives focus.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (isMobile && questions.length > 0) {
        const qid = questions[Math.min(mobileIndex, questions.length - 1)].id;
        const el = bodyRef.current?.querySelector(`[data-qid="${qid}"]`);
        if (el) {
          el.setAttribute("tabindex", "-1");
          el.focus({ preventScroll: true });
        }
      } else if (titleRef.current && !isMobile) {
        titleRef.current.focus({ preventScroll: true });
      }
    }, 60);
    return () => window.clearTimeout(id);
  }, [sectionNo, mobileIndex, isMobile, questions]);

  return (
    <div className="aq-section">
      <h2
        ref={titleRef}
        tabIndex={-1}
        className="aq-section__title"
        aria-label={title}
      >
        <span className="aq-section__no">{String(sectionNo).padStart(2, "0")}</span>
        <span>{title}</span>
      </h2>
      <div className="aq-section__body" ref={bodyRef}>
        {shownIds.map((q) => {
          const required = isRequired(q.id, state);
          const rawError = errors[q.id] ? validateQuestion(q.id, state.answers[q.id], state) : null;
          const error = rawError
            ? t(`errors.${rawError}`, { min: q.min, max: q.max })
            : undefined;
          const emphasized = q.id === "Q07_09" && state.answers.Q03_01 === "weight_gain";
          const warning =
            q.id === "Q02_06"
              ? warnings.find((w) => (w.refs || []).includes(q.id))
              : undefined;
          return (
            <div
              className="aq-card aq-question-card"
              data-qid={q.id}
              key={q.id}
              tabIndex={-1}
            >
              <Field
                q={q}
                value={state.answers[q.id]}
                onChange={(v) => onAnswer(q.id, v)}
                error={error}
                required={required}
                lang={lang}
                emphasized={emphasized}
              />
              {warning && (
                <p className="aq-warning" role="note">
                  <strong>{t("warnings.note")}:</strong>{" "}
                  {t(`warnings.${warning.key}`)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}