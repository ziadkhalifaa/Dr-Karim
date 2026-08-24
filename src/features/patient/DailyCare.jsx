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
  Zap,
  UtensilsCrossed,
  Gauge,
  Scale,
} from "lucide-react";
import { careApi } from "../../api/client";

const statusMeta = {
  planned: "dailyCare.status.planned",
  completed: "dailyCare.status.completed",
  partial: "dailyCare.status.partial",
  skipped: "dailyCare.status.skipped",
  not_recorded: "dailyCare.status.notRecorded",
};

const ACTIVITY_STYLE = {
  nutrition: { icon: "🥗", cls: "" },
  exercise: { icon: "💪", cls: "pp-activity__icon--exercise" },
  medication: { icon: "💊", cls: "pp-activity__icon--medication" },
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

  const style = ACTIVITY_STYLE[item.activityType] || { icon: "•", cls: "" };
  const settled = ["completed", "partial", "skipped"].includes(item.status);

  return (
    <li className={`pp-activity__row ${item.status === "completed" ? "pp-activity__row--completed" : ""} ${item.status === "skipped" ? "pp-activity__row--skipped" : ""}`}>
      <span className={`pp-activity__icon ${style.cls}`}>{style.icon}</span>
      <div>
        <div className="pp-activity__name">{item.nameAr || item.nameEn}</div>
        <div className="pp-activity__plan">
          {item.measure === "boolean" && t("dailyCare.plan.boolean")}
          {item.measure === "sessions" && t("dailyCare.plan.sessions", { n: target.value })}
          {item.measure === "quantity" && t("dailyCare.plan.quantity", { n: target.value, unit: target.unit })}
          {item.measure === "duration" && t("dailyCare.plan.duration", { n: target.value })}
        </div>
      </div>

      <div className="pp-activity__side">
        {settled ? (
          <>
            <StatusBadge status={item.status} />
            {item.measure !== "boolean" && item.effectiveExecution?.actualValue?.value != null && (
              <span className="dash-muted" style={{ fontSize: 12.5, fontWeight: 700 }}>
                {t("dailyCare.recordedValue", { n: item.effectiveExecution.actualValue.value })}
              </span>
            )}
          </>
        ) : item.measure === "boolean" ? (
          <div className="pp-actions">
            <button className="dash-btn dash-btn--success" disabled={busy} onClick={() => record({ done: true, idempotencyKey: crypto.randomUUID() })}>
              <CheckCircle2 size={16} />{t("dailyCare.done")}
            </button>
            <button className="dash-btn dash-btn--danger" disabled={busy} onClick={() => record({ done: false, idempotencyKey: crypto.randomUUID() })}>
              <XCircle size={16} />{t("dailyCare.skip")}
            </button>
          </div>
        ) : (
          <form className="pp-actions" onSubmit={submitValued}>
            <input
              className="pp-input"
              style={{ width: 110, padding: "9px 12px" }}
              type="number"
              min="0"
              step="any"
              placeholder={target.unit || t("dailyCare.value")}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button className="dash-btn dash-btn--primary" disabled={busy || value === ""}>
              <Send size={15} />{busy ? t("dailyCare.saving") : t("dailyCare.save")}
            </button>
            <button type="button" className="dash-btn dash-btn--ghost" disabled={busy} onClick={() => record({ idempotencyKey: crypto.randomUUID() })}>
              {t("dailyCare.skip")}
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

function TodayCare({ data, onRecord }) {
  const { t } = useTranslation();
  const { program, todayInstances, day } = data;
  const done = todayInstances.filter((i) => ["completed", "partial", "skipped"].includes(i.status)).length;
  const pct = Math.round((done / Math.max(todayInstances.length, 1)) * 100);

  return (
    <section className="pp-card">
      <div className="pp-card__head">
        <h3 className="pp-card__title">
          <ClipboardList />
          {t("dailyCare.todayTitle")}
        </h3>
        {day ? <span className="pp-pill" style={{ background: "var(--dash-primary-soft)", color: "#3e7a00", border: "none" }}>{day.dayIndex} · {t("dailyCare.dayOfProgram")}</span> : null}
      </div>
      <div className="pp-card__body">
        {program.instructions && <p className="dash-care-instructions">{program.instructions}</p>}
        {!day || todayInstances.length === 0 ? (
          <div className="pp-empty">
            <div className="pp-empty__icon">
              <ClipboardList />
            </div>
            <p>{t("dailyCare.noActivitiesToday")}</p>
          </div>
        ) : (
          <>
            <ul className="pp-activity">
              {todayInstances.map((item) => (
                <ActivityRecord key={item.id} item={item} onRecord={onRecord} />
              ))}
            </ul>
            {done > 0 && (
              <div className="pp-progress-wrap">
                <div className="pp-progress-track">
                  <span className="pp-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="pp-progress-label">{t("dailyCare.recordedX", { done, total: todayInstances.length })}</div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function WeekDonut({ pct }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  return (
    <div className="pp-donut">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="ppGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6fd005" />
            <stop offset="100%" stopColor="#a3e635" />
          </linearGradient>
        </defs>
        <circle className="pp-donut__track" cx="48" cy="48" r={R} fill="none" strokeWidth="9" />
        <circle
          className="pp-donut__fill"
          cx="48"
          cy="48"
          r={R}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
        />
      </svg>
      <div className="pp-donut__center">
        <div>
          <div className="pp-donut__value">{pct}%</div>
          <div className="pp-donut__label">الالتزام</div>
        </div>
      </div>
    </div>
  );
}

function WeekSummary({ data }) {
  const { t } = useTranslation();
  const { week, adherence } = data;
  const pct = adherence.available ? adherence.completionRate : 0;
  const tiles = [
    ["completed", "pp-tile--completed"],
    ["partial", "pp-tile--partial"],
    ["skipped", "pp-tile--skipped"],
    ["not_recorded", ""],
  ];

  return (
    <section className="pp-card">
      <div className="pp-card__head">
        <h3 className="pp-card__title">
          <CalendarCheck />
          {t("dailyCare.weekTitle")}
        </h3>
      </div>
      <div className="pp-card__body">
        <div className="pp-week-top">
          <WeekDonut pct={pct} />
          <div style={{ display: "grid", gap: 8 }}>
            {!adherence.available && (
              <span className="dash-muted" style={{ fontSize: 12.5, fontWeight: 700 }}>
                {t("dailyCare.notEnoughData")}
              </span>
            )}
            {week.streak > 0 && (
              <span className="pp-streak">
                <Flame />
                {t("dailyCare.streak", { n: week.streak })}
              </span>
            )}
          </div>
        </div>
        <div className="pp-tiles">
          {tiles.map(([s, cls]) => (
            <div key={s} className={`pp-tile ${cls}`}>
              <div className="pp-tile__value">{week.summary[s]}</div>
              <div className="pp-tile__label">{t(statusMeta[s])}</div>
            </div>
          ))}
        </div>
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
    <section className="pp-card">
      <div className="pp-card__head">
        <h3 className="pp-card__title">
          <SlidersHorizontal />
          {t("dailyCare.checkinTitle")}
        </h3>
      </div>
      <form style={{ display: "grid", gap: 14 }} onSubmit={submit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <label className="pp-field">
            <span className="pp-field__label">
              <Zap />
              {t("dailyCare.energy")}
            </span>
            <input className="pp-input" type="number" name="energy" min="0" max="10" step="1" placeholder="مثال: 7" />
          </label>
          <label className="pp-field">
            <span className="pp-field__label">
              <UtensilsCrossed />
              {t("dailyCare.hunger")}
            </span>
            <input className="pp-input" type="number" name="hunger" min="0" max="10" step="1" placeholder="مثال: 4" />
          </label>
          <label className="pp-field">
            <span className="pp-field__label">
              <Gauge />
              {t("dailyCare.selfAdherence")}
            </span>
            <input className="pp-input" type="number" name="adherenceSelfReport" min="0" max="100" step="1" placeholder="مثال: 80" />
          </label>
          <label className="pp-field">
            <span className="pp-field__label">
              <Scale />
              {t("dailyCare.weightKg")}
            </span>
            <input className="pp-input" type="number" name="weightKg" min="20" max="400" step="0.1" placeholder="مثال: 78.5" />
          </label>
        </div>
        <label className="pp-field">
          <span className="pp-field__label">{t("dailyCare.note")}</span>
          <textarea className="pp-input" name="notes" rows="3" placeholder="اكتب أي ملاحظات عن يومك..." />
        </label>
        <button className="pp-submit" disabled={busy}>
          <Send size={17} />
          {busy ? t("dailyCare.saving") : t("dailyCare.saveCheckin")}
        </button>
      </form>
    </section>
  );
}

function CareHero() {
  const { t } = useTranslation();
  const today = new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="pp-hero">
      <span className="pp-hero__icon">
        <ClipboardList />
      </span>
      <div className="pp-hero__body">
        <div className="pp-hero__eyebrow">برنامج الرعاية</div>
        <h2 className="pp-hero__title">{t("dailyCare.title")}</h2>
        <p className="pp-hero__sub">{t("dailyCare.subtitle")}</p>
      </div>
      <div className="pp-hero__meta">
        <span className="pp-pill">
          <CalendarCheck size={14} />
          {today}
        </span>
      </div>
    </div>
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
      <>
        <CareHero />
        <section className="pp-card">
          <div className="pp-card__body">
            <div className="pp-empty">
              <div className="pp-empty__icon">
                <AlertCircle />
              </div>
              <p>{t("dailyCare.error")}</p>
              <p className="dash-muted" style={{ marginTop: 8, fontSize: 13 }}>{error}</p>
            </div>
          </div>
        </section>
      </>
    );

  if (!data)
    return (
      <>
        <CareHero />
        <section className="pp-card">
          <div className="pp-card__body">
            <div className="pp-empty">
              <div className="pp-empty__icon">
                <ClipboardList />
              </div>
              <p>{t("dashboard.common.loading")}</p>
            </div>
          </div>
        </section>
      </>
    );

  if (!data.available)
    return (
      <>
        <CareHero />
        <section className="pp-card">
          <div className="pp-card__body">
            <div className="pp-empty">
              <div className="pp-empty__icon">
                <ClipboardList />
              </div>
              <p>{t("dailyCare.noProgram")}</p>
            </div>
          </div>
        </section>
      </>
    );

  return (
    <>
      <CareHero />
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
