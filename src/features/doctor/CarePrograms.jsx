import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ClipboardList, Plus, ArrowLeft, Save, Play, X, Inbox, UserRound,
} from "lucide-react";
import { careApi, patientApi } from "../../api/client";
import PatientSelector from "../shared/PatientSelector";

const statusTone = (s) =>
  ({ draft: "dash-badge--neutral", scheduled: "dash-badge--info", active: "dash-badge--primary", paused: "dash-badge--warning", completed: "dash-badge--success", cancelled: "dash-badge--danger", expired: "dash-badge--neutral" }[s] || "dash-badge--neutral");

// Phase 6D: patient-contextual. The patient is picked by name/phone from the
// directory (never by typing an internal id). When `patientId` is provided the
// workspace is already scoped to that patient.
function PlanVersionSelect({ options, label, value, onChange, busy }) {
  const { t } = useTranslation();
  if (!options || busy)
    return (
      <label className="dash-field">
        <span>{label}</span>
        {busy ? <p className="dash-muted">{t("dashboard.common.loading")}</p> : <p className="dash-muted">{t("doctorCare.selectPatientFirst")}</p>}
      </label>
    );
  return (
    <label className="dash-field">
      <span>{label}</span>
      <select
        className="dash-select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{t("doctorCare.noVersion")}</option>
        {options.map((v) => (
          <option key={v.id} value={v.id}>
            {t("doctorCare.planVersionPicker", { n: v.versionNo })}{" "}
            <span dir="ltr">({v.effectiveFrom || "?"} → {v.effectiveTo || "∞"})</span>
          </option>
        ))}
      </select>
    </label>
  );
}

function CreateProgram({ onCreate, onCancel, patientId, patientLabel }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(patientId ? { id: patientId, fullName: patientLabel || "…" } : null);
  const [versions, setVersions] = useState(null);
  const [versionsBusy, setVersionsBusy] = useState(false);
  const [nutritionVersionId, setNutritionVersionId] = useState("");
  const [exerciseVersionId, setExerciseVersionId] = useState("");

  useEffect(() => {
    if (!selected?.id) { setVersions(null); setNutritionVersionId(""); setExerciseVersionId(""); return; }
    let cancelled = false;
    setVersionsBusy(true);
    patientApi.planVersions(selected.id)
      .then((res) => { if (!cancelled) setVersions({ nutrition: res.nutrition || [], exercise: res.exercise || [] }); })
      .catch(() => { if (!cancelled) setVersions({ nutrition: [], exercise: [] }); })
      .finally(() => { if (!cancelled) setVersionsBusy(false); });
    return () => { cancelled = true; };
  }, [selected?.id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const f = new FormData(e.currentTarget);
      await onCreate({
        patientId: selected?.id,
        startDate: f.get("startDate"),
        endDate: f.get("endDate"),
        status: f.get("status") || "draft",
        nutritionPlanVersionId: nutritionVersionId || null,
        exercisePlanVersionId: exerciseVersionId || null,
        programInstructions: f.get("programInstructions") || null,
      });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <Plus />
          {t("doctorCare.createTitle")}
        </h3>
        <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={onCancel}><X />{t("dashboard.common.close") || "Close"}</button>
      </div>
      <form className="dash-form" onSubmit={submit}>
        <div className="dash-form--grid">
          {patientId ? (
            <p className="dash-hint dash-patient-context">
              <UserRound /> {t("patientSelector.selected")}: <strong>{selected?.fullName}</strong>
            </p>
          ) : (
            <PatientSelector value={selected} onSelect={setSelected} />
          )}
          <label className="dash-field">
            <span>{t("doctorCare.startDate")}</span>
            <input type="date" name="startDate" required />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.endDate")}</span>
            <input type="date" name="endDate" required />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.programStatus")}</span>
            <select className="dash-select" name="status">
              <option value="draft">{t("dashboard.status.draft") || "Draft"}</option>
              <option value="scheduled">{t("doctorCare.scheduled")}</option>
            </select>
          </label>
          <PlanVersionSelect
            options={versions?.nutrition}
            busy={versionsBusy}
            label={t("doctorCare.nutritionVersion")}
            value={nutritionVersionId}
            onChange={setNutritionVersionId}
          />
          <PlanVersionSelect
            options={versions?.exercise}
            busy={versionsBusy}
            label={t("doctorCare.exerciseVersion")}
            value={exerciseVersionId}
            onChange={setExerciseVersionId}
          />
        </div>
        <label className="dash-field">
          <span>{t("doctorCare.instructions")}</span>
          <textarea name="programInstructions" rows="2" />
        </label>
        {error && <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>}
        <button className="dash-btn dash-btn--primary" disabled={busy || !selected?.id}>
          <Save />{busy ? t("dashboard.common.loading") : t("doctorCare.create")}
        </button>
      </form>
    </section>
  );
}

function AddDefinitions({ onAdd }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const f = new FormData(e.currentTarget);
      const target = {};
      if (f.get("targetValue") !== "") target.value = Number(f.get("targetValue"));
      if (f.get("targetUnit")) target.unit = f.get("targetUnit");
      await onAdd([{
        activityType: f.get("activityType"),
        measure: f.get("measure"),
        code: f.get("code"),
        nameAr: f.get("nameAr") || null,
        nameEn: f.get("nameEn") || null,
        plannedTarget: target,
      }]);
      e.currentTarget.reset();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <Plus />
          {t("doctorCare.addDefinition")}
        </h3>
      </div>
      <form className="dash-form" onSubmit={submit}>
        <div className="dash-form--grid">
          <label className="dash-field">
            <span>{t("doctorCare.type")}</span>
            <select name="activityType">
              <option value="nutrition">🥗 {t("doctorCare.nutrition")}</option>
              <option value="exercise">💪 {t("doctorCare.exercise")}</option>
              <option value="medication">💊 {t("doctorCare.medication")}</option>
            </select>
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.measure")}</span>
            <select name="measure">
              <option value="boolean">{t("doctorCare.measureBoolean")}</option>
              <option value="sessions">{t("doctorCare.measureSessions")}</option>
              <option value="quantity">{t("doctorCare.measureQuantity")}</option>
              <option value="duration">{t("doctorCare.measureDuration")}</option>
            </select>
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.code")}</span>
            <input type="text" name="code" required />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.nameAr")}</span>
            <input type="text" name="nameAr" required />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.nameEn")}</span>
            <input type="text" name="nameEn" />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.targetValue")}</span>
            <input type="number" name="targetValue" min="0" step="any" />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.targetUnit")}</span>
            <input type="text" name="targetUnit" placeholder="g · min · sessions" />
          </label>
        </div>
        {error && <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>}
        <button className="dash-btn dash-btn--primary" disabled={busy}>
          <Plus />{busy ? t("dashboard.common.loading") : t("doctorCare.add")}
        </button>
      </form>
    </section>
  );
}

