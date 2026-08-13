import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ClipboardList, Plus, ArrowLeft, Save, Play, X, Inbox,
} from "lucide-react";
import { careApi } from "../../api/client";

const statusTone = (s) =>
  ({ draft: "dash-badge--neutral", scheduled: "dash-badge--info", active: "dash-badge--primary", paused: "dash-badge--warning", completed: "dash-badge--success", cancelled: "dash-badge--danger", expired: "dash-badge--neutral" }[s] || "dash-badge--neutral");

function CreateProgram({ onCreate, onCancel }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const f = new FormData(e.currentTarget);
      await onCreate({
        patientId: f.get("patientId"),
        startDate: f.get("startDate"),
        endDate: f.get("endDate"),
        status: f.get("status") || "draft",
        nutritionPlanVersionId: f.get("nutritionPlanVersionId") || null,
        exercisePlanVersionId: f.get("exercisePlanVersionId") || null,
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
          <label className="dash-field">
            <span>{t("doctorCare.patientId")}</span>
            <input type="text" name="patientId" required />
          </label>
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
            <select name="status">
              <option value="draft">{t("dashboard.status.draft") || "Draft"}</option>
              <option value="scheduled">{t("doctorCare.scheduled")}</option>
            </select>
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.nutritionVersion")}</span>
            <input type="text" name="nutritionPlanVersionId" />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.exerciseVersion")}</span>
            <input type="text" name="exercisePlanVersionId" />
          </label>
        </div>
        <label className="dash-field">
          <span>{t("doctorCare.instructions")}</span>
          <textarea name="programInstructions" rows="2" />
        </label>
        {error && <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>}
        <button className="dash-btn dash-btn--primary" disabled={busy}>
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

function ProgramDetail({ id, onBack, onChanged }) {
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
        <h2>#{program.id} · {program.patient_id}</h2>
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

export default function CarePrograms() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    const list = await careApi.programList();
    setRows(list || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  if (selected) return <ProgramDetail id={selected} onBack={() => setSelected(null)} onChanged={load} />;

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <ClipboardList />
          {t("doctorCare.title")}
        </span>
        <h2>{t("doctorCare.title")}</h2>
        <p>{t("doctorCare.subtitle")}</p>
      </div>

      {showCreate && <CreateProgram onCreate={async (body) => { const p = await careApi.createProgram(body); setShowCreate(false); await load(); setSelected(String(p.program.id)); }} onCancel={() => setShowCreate(false)} />}

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
                  <th>#</th>
                  <th>{t("doctorCare.patient")}</th>
                  <th>{t("doctorCare.range")}</th>
                  <th>{t("doctorCare.status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="dash-cell-muted">#{p.id}</td>
                    <td><span className="dash-cell-main">{p.patient_id}</span></td>
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