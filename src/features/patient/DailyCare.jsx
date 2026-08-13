import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ClipboardList,
  Flame,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  CalendarCheck,
  Send,
  AlertCircle,
} from "lucide-react";
import { careApi } from "../../api/client";

const statusMeta = {
  planned: "care.status.planned",
  completed: "care.status.completed",
  partial: "care.status.partial",
  skipped: "care.status.skipped",
  not_recorded: "care.status.notRecorded",
};

function StatusBadge({ status }) {
  const { t } = useTranslation();
  return <span className={`dash-badge dash-badge--care-${status}`}>{t(statusMeta[status] || statusMeta.planned)}</span>;
}

function ActivityRecord({ item, onRecord }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const target = item.plannedTarget || {};

  const record = async (payload) => {
    setBusy(true);
    try {
      await onRecord(item.id, payload);
    } finally {
      setBusy(false);
    }
  };

  const submitValued = async (e) => {
    e.preventDefault();
    if (value === "") return;
    const payload =
      item.measure === "sessions" ? { sessions: Number(value), idempotencyKey: crypto.randomUUID() }
      : item.measure === "quantity" ? { value: Number(value), unit: target.unit, idempotencyKey: crypto.randomUUID() }
      : item.measure === "duration" ? { durationMin: Number(value), idempotencyKey: crypto.randomUUID() }
      : {};
    await record(payload);
    setValue("");
  };

  const typeIcon = { nutrition: "🥗", exercise: "💪", medication: "💊" }[item.activityType] || "•";

  return (
    <li className="dash-care-activity">
      <div className="dash-care-activity__name">
        <span className="dash-care-activity__emoji">{typeIcon}</span>
        <div>
          <div className="dash-care-activity__title">{item.nameAr || item.nameEn}</div>
          <div className="dash-care-activity__plan">
            {item.measure === "boolean" && t("dailyCare.plan.boolean")}
            {item.measure === "sessions" && t("dailyCare.plan.sessions", { n: target.value })}
            {item.measure === "quantity" && t("dailyCare.plan.quantity", { n: target.value, unit: target.unit })}
            {item.measure === "duration" && t("dailyCare.plan.duration", { n: target.value })}
          </div>
        </div>
      </div>

      {item.status === "completed" || item.status === "partial" || item.status === "skipped" ? (
        <div className="dash-care-activity__done">
          <StatusBadge status={item.status} />
          {item.measure !== "boolean" && item.effectiveExecution?.actualValue?.value != null && (
            <span className="dash-muted">
              {t("dailyCare.recordedValue", { n: item.effectiveExecution.actualValue.value })}
            </span>
          )}
        </div>
      ) : (
        <div className="dash-care-activity__controls">
          {item.measure === "boolean" ? (
            <div className="dash-care-actions">
              <button className="dash-btn dash-btn--success" disabled={busy} onClick={() => record({ done: true, idempotencyKey: crypto.randomUUID() })}>
                <CheckCircle2 />{t("dailyCare.done")}
              </button>
              <button className="dash-btn dash-btn--danger" disabled={busy} onClick={() => record({ done: false, idempotencyKey: crypto.randomUUID() })}>
                <XCircle />{t("dailyCare.skip")}
              </button>
            </div>
          ) : (
            <form className="dash-care-value" onSubmit={submitValued}>
              <input
                type="number"
                min="0"
                step="any"
                placeholder={target.unit || t("dailyCare.value")}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <button className="dash-btn dash-btn--primary" disabled={busy || value === ""}>
                <Send />{busy ? t("dailyCare.saving") : t("dailyCare.save")}
              </button>
              <button type="button" className="dash-btn dash-btn--ghost" disabled={busy} onClick={() => record({ idempotencyKey: crypto.randomUUID() })}>
                {t("dailyCare.skip")}
              </button>
            </form>
          )}
        </div>
      )}
    </li>
  );
}

function TodayCare({ data, onRecord }) {
  const { t } = useTranslation();
  const { program, todayInstances, day } = data;
  const done = todayInstances.filter((i) => ["completed", "partial", "skipped"].includes(i.status)).length;

  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <ClipboardList />
          {t("dailyCare.todayTitle")}
        </h3>
        {day ? <span className="dash-muted">{day.dayIndex} · {t("dailyCare.dayOfProgram")}</span> : null}
      </div>
      {program.instructions && <p className="dash-care-instructions">{program.instructions}</p>}
      {!day || todayInstances.length === 0 ? (
        <p className="dash-muted">{t("dailyCare.noActivitiesToday")}</p>
      ) : (
        <ul className="dash-care-list">
          {todayInstances.map((item) => (
            <ActivityRecord key={item.id} item={item} onRecord={onRecord} />
          ))}
        </ul>
      )}
      {day && done > 0 && (
        <div className="dash-care-progress">
          <div className="dash-care-progress__bar">
            <span style={{ width: `${(done / Math.max(todayInstances.length, 1)) * 100}%` }} />
          </div>
          <span className="dash-muted">{t("dailyCare.recordedX", { done, total: todayInstances.length })}</span>
        </div>
      )}
    </section>
  );
}

