// Field dispatcher — renders the right reusable field for a question by type.
// No conditional branching lives in the section/screen components.

import { useTranslation } from "react-i18next";
import { SingleField, MultiField, ScaleField, ToggleField } from "./fields/ChoiceFields";
import {
  TextField,
  TextareaField,
  NumberField,
  DateField,
  PhoneField,
  EmailField,
  ConsentField,
} from "./fields/InputFields";
import { ListField } from "./fields/ListField";
import { pickByLang } from "./fields/parts";

const FIELD_MAP = {
  single: SingleField,
  multi: MultiField,
  scale: ScaleField,
  toggle: ToggleField,
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  date: DateField,
  phone: PhoneField,
  email: EmailField,
  consent: ConsentField,
  list: ListField,
};

export default function Field({ q, value, onChange, error, required, lang, emphasized }) {
  const { t } = useTranslation("assessment");
  const FieldImpl = FIELD_MAP[q.type] || TextField;
  const help = q.helpAr && q.helpEn ? pickByLang(lang, q.helpAr, q.helpEn) : undefined;
  const errorText = error ? t(`errors.${error}`, { min: q.min, max: q.max }) : undefined;

  const wrapperClass = [
    "aq-question",
    `aq-question--${q.type}`,
    emphasized ? "is-emphasized" : "",
  ].join(" ");

  return (
    <div className={wrapperClass}>
      <FieldImpl
        q={q}
        value={value}
        onChange={onChange}
        error={errorText}
        required={required}
        lang={lang}
        help={help}
      />
    </div>
  );
}