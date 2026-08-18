import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Field from "./Field";
import { pickByLang } from "./fields/parts";
import { SECTIONS } from "../data/sections";
import { validateQuestion } from "../validation/validate";
import { isRequired } from "../logic/conditions";

// Question ids rendered side-by-side in a two-column row (reference layout).
const PAIRS = [
  ["Q01_04", "Q01_05"], // age / gender
  ["Q02_01", "Q02_02"], // height / weight
  ["Q07_01", "Q07_05"], // meals / water
];

export default function SectionView({
  sectionNo,
  questions,
  state,
  onAnswer,
  errors,
  warnings = [],
}) {
  const { t } = useTranslation("assessment");
  const lang = state.meta.language || "ar";
  const section = SECTIONS[sectionNo - 1];
  const title = pickByLang(lang, section.titleAr, section.titleEn);
  const subtitle = pickByLang(lang, section.subtitleAr, section.subtitleEn);

  const renderField = (q) => {
    const required = isRequired(q.id, state);
    const rawError = errors[q.id] ? validateQuestion(q.id, state.answers[q.id], state) : null;
    const error = rawError ? t(`errors.${rawError}`, { min: q.min, max: q.max }) : undefined;
    const warning =
      q.id === "Q02_06"
        ? warnings.find((w) => (w.refs || []).includes(q.id))
        : undefined;
    return (
      <div key={q.id} className="aq-intake__field" data-qid={q.id}>
        <Field
          q={q}
          value={state.answers[q.id]}
          onChange={(v) => onAnswer(q.id, v)}
          error={error}
          required={required}
          lang={lang}
        />
        {warning && (
          <p className="aq-warning" role="note">
            <strong>{t("warnings.note")}:</strong> {t(`warnings.${warning.key}`)}
          </p>
        )}
      </div>
    );
  };

  const singleIds = new Set(questions.map((q) => q.id));
  const rendered = new Set();

  const body = [];
  for (const q of questions) {
    if (rendered.has(q.id)) continue;
    const partners = (PAIRS.find((pair) => pair.includes(q.id)) || []).filter(
      (id) => id !== q.id && singleIds.has(id)
    );
    if (partners.length === 1) {
      const other = questions.find((x) => x.id === partners[0]);
      rendered.add(q.id);
      rendered.add(other.id);
      body.push(
        <div key={`row-${q.id}`} className="aq-row2">
          <div>{renderField(q)}</div>
          <div>{renderField(other)}</div>
        </div>
      );
    } else {
      rendered.add(q.id);
      body.push(renderField(q));
    }
  }

  return (
    <div className="aq-section aq-intake">
      <div className="aq-card aq-intake__card">
        <h2 className="aq-intake__title">{title}</h2>
        <p className="aq-intake__desc">{subtitle}</p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="aq-intake__body"
        >
          {body}
        </motion.div>
      </div>
    </div>
  );
}
