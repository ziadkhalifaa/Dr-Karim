import { pickLabel, pickByLang, fieldId } from "./parts";

function TextShell({ q, lang, required, help, error, errorId, children }) {
  return (
    <div className="aq-field">
      <label className="aq-label" htmlFor={fieldId(q.id)}>
        <span>{pickLabel(q, lang)}</span>
        {required && <span className="aq-req" aria-hidden="true">*</span>}
      </label>
      {help && <p className="aq-help">{help}</p>}
      {children}
      {error && (
        <p id={errorId} className="aq-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ q, value = "", onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  return (
    <TextShell q={q} lang={lang} required={required} help={help} error={error} errorId={errorId}>
      <input
        id={fieldId(q.id)}
        className={`aq-input ${error ? "is-invalid" : ""}`}
        type="text"
        value={value}
        maxLength={q.validation?.max ?? 100}
        onChange={(e) => onChange(e.target.value)}
        placeholder={pickByLang(lang, q.placeholderAr, q.placeholderEn)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
    </TextShell>
  );
}

export function TextareaField({ q, value = "", onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  return (
    <TextShell q={q} lang={lang} required={required} help={help} error={error} errorId={errorId}>
      <textarea
        id={fieldId(q.id)}
        className={`aq-input aq-textarea ${error ? "is-invalid" : ""}`}
        value={value}
        maxLength={q.validation?.max ?? 1000}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        placeholder={pickByLang(lang, q.placeholderAr, q.placeholderEn)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
    </TextShell>
  );
}

export function NumberField({ q, value = "", onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  const unit = pickByLang(lang, q.unit?.ar, q.unit?.en);
  return (
    <TextShell q={q} lang={lang} required={required} help={help} error={error} errorId={errorId}>
      <div className="aq-inputwrap">
        <input
          id={fieldId(q.id)}
          className={`aq-input aq-input--number ${error ? "is-invalid" : ""}`}
          type="number"
          inputMode="decimal"
          min={q.min}
          max={q.max}
          step={q.step ?? "any"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        />
        {unit && <span className="aq-unit">{unit}</span>}
      </div>
    </TextShell>
  );
}

export function DateField({ q, value = "", onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <TextShell q={q} lang={lang} required={required} help={help} error={error} errorId={errorId}>
      <input
        id={fieldId(q.id)}
        className={`aq-input ${error ? "is-invalid" : ""}`}
        type="date"
        value={value || ""}
        max={today}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
    </TextShell>
  );
}

export function PhoneField({ q, value = "", onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  return (
    <TextShell q={q} lang={lang} required={required} help={help} error={error} errorId={errorId}>
      <input
        id={fieldId(q.id)}
        className={`aq-input ${error ? "is-invalid" : ""}`}
        type="tel"
        inputMode="tel"
        value={value}
        dir="ltr"
        maxLength={20}
        onChange={(e) => onChange(e.target.value)}
        placeholder="01xxxxxxxxx"
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
    </TextShell>
  );
}

export function EmailField({ q, value = "", onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  return (
    <TextShell q={q} lang={lang} required={required} help={help} error={error} errorId={errorId}>
      <input
        id={fieldId(q.id)}
        className={`aq-input ${error ? "is-invalid" : ""}`}
        type="email"
        inputMode="email"
        value={value}
        dir="ltr"
        maxLength={200}
        onChange={(e) => onChange(e.target.value)}
        placeholder="name@example.com"
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
    </TextShell>
  );
}

export function ConsentField({ q, value = false, onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  return (
    <div className={`aq-field aq-field--consent ${error ? "is-invalid" : ""}`}>
      <label className="aq-consent">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="aq-consent__input"
          aria-describedby={errorId}
        />
        <span className="aq-consent__box" aria-hidden="true">
          {value === true && "✓"}
        </span>
        <span className="aq-consent__label">
          {pickLabel(q, lang)}
          {required && <span className="aq-req" aria-hidden="true">*</span>}
        </span>
      </label>
      {help && <p className="aq-help">{help}</p>}
      {error && (
        <p id={errorId} className="aq-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}