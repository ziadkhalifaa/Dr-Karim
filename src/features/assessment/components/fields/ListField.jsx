import { useState } from "react";
import { useTranslation } from "react-i18next";
import { pickLabel, fieldId } from "./parts";

function CellEditor({ col, lang, value, onChange, onDelete, deleteLabel }) {
  if (col.type === "single") {
    return (
      <div className="aq-row__cell aq-row__cell--single">
        <div className="aq-row__options">
          {(col.options || []).map((opt) => {
            const checked = value === opt.value;
            return (
              <label key={opt.value} className={`aq-chip ${checked ? "is-checked" : ""}`}>
                <input
                  type="radio"
                  name={col.key}
                  value={opt.value}
                  checked={checked}
                  onChange={() => onChange(opt.value)}
                />
                <span className="aq-chip__label">{pickLabel(opt, lang)}</span>
              </label>
            );
          })}
        </div>
        {onDelete && (
          <button type="button" className="aq-row__del" onClick={onDelete} aria-label={deleteLabel}>
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="aq-row__cell">
      <label className="aq-row__cell-label" htmlFor={fieldId(undefined, col.key)}>
        {pickLabel(col, lang)}
      </label>
      <input
        id={fieldId(undefined, col.key)}
        className="aq-input aq-row__input"
        type={col.type === "number" ? "number" : "text"}
        value={value ?? ""}
        maxLength={col.max ?? 100}
        onChange={(e) => onChange(e.target.value)}
      />
      {onDelete && (
        <button type="button" className="aq-row__del" onClick={onDelete} aria-label={deleteLabel}>
          ✕
        </button>
      )}
    </div>
  );
}

export function ListField({ q, value = [], onChange, error, required, lang, help }) {
  const { t } = useTranslation("assessment");
  const errorId = error ? `aq-err-${q.id}` : undefined;
  const [nextKey, setNextKey] = useState(0);

  const updateRow = (i, key, v) => {
    const rows = value.map((r) => ({ ...r }));
    rows[i] = { ...rows[i], [key]: v };
    onChange(rows);
  };

  const removeRow = (i) => onChange(value.filter((_, idx) => idx !== i));

  const addRow = () => {
    const row = Object.fromEntries(q.columns.map((c) => [c.key, c.type === "single" ? "" : ""]));
    onChange([...value, { ...row, _k: nextKey }]);
    setNextKey((k) => k + 1);
  };

  return (
    <div className="aq-field">
      <fieldset className="aq-fieldset">
        <legend className="aq-label">
          <span>{pickLabel(q, lang)}</span>
          {required && <span className="aq-req" aria-hidden="true">*</span>}
        </legend>
        {help && <p className="aq-help">{help}</p>}
        <div className="aq-list">
          {value.map((row, i) => (
            <div className="aq-row" key={row._k ?? i}>
              {q.columns.map((col) => (
                <CellEditor
                  key={col.key}
                  col={col}
                  lang={lang}
                  value={row[col.key]}
                  onChange={(v) => updateRow(i, col.key, v)}
                  onDelete={value.length > 1 ? () => removeRow(i) : undefined}
                  deleteLabel={t("ui.remove")}
                />
              ))}
            </div>
          ))}
        </div>
        <button type="button" className="aq-add" onClick={addRow}>
          + {t("ui.add")}
        </button>
        {error && (
          <p id={errorId} className="aq-error" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    </div>
  );
}