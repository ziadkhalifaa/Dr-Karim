import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, UserRound } from "lucide-react";
import { patientApi } from "../../api/client";

const DEFAULT_STATUSES = "active,pending_payment";

// Patient picker by name/phone (Phase 6D). No internal patient ids are ever
// typed — the doctor searches and selects the person from the live directory.
export default function PatientSelector({ value, onSelect, label, placeholder, statuses = DEFAULT_STATUSES }) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const rootRef = useRef(null);

  const search = (term) => {
    setQ(term);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (!term.trim()) { setRows([]); setBusy(false); return; }
    setBusy(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await patientApi.list(`?q=${encodeURIComponent(term.trim())}&status=${statuses}&limit=8`);
        setRows(res.items || []);
      } catch {
        setRows([]);
      } finally {
        setBusy(false);
      }
    }, 250);
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => { document.removeEventListener("click", onDocClick); };
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <label className="dash-field dash-patient-selector" ref={rootRef}>
      <span>{label || t("doctorCare.patient")}</span>
      <div className="dash-patient-selector__control">
        <Search size={16} className="dash-muted-icon" />
        <input
          className="dash-input"
          value={q}
          onChange={(e) => search(e.target.value)}
          onFocus={() => { if (q.trim()) setOpen(true); }}
          placeholder={placeholder || t("patientSelector.placeholder")}
          autoComplete="off"
        />
        {value && (
          <button type="button" className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => { onSelect(null); setQ(""); setRows([]); }}>
            {t("patientSelector.clear")}
          </button>
        )}
      </div>
      {open && q.trim() && (
        <div className="dash-patient-selector__menu">
          {busy ? <p className="dash-muted">{t("dashboard.common.loading")}</p> : null}
          {!busy && rows.length === 0 ? <p className="dash-muted">{t("patientSelector.empty")}</p> : null}
          {rows.map((patient) => (
            <button
              type="button"
              key={patient.id}
              className="dash-patient-selector__option"
              onClick={() => { onSelect(patient); setOpen(false); }}
            >
              <UserRound size={16} />
              <span className="dash-patient-selector__option-main">{patient.fullName}</span>
              <span className="dash-cell-sub" dir="ltr">{patient.phoneDisplay}</span>
            </button>
          ))}
        </div>
      )}
      {value && (
        <span className="dash-hint">
          {t("patientSelector.selected")}: <strong>{value.fullName}</strong>{" "}
          <span dir="ltr">({value.phoneDisplay || value.id})</span>
        </span>
      )}
    </label>
  );
}