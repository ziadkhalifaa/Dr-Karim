import { pickLabel, pickByLang, fieldId } from "./parts";

function ChoiceShell({ q, lang, required, help, errorId, children }) {
  return (
    <div className="aq-field">
      <fieldset className="aq-fieldset">
        <legend className="aq-label">
          <span>{pickLabel(q, lang)}</span>
          {required && <span className="aq-req" aria-hidden="true">*</span>}
        </legend>
        {help && <p className="aq-help">{help}</p>}
        <div className="aq-choices" role="group" aria-describedby={errorId || undefined}>
          {children}
        </div>
      </fieldset>
    </div>
  );
}

export function SingleField({ q, value, onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  return (
    <ChoiceShell q={q} lang={lang} required={required} help={help} errorId={errorId}>
      {(q.options || []).map((opt) => {
        const optId = fieldId(q.id, opt.value);
        const checked = value === opt.value;
        return (
          <label key={opt.value} className={`aq-choice ${checked ? "is-checked" : ""}`}>
            <input
              type="radio"
              id={optId}
              name={q.id}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="aq-choice__input"
            />
            <span className="aq-choice__box">
              <span className="aq-choice__radio" aria-hidden="true" />
              <span className="aq-choice__label">{pickLabel(opt, lang)}</span>
            </span>
          </label>
        );
      })}
      {error && (
        <p id={errorId} className="aq-error" role="alert">
          {error}
        </p>
      )}
    </ChoiceShell>
  );
}

export function MultiField({ q, value = [], onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  const toggle = (opt) => {
    const has = value.includes(opt.value);
    const isNone = opt.value === "none";
    if (isNone) {
      onChange(has ? [] : ["none"]);
      return;
    }
    const next = has
      ? value.filter((v) => v !== opt.value)
      : [...value.filter((v) => v !== "none"), opt.value];
    onChange(next);
  };
  return (
    <ChoiceShell q={q} lang={lang} required={required} help={help} errorId={errorId}>
      {(q.options || []).map((opt) => {
        const checked = value.includes(opt.value);
        const optId = fieldId(q.id, opt.value);
        return (
          <label key={opt.value} className={`aq-choice ${checked ? "is-checked" : ""}`}>
            <input
              type="checkbox"
              id={optId}
              checked={checked}
              onChange={() => toggle(opt)}
              className="aq-choice__input"
            />
            <span className="aq-choice__box">
              <span className="aq-choice__check" aria-hidden="true">
                {checked && "✓"}
              </span>
              <span className="aq-choice__label">{pickLabel(opt, lang)}</span>
            </span>
          </label>
        );
      })}
      {error && (
        <p id={errorId} className="aq-error" role="alert">
          {error}
        </p>
      )}
    </ChoiceShell>
  );
}

export function ScaleField({ q, value, onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  const min = q.scaleMin ?? 1;
  const max = q.scaleMax ?? 5;
  const opts = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <ChoiceShell q={q} lang={lang} required={required} help={help} errorId={errorId}>
      <div className="aq-scale">
        {opts.map((n) => {
          const checked = Number(value) === n;
          return (
            <button
              key={n}
              type="button"
              className={`aq-scale__opt ${checked ? "is-checked" : ""}`}
              aria-pressed={checked}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="aq-scale__labels">
        <span>{pickByLang(lang, q.labelLowAr, q.labelLowEn)}</span>
        <span>{pickByLang(lang, q.labelHighAr, q.labelHighEn)}</span>
      </div>
      {error && (
        <p id={errorId} className="aq-error" role="alert">
          {error}
        </p>
      )}
    </ChoiceShell>
  );
}

export function ToggleField({ q, value, onChange, error, required, lang, help }) {
  const errorId = error ? `aq-err-${q.id}` : undefined;
  const set = (v) => onChange(v === "yes");
  return (
    <ChoiceShell q={q} lang={lang} required={required} help={help} errorId={errorId}>
      {["yes", "no"].map((v) => {
        const checked = value === (v === "yes");
        const optId = fieldId(q.id, v);
        return (
          <label key={v} className={`aq-choice ${checked ? "is-checked" : ""}`}>
            <input
              type="radio"
              id={optId}
              name={q.id}
              checked={checked}
              onChange={() => set(v)}
              className="aq-choice__input"
            />
            <span className="aq-choice__box">
              <span className="aq-choice__radio" aria-hidden="true" />
              <span className="aq-choice__label">
                {v === "yes" ? pickByLang(lang, "نعم", "Yes") : pickByLang(lang, "لا", "No")}
              </span>
            </span>
          </label>
        );
      })}
      {error && (
        <p id={errorId} className="aq-error" role="alert">
          {error}
        </p>
      )}
    </ChoiceShell>
  );
}