function WeekSummary({ data }) {
  const { t } = useTranslation();
  const { week, adherence } = data;
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <CalendarCheck />
          {t("dailyCare.weekTitle")}
        </h3>
        {week.streak > 0 && (
          <span className="dash-badge dash-badge--success">
            <Flame />
            {t("dailyCare.streak", { n: week.streak })}
          </span>
        )}
      </div>
      <div className="dash-stat-grid dash-stat-grid--2">
        <section className="dash-stat dash-stat--primary">
          <div>
            <div className="dash-stat__value">
              {adherence.available ? `${adherence.completionRate}%` : t("dailyCare.notEnoughData")}
            </div>
            <div className="dash-stat__label">{t("dailyCare.adherence")}</div>
          </div>
        </section>
        <section className="dash-stat dash-stat--info">
          <div>
            <div className="dash-stat__value">{week.summary.completed}</div>
            <div className="dash-stat__label">{t("dailyCare.completed")}</div>
          </div>
        </section>
      </div>
      <div className="dash-care-stats">
        {["completed", "partial", "skipped", "not_recorded"].map((s) => (
          <div key={s} className="dash-care-stats__row">
            <StatusBadge status={s} />
            <span>{t("dailyCare.weekCount", { n: week.summary[s] })}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DailyCheckin({ onCheckin }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      await onCheckin({
        energy: f.get("energy") ? Number(f.get("energy")) : null,
        hunger: f.get("hunger") ? Number(f.get("hunger")) : null,
        adherenceSelfReport: f.get("adherenceSelfReport") ? Number(f.get("adherenceSelfReport")) : null,
        weightKg: f.get("weightKg") ? Number(f.get("weightKg")) : null,
        notes: f.get("notes"),
      });
      e.currentTarget.reset();
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <SlidersHorizontal />
          {t("dailyCare.checkinTitle")}
        </h3>
      </div>
      <form className="dash-form" onSubmit={submit}>
        <div className="dash-form--grid">
          <label className="dash-field">
            <span>{t("dailyCare.energy")}</span>
            <input type="number" name="energy" min="0" max="10" step="1" />
          </label>
          <label className="dash-field">
            <span>{t("dailyCare.hunger")}</span>
            <input type="number" name="hunger" min="0" max="10" step="1" />
          </label>
          <label className="dash-field">
            <span>{t("dailyCare.selfAdherence")}</span>
            <input type="number" name="adherenceSelfReport" min="0" max="100" step="1" />
          </label>
          <label className="dash-field">
            <span>{t("dailyCare.weightKg")}</span>
            <input type="number" name="weightKg" min="20" max="400" step="0.1" />
          </label>
        </div>
        <label className="dash-field">
          <span>{t("dailyCare.note")}</span>
          <textarea name="notes" rows="3" />
        </label>
        <button className="dash-btn dash-btn--primary" disabled={busy}>
          <Send />
          {busy ? t("dailyCare.saving") : t("dailyCare.saveCheckin")}
        </button>
      </form>
    </section>
  );
}

export default function DailyCare() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [, setBusy] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setData(await careApi.dashboard());
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const record = async (instanceId, payload) => {
    setBusy(true);
    try {
      await careApi.record(instanceId, payload);
      await load();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const checkin = async (payload) => {
    if (!data?.day) return;
    try {
      await careApi.checkin(data.day.id, payload);
      await load();
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  if (error)
    return (
      <section className="dash-panel">
        <div className="dash-page-head">
          <span className="dash-eyebrow">
            <AlertCircle />
            {t("dailyCare.title")}
          </span>
          <h2>{t("dailyCare.error")}</h2>
          <p className="dash-muted">{error}</p>
        </div>
      </section>
    );

  if (!data)
    return (
      <div className="dash-page-head">
        <h2>{t("dailyCare.title")}</h2>
        <p className="dash-muted">{t("dashboard.common.loading")}</p>
      </div>
    );

  if (!data.available)
    return (
      <>
        <div className="dash-page-head">
          <span className="dash-eyebrow">
            <ClipboardList />
            {t("dailyCare.title")}
          </span>
          <h2>{t("dailyCare.title")}</h2>
        </div>
        <section className="dash-panel">
          <div className="dash-panel__body">
            <p className="dash-muted">{t("dailyCare.noProgram")}</p>
          </div>
        </section>
      </>
    );

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <ClipboardList />
          {t("dailyCare.title")}
        </span>
        <h2>{t("dailyCare.title")}</h2>
        <p className="dash-muted">{t("dailyCare.subtitle")}</p>
      </div>
      <div className="dash-care-grid">
        <div className="dash-care-grid__main">
          <TodayCare data={data} onRecord={record} />
          <DailyCheckin onCheckin={checkin} />
        </div>
        <div className="dash-care-grid__side">
          <WeekSummary data={data} />
        </div>
      </div>
    </>
  );
}