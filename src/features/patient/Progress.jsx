import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Scale, Target, CalendarClock, Plus, TrendingDown, TrendingUp, Minus, RefreshCcw } from "lucide-react";
import { progressApi } from "../../api/client";

function fmt(n) {
  return n == null ? "—" : (typeof n === "number" ? n.toFixed(1).replace(/\.0$/, "") : n);
}

function TrendIcon({ delta }) {
  if (delta == null) return <Minus className="dash-inline-icon" />;
  return delta < 0 ? <TrendingDown className="dash-inline-icon" /> : <TrendingUp className="dash-inline-icon" />;
}

function Kpi({ icon, label, value, sub }) {
  return (
    <div className="dash-panel dash-progress-kpi">
      <div className="dash-progress-kpi__icon">{icon}</div>
      <div className="dash-progress-kpi__body">
        <div className="dash-muted">{label}</div>
        <div className="dash-progress-kpi__value">{value}</div>
        {sub ? <div className="dash-muted dash-progress-kpi__sub">{sub}</div> : null}
      </div>
    </div>
  );
}

function RecordForm({ weight, onSaved }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (value === "") return;
    setBusy(true);
    setError("");
    try {
      await progressApi.recordMeasurement({ measurementType: "weight", value: Number(value) });
      setValue("");
      onSaved();
    } catch (err) {
      setError(err.message || t("patientProgress.recordError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="dash-progress-record" onSubmit={submit}>
      <div className="dash-care-value">
        <input
          type="number"
          min="20"
          max="400"
          step="any"
          placeholder={t("patientProgress.weightPlaceholder", { unit: "kg" })}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="dash-btn dash-btn--primary" disabled={busy || value === ""}>
          <Plus />{busy ? t("patientProgress.saving") : t("patientProgress.save")}
        </button>
      </div>
      {error ? <p className="dash-error">{error}</p> : null}
      {weight?.nextDueDate ? <p className="dash-muted">{t("patientProgress.nextDue", { date: weight.nextDueDate })}</p> : null}
    </form>
  );
}

function GoalCard({ goal, goalProgress }) {
  const { t } = useTranslation();
  if (!goal || goal.targetValue == null) return null;
  const pct = goalProgress?.percent;
  const clamped = pct == null ? null : Math.max(0, Math.min(100, pct));
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title"><Target />{t("patientProgress.activeGoal")}</h3>
        {goal.targetDate ? <span className="dash-muted">{t("patientProgress.byDate", { date: goal.targetDate })}</span> : null}
      </div>
      <div className="dash-progress-goal">
        <div className="dash-progress-goal__target">
          {fmt(goal.targetValue)} {t("patientProgress.unitWeight")}
        </div>
        <div className="dash-progress-goal__bar">
          <div className="dash-progress-goal__fill" style={{ width: `${clamped ?? 0}%` }} />
        </div>
        <div className="dash-progress-goal__meta">
          <span>{pct == null ? t("patientProgress.noProgressYet") : t("patientProgress.progressPct", { pct })}</span>
          {goalProgress?.projectedReachDate ? (
            <span className="dash-muted">{t("patientProgress.projected", { date: goalProgress.projectedReachDate })}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function History({ items }) {
  const { t } = useTranslation();
  if (!items || !items.length) {
    return <p className="dash-muted">{t("patientProgress.noData")}</p>;
  }
  return (
    <ul className="dash-progress-history">
      {items.slice(0, 10).map((m) => (
        <li key={m.id} className="dash-progress-history__row">
          <span className="dash-muted">{m.measuredOn}</span>
          <span>{fmt(m.value)}{m.unit}</span>
          <span className="dash-muted">
            {m.source === "checkin" ? t("patientProgress.sourceCheckin") : t(`patientProgress.source.${m.source}`)},{" "}
            {m.kind === "correction" ? t("patientProgress.corrected") : t("patientProgress.recorded")}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PatientProgress() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loadKey, setLoadKey] = useState(0);
  const weight = data?.byType?.weight;

  useEffect(() => {
    let alive = true;
    progressApi.dashboard().then((d) => { if (alive) setData(d); }).catch((err) => { if (alive) setError(err.message); });
    return () => { alive = false; };
  }, [loadKey]);

  const reload = () => { setLoadKey((k) => k + 1); };
  const delta = useMemo(() => weight?.delta ?? null, [weight]);

  if (error) return <div className="dash-empty">{error}</div>;
  if (!data) return <div className="dash-empty">{t("patientProgress.loading")}</div>;

  const dueMeta = data.due;
  return (
    <div className="dash-stack">
      <div className="dash-page-head">
        <h2 className="dash-page-title"><Scale />{t("patientProgress.title")}</h2>
        <span className={`dash-badge ${dueMeta?.isDue ? "dash-badge--care-due" : "dash-badge--care-ok"}`}>
          <CalendarClock />
          {dueMeta?.isDue ? t("patientProgress.dueNow") : (dueMeta?.nextDueDate ? t("patientProgress.notDue", { date: dueMeta.nextDueDate }) : t("patientProgress.noSchedule"))}
        </span>
      </div>

      <div className="dash-grid dash-progress-kpis">
        <Kpi icon={<TrendIcon delta={delta} />} label={t("patientProgress.currentWeight")} value={`${fmt(weight?.current?.value)} ${t("patientProgress.unitWeight")}`} sub={weight?.current?.measuredOn ? t("patientProgress.onDate", { date: weight.current.measuredOn }) : null} />
        <Kpi icon={<TrendIcon delta={delta} />} label={t("patientProgress.startWeight")} value={`${fmt(weight?.starting?.value)} ${t("patientProgress.unitWeight")}`} sub={weight?.starting?.measuredOn ? t("patientProgress.onDate", { date: weight.starting.measuredOn }) : null} />
        <Kpi icon={<TrendIcon delta={delta} />} label={t("patientProgress.change")} value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${fmt(delta)} ${t("patientProgress.unitWeight")}`} sub={weight?.ratePerDay != null ? t("patientProgress.rate", { rate: Math.abs(weight.ratePerDay).toFixed(2) }) : null} />
        <Kpi icon={<RefreshCcw />} label={t("patientProgress.measurements")} value={weight?.count ?? 0} />
      </div>

      <RecordForm weight={data} onSaved={reload} />
      <GoalCard goal={data.goal} goalProgress={data.goalProgress} />

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">{t("patientProgress.historyTitle")}</h3>
        </div>
        <History items={data.recent} />
      </section>
    </div>
  );
}