function ProgramDetail({ id, patientLabel, onBack, onChanged }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setData(await careApi.program(id));
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const activate = async (versionNo) => {
    setBusy(true);
    try {
      await careApi.activate(id, versionNo);
      await load();
      await onChanged();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const addDefinitions = async (body) => {
    try {
      await careApi.addDefinitions(id, body);
      await load();
      await onChanged();
      setShowAdd(false);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  if (!data && !error) return <p className="dash-muted">{t("dashboard.common.loading")}</p>;
  if (error && !data)
    return (
      <section className="dash-panel">
        <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>
      </section>
    );

  const { program, versions } = data;
  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <ClipboardList />
          {t("doctorCare.programDetail")}
        </span>
        <h2>{patientLabel ? `${patientLabel}` : `#${program.id}`}</h2>
        <div className="dash-row-actions">
          <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={onBack}>
            <ArrowLeft />{t("doctorCare.back")}
          </button>
          <span className={`dash-badge ${statusTone(program.status)}`}>{program.status}</span>
        </div>
      </div>
      {error && <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>}
      <div className="dash-split">
        {versions.map((version) => {
          const draft = version.status === "draft";
          return (
            <section className="dash-panel" key={version.id}>
              <div className="dash-panel__head">
                <h3 className="dash-panel__title">
                  {t("doctorCare.version", { n: version.version_no })}
                </h3>
                <span className={`dash-badge ${statusTone(version.status)}`}>{version.status}</span>
              </div>
              <div className="dash-panel__body">
                <p className="dash-muted">
                  {version.effective_from} → {version.effective_to || "∞"}
                </p>
                {draft && (
                  <div className="dash-row-actions">
                    <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => setShowAdd((s) => !s)}>
                      <Plus />{t("doctorCare.addDefinition")}
                    </button>
                    <button className="dash-btn dash-btn--primary dash-btn--sm" disabled={busy} onClick={() => activate(version.version_no)}>
                      <Play />{t("doctorCare.activate")}
                    </button>
                  </div>
                )}
                {version.definitions.length ? (
                  <ul className="dash-list">
                    {version.definitions.map((d) => (
                      <li key={d.id}>
                        <strong>{d.nameAr || d.nameEn}</strong>
                        <span className="dash-muted"> · {d.measure}{d.planned_target_json?.value != null ? ` (${d.planned_target_json.value}${d.planned_target_json.unit ? ` ${d.planned_target_json.unit}` : ""})` : ""}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dash-muted">{t("doctorCare.noDefinitions")}</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {showAdd && <AddDefinitions onAdd={addDefinitions} />}
    </>
  );
}

export default function CarePrograms({ patientId, patientLabel }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    const list = await careApi.programList(patientId ? `?patientId=${patientId}` : "");
    setRows(list || []);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  if (selected) return <ProgramDetail id={selected} patientLabel={patientLabel} onBack={() => setSelected(null)} onChanged={load} />;

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <ClipboardList />
          {t("doctorCare.title")}
        </span>
        <h2>{patientLabel ? patientLabel : t("doctorCare.title")}</h2>
        <p>{t("doctorCare.subtitle")}</p>
      </div>

      {showCreate && <CreateProgram patientId={patientId} patientLabel={patientLabel} onCreate={async (body) => { const p = await careApi.createProgram(body); setShowCreate(false); await load(); setSelected(String(p.program.id)); }} onCancel={() => setShowCreate(false)} />}

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <ClipboardList />
            {t("doctorCare.listTitle")}
          </h3>
          <div className="dash-row-actions">
            <span className="dash-badge dash-badge--primary">{rows.length}</span>
            <button className="dash-btn dash-btn--primary dash-btn--sm" onClick={() => setShowCreate((s) => !s)}>
              <Plus />{t("doctorCare.newProgram")}
            </button>
          </div>
        </div>
        {rows.length ? (
          <div className="dash-table-wrap dash-panel__body--flush">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t("doctorCare.range")}</th>
                  <th>{t("doctorCare.status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="dash-cell-muted">{p.start_date} → {p.end_date}</td>
                    <td><span className={`dash-badge ${statusTone(p.status)}`}>{p.status}</span></td>
                    <td>
                      <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => setSelected(String(p.id))}>
                        {t("doctorCare.open")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dash-empty"><Inbox /><p>{t("doctorCare.empty")}</p></div>
        )}
      </section>
    </>
  );
}