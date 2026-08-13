import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Target, Plus, Save, Play, X, Inbox, TrendingDown, TrendingUp, Minus, History,
} from "lucide-react";
import { progressApi } from "../../api/client";
import PatientSelector from "../shared/PatientSelector";

const goalStatusTone = (s) =>
  ({ draft: "dash-badge--neutral", active: "dash-badge--primary", closed: "dash-badge--success", cancelled: "dash-badge--danger", superseded: "dash-badge--neutral" }[s] || "dash-badge--neutral");

function fmt(n) {
  return n == null ? "—" : (typeof n === "number" ? n.toFixed(1).replace(/\.0$/, "") : n);
}

function Kpi({ icon, label, value }) {
  return (
    <div className="dash-panel dash-progress-kpi">
      <div className="dash-progress-kpi__icon">{icon}</div>
      <div className="dash-progress-kpi__body">
        <div className="dash-muted">{label}</div>
        <div className="dash-progress-kpi__value">{value}</div>
      </div>
    </div>
  );
}

function RecordMeasurement({ patientId, onSaved }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await progressApi.recordMeasurement({
        patientId,
        measurementType: "weight",
        value: Number(f.get("value")),
        measuredOn: f.get("measuredOn") || undefined,
        source: "doctor",
      });
      e.currentTarget.reset();
      onSaved();
    } catch (err) {
      setError(err.message || t("doctorProgress.recordError"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="dash-form" onSubmit={submit}>
      <div className="dash-form--grid">
        <label className="dash-field">
          <span>{t("doctorProgress.recordValue")} (kg)</span>
          <input type="number" name="value" min="20" max="400" step="any" required />
        </label>
        <label className="dash-field">
          <span>{t("doctorProgress.recordDate")}</span>
          <input type="date" name="measuredOn" />
        </label>
      </div>
      {error && <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>}
      <button className="dash-btn dash-btn--primary" disabled={busy}><Plus />{busy ? t("doctorProgress.saving") : t("doctorProgress.record")}</button>
    </form>
  );
}

function CreateGoal({ patientId, onSaved }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await progressApi.createGoal({ patientId, goalType: "weight", targetValue: Number(f.get("targetValue")), startDate: f.get("startDate") || undefined, targetDate: f.get("targetDate") || undefined });
      e.currentTarget.reset();
      onSaved();
    } catch (err) {
      setError(err.message || t("doctorProgress.goalError"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="dash-form" onSubmit={submit}>
      <div className="dash-form--grid">
        <label className="dash-field">
          <span>{t("doctorProgress.targetValue")} (kg)</span>
          <input type="number" name="targetValue" min="20" max="400" step="any" required />
        </label>
        <label className="dash-field">
          <span>{t("doctorProgress.startDate")}</span>
          <input type="date" name="startDate" />
        </label>
        <label className="dash-field">
          <span>{t("doctorProgress.targetDate")}</span>
          <input type="date" name="targetDate" />
        </label>
      </div>
      {error && <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>}
      <button className="dash-btn dash-btn--primary" disabled={busy}><Save />{busy ? t("doctorProgress.saving") : t("doctorProgress.createGoal")}</button>
    </form>
  );
}

function GoalList({ goals, onAction }) {
  const { t } = useTranslation();
  const [busyId, setBusyId] = useState(null);
  const [newTarget, setNewTarget] = useState({});
  if (!goals || !goals.length) {
    return <div className="dash-empty">{t("doctorProgress.noGoals")}</div>;
  }
  const run = async (id, fn) => {
    setBusyId(id);
    try { await fn(); } finally { setBusyId(null); }
  };
  return (
    <ul className="dash-list">
      {goals.map((g) => {
        const active = g.currentVersion;
        return (
          <li key={g.id} className="dash-list__row">
            <div className="dash-list__body">
              <div>
                <span className={`dash-badge ${goalStatusTone(g.status)}`}>{t(`doctorProgress.goalStatus.${g.status}`)}</span>
                {active ? <span className="dash-muted"> · {t("doctorProgress.versionLabel", { n: active.version_no })}</span> : null}
              </div>
              <div className="dash-list__title">
                {t("doctorProgress.goalTitle", { target: fmt(active?.target_value ?? active?.targetValue), unit: t("doctorProgress.unitWeight") })}
              </div>
              {g.targetDate ? <div className="dash-muted">{t("doctorProgress.byDate", { date: g.targetDate })}</div> : null}
            </div>
            <div className="dash-list__actions">
              {g.status === "draft" && (
                <button className="dash-btn dash-btn--success dash-btn--sm" disabled={busyId === g.id} onClick={() => run(g.id, () => onAction("activate", g.id))}>
                  <Play />{t("doctorProgress.activate")}
                </button>
              )}
              {["draft", "active"].includes(g.status) && (
                <form
                  className="dash-inline-form"
                  onSubmit={(e) => { e.preventDefault(); run(g.id, async () => { await onAction("version", g.id, { targetValue: Number(newTarget[g.id]) }); setNewTarget((s) => ({ ...s, [g.id]: "" })); }); }}
                >
                  <input type="number" min="20" max="400" step="any" placeholder={t("doctorProgress.newTarget")} value={newTarget[g.id] || ""} onChange={(e) => setNewTarget((s) => ({ ...s, [g.id]: e.target.value }))} />
                  <button className="dash-btn dash-btn--sm dash-btn--ghost" disabled={busyId === g.id || !newTarget[g.id]}><Plus /></button>
                </form>
              )}
              {g.status === "active" && (
                <button className="dash-btn dash-btn--ghost dash-btn--sm" disabled={busyId === g.id} onClick={() => run(g.id, () => onAction("close", g.id))}>
                  <X />{t("doctorProgress.close")}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Phase 6D: patient-contextual progress. In context mode (`patientId` from the
// patient profile) the workspace is already scoped to that person; in standalone
// mode the doctor picks the patient by name/phone — never by typing an id.
export default function DoctorProgress({ patientId, patientLabel }) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(patientId || null);
  const [loadedPatient, setLoadedPatient] = useState(patientId ? { id: patientId, fullName: patientLabel } : null);
  const [data, setData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [activeView, setActiveView] = useState("overview");
  const [error, setError] = useState("");

  const load = (id) => {
    if (!id) return;
    setError("");
    Promise.all([
      progressApi.dashboard(id),
      progressApi.goals(id),
    ]).then(([dash, g]) => {
      setData(dash);
      setGoals(g.items || []);
      setLoaded(id);
    }).catch((err) => setError(err.message || String(err)));
  };

  useEffect(() => {
    if (patientId) load(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const reload = () => load(loaded);
  const resetView = () => { setLoaded(null); setLoadedPatient(null); setData(null); setGoals([]); setActiveView("overview"); };

  const open = (patient) => {
    setLoadedPatient(patient);
    load(patient.id);
    setActiveView("overview");
  };

  const goalAction = async (action, goalId, body) => {
    if (action === "activate") await progressApi.activateGoal(goalId);
    else if (action === "version") await progressApi.addVersion(goalId, body);
    else if (action === "close") await progressApi.closeGoal(goalId, { status: "closed" });
    await load(loaded);
  };

  const weight = data?.byType?.weight;
  const delta = weight?.delta;

  const ActionBar = ({ title, showBack }) => (
    <div className="dash-page-head">
      <h2 className="dash-page-title">{t("doctorProgress.title")}</h2>
      {showBack ? (
        <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={resetView}><History />{t("doctorProgress.anotherPatient")}</button>
      ) : null}
      <span className="dash-muted">{title}</span>
    </div>
  );

  const isContext = Boolean(patientId);

  return (
    <div className="dash-stack">
      <ActionBar title={t("doctorProgress.subtitle")} showBack={!isContext} />

      {!loaded ? (
        <section className="dash-panel">
          <div className="dash-panel__head">
            <h3 className="dash-panel__title"><Target />{t("doctorProgress.selectPatient")}</h3>
          </div>
          <div className="dash-form">
            <PatientSelector
              value={loadedPatient}
              onSelect={(p) => { if (p?.id) open(p); }}
            />
            {error && <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>}
          </div>
        </section>
      ) : (
        <>
          <ActionBar title={loadedPatient?.fullName || `${t("doctorProgress.patientLabel")} #${loaded}`} showBack={!isContext} />
          <div className="dash-tabs">
            <button className={`dash-tab ${activeView === "overview" ? "dash-tab--active" : ""}`} onClick={() => setActiveView("overview")}>{t("doctorProgress.tabOverview")}</button>
            <button className={`dash-tab ${activeView === "goals" ? "dash-tab--active" : ""}`} onClick={() => setActiveView("goals")}>{t("doctorProgress.tabGoals")}</button>
            <button className={`dash-tab ${activeView === "history" ? "dash-tab--active" : ""}`} onClick={() => setActiveView("history")}>{t("doctorProgress.tabHistory")}</button>
          </div>

          {activeView === "overview" && (
            <>
              <div className="dash-grid dash-progress-kpis">
                <Kpi icon={delta == null ? <Minus className="dash-inline-icon" /> : (delta < 0 ? <TrendingDown className="dash-inline-icon" /> : <TrendingUp className="dash-inline-icon" />)} label={t("doctorProgress.currentWeight")} value={`${fmt(weight?.current?.value)} ${t("doctorProgress.unitWeight")}`} />
                <Kpi icon={<Minus className="dash-inline-icon" />} label={t("doctorProgress.startWeight")} value={`${fmt(weight?.starting?.value)} ${t("doctorProgress.unitWeight")}`} />
                <Kpi icon={<Minus className="dash-inline-icon" />} label={t("doctorProgress.change")} value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${fmt(delta)} ${t("doctorProgress.unitWeight")}`} />
                <Kpi icon={<Minus className="dash-inline-icon" />} label={t("doctorProgress.measurements")} value={weight?.count ?? 0} />
              </div>

              <section className="dash-panel">
                <div className="dash-panel__head">
                  <h3 className="dash-panel__title"><Plus />{t("doctorProgress.recordTitle")}</h3>
                </div>
                <RecordMeasurement patientId={loaded} onSaved={reload} />
              </section>
            </>
          )}

          {activeView === "goals" && (
            <>
              <section className="dash-panel">
                <div className="dash-panel__head">
                  <h3 className="dash-panel__title"><Plus />{t("doctorProgress.createGoalTitle")}</h3>
                </div>
                <CreateGoal patientId={loaded} onSaved={reload} />
              </section>
              <section className="dash-panel">
                <div className="dash-panel__head">
                  <h3 className="dash-panel__title"><Target />{t("doctorProgress.goalsTitle")}</h3>
                </div>
                <GoalList goals={goals} onAction={goalAction} />
              </section>
            </>
          )}

          {activeView === "history" && (
            <section className="dash-panel">
              <div className="dash-panel__head">
                <h3 className="dash-panel__title"><History />{t("doctorProgress.historyTitle")}</h3>
              </div>
              {data?.recent?.length ? (
                <ul className="dash-list">
                  {data.recent.map((m) => (
                    <li key={m.id} className="dash-list__row">
                      <div className="dash-list__body">
                        <div className="dash-list__title">{fmt(m.value)}{m.unit}</div>
                        <div className="dash-muted">{m.measuredOn} · {m.source === "checkin" ? t("doctorProgress.sourceCheckin") : t(`doctorProgress.source.${m.source}`)} · {m.kind === "correction" ? t("doctorProgress.corrected") : t("doctorProgress.recorded")}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="dash-empty"><Inbox />{t("doctorProgress.noData")}</div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}