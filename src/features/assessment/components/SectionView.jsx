import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  UserRound,
  Ruler,
  Target,
  HeartPulse,
  Pill,
  Activity,
  Utensils,
  Salad,
  ClipboardCheck,
} from "lucide-react";
import Field from "./Field";
import { pickByLang } from "./fields/parts";
import { SECTIONS } from "../data/sections";
import { validateQuestion } from "../validation/validate";
import { isRequired } from "../logic/conditions";

const SECTION_ICONS = {
  1: UserRound,
  2: Ruler,
  3: Target,
  4: HeartPulse,
  5: Pill,
  6: Activity,
  7: Utensils,
  8: Salad,
  9: ClipboardCheck,
};

export default function SectionView({
  sectionNo,
  questions,
  state,
  mobileIndex,
  onAnswer,
  errors,
  warnings = [],
}) {
  const { t } = useTranslation("assessment");
  const lang = state.meta.language || "ar";
  const bodyRef = useRef(null);

  const section = SECTIONS[sectionNo - 1];
  const title = pickByLang(lang, section.titleAr, section.titleEn);
  const subtitle = pickByLang(lang, section.subtitleAr, section.subtitleEn);
  const Icon = SECTION_ICONS[sectionNo] || ClipboardCheck;

  const idx = Math.min(mobileIndex, Math.max(0, questions.length - 1));
  const question = questions[idx];
  const total = questions.length;

  // Focus the current question wrapper without stealing keystrokes while typing.
  useEffect(() => {
    if (!question) return;
    const id = window.setTimeout(() => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";
      if (isTyping) return;
      const el = bodyRef.current?.querySelector(`[data-qid="${question.id}"]`);
      if (el) {
        el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    }, 60);
    return () => window.clearTimeout(id);
  }, [sectionNo, question]);

  if (!question) return null;

  const required = isRequired(question.id, state);
  const rawError = errors[question.id] ? validateQuestion(question.id, state.answers[question.id], state) : null;
  const error = rawError ? t(`errors.${rawError}`, { min: question.min, max: question.max }) : undefined;
  const warning =
    question.id === "Q02_06"
      ? warnings.find((w) => (w.refs || []).includes(question.id))
      : undefined;

  return (
    <div className="aq-section">
      <div className="aq-hero">
        <div className="aq-hero__icon" aria-hidden="true">
          <Icon />
        </div>
        <div className="aq-hero__text">
          <span className="aq-hero__kicker">
            {lang === "ar" ? `القسم ${sectionNo} من ٩` : `Part ${sectionNo} of 9`}
          </span>
          <h2 className="aq-hero__title">{title}</h2>
          <p className="aq-hero__sub">{subtitle}</p>
        </div>
      </div>

      <div className="aq-step-meta" aria-hidden="true">
        <span>{lang === "ar" ? `سؤال ${idx + 1} من ${total}` : `Question ${idx + 1} of ${total}`}</span>
        <span className="aq-step-dots">
          {questions.map((q, i) => (
            <i
              key={q.id}
              className={i <= idx ? "is-done" : ""}
              title={i + 1}
            />
          ))}
        </span>
      </div>

      <div className="aq-section__body" ref={bodyRef}>
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 18, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="aq-card aq-question-card"
          data-qid={question.id}
          tabIndex={-1}
        >
          <Field
            q={question}
            value={state.answers[question.id]}
            onChange={(v) => onAnswer(question.id, v)}
            error={error}
            required={required}
            lang={lang}
          />
          {warning && (
            <p className="aq-warning" role="note">
              <strong>{t("warnings.note")}:</strong> {t(`warnings.${warning.key}`)}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
