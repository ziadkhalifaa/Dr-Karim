import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Salad,
  Dumbbell,
  CalendarDays,
  Bell,
  ClipboardCheck,
  ClipboardList,
  Scale,
  Wallet,
  Clock,
  Video,
  Send,
} from "lucide-react";
import DashboardShell from "../shared/DashboardShell";
import NotificationsPanel from "../shared/NotificationsPanel";
import PaymentCenter from "./PaymentCenter";
import DailyCare from "./DailyCare";
import PatientProgress from "./Progress";
import { useAuth } from "../../context/AuthProvider";
import { navigate } from "../../lib/router";
import {
  appointmentApi,
  checkinApi,
  liveSessionApi,
  nutritionApi,
  exerciseApi,
  paymentApi,
  patientApi,
} from "../../api/client";

function PlanCard({ title, plan, icon: Icon, status }) {
  const { t } = useTranslation();
  const goals = plan?.goals || [];
  const foods = plan?.meal_plan || plan?.plan || [];
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <Icon />
          {title}
        </h3>
        <span className="dash-badge dash-badge--primary">{status}</span>
      </div>
      <div className="dash-panel__body">
        <p className="dash-muted">{t("dashboard.patient.planVersion")}</p>
        {goals.length > 0 && (
          <ul className="dash-list">
            {goals.map((g, i) => (
              <li key={i}>{typeof g === "string" ? g : g?.description || g?.target}</li>
            ))}
          </ul>
        )}
        {foods.length > 0 && (
          <div className="dash-food-grid">
            {foods.map((f, i) => (
              <span key={i} className="dash-food-chip">
                {typeof f === "string" ? f : f?.name || f?.meal || `Item ${i + 1}`}
              </span>
            ))}
          </div>
        )}
        {!goals.length && !foods.length && <p className="dash-muted">{t("dashboard.patient.noActivePlan")}</p>}
      </div>
    </section>
  );
}

function NextAppointment({ appointment, busy, onJoin }) {
  const { t } = useTranslation();
  if (!appointment)
    return (
      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <CalendarDays />
            {t("dashboard.patient.nextAppointment")}
          </h3>
        </div>
        <div className="dash-panel__body">
          <p className="dash-muted">{t("dashboard.patient.noAppointment")}</p>
        </div>
      </section>
    );
  return (
    <section className="dash-panel dash-panel--accent">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <CalendarDays />
          {t("dashboard.patient.nextAppointment")}
        </h3>
        <span className="dash-badge dash-badge--info">{appointment.status}</span>
      </div>
      <div className="dash-panel__body">
        <div className="dash-appt-meta">
          <span className="dash-appt-meta__icon">
            <Clock />
          </span>
          <div>
            <div className="dash-appt-meta__value">
              {appointment.scheduled_start_at
                ? new Date(appointment.scheduled_start_at).toLocaleString()
                : "—"}
            </div>
            <div className="dash-appt-meta__label">{appointment.type || t("dashboard.patient.consultation")}</div>
          </div>
        </div>
        {appointment.liveSessionId || appointment.live_session_id ? (
          <button className="dash-btn dash-btn--primary" disabled={busy} onClick={onJoin}>
            <Video />
            {t("dashboard.patient.joinSession")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function Checkin({ userId, onDone }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      await checkinApi.create(userId, {
        weight: Number(f.get("weight")),
        note: f.get("note"),
        nutritionAdherence: Number(f.get("nutritionAdherence")),
        exerciseAdherence: Number(f.get("exerciseAdherence")),
      });
      e.currentTarget.reset();
      onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <ClipboardCheck />
          {t("dashboard.patient.checkinTitle")}
        </h3>
      </div>
      <form className="dash-form" onSubmit={submit}>
        <label className="dash-field">
          <span>{t("dashboard.patient.weight")}</span>
          <input type="number" name="weight" min="20" max="400" step="0.1" required />
        </label>
        <div className="dash-form--grid">
          <label className="dash-field">
            <span>{t("dashboard.patient.nutritionAdherence")}</span>
            <input type="number" name="nutritionAdherence" min="0" max="10" required />
          </label>
          <label className="dash-field">
            <span>{t("dashboard.patient.exerciseAdherence")}</span>
            <input type="number" name="exerciseAdherence" min="0" max="10" required />
          </label>
        </div>
        <label className="dash-field">
          <span>{t("dashboard.patient.note")}</span>
          <textarea name="note" rows="3" />
        </label>
        <button className="dash-btn dash-btn--primary" disabled={busy}>
          <Send />
          {busy ? t("dashboard.patient.submitting") : t("dashboard.patient.submitCheckin")}
        </button>
      </form>
    </section>
  );
}

// Phase 6D onboarding gate: the patient home is state-driven by the server
// aggregate (patientApi.home). Each onboarding state renders a guided card on
// top of the regular workspace so the patient always knows the next step.
function OnboardingGate({ state, onNavigate }) {
  const { t } = useTranslation();

  const bannerBase = {
    borderRadius: "20px",
    padding: "28px 32px",
    marginBottom: "28px",
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
    border: "1.5px solid",
  };

  if (state === "assessment_not_linked")
    return (
      <div style={{ ...bannerBase, background: "#dbeafe", borderColor: "#93c5fd" }}>
        <span style={{ fontSize: "36px" }}>📋</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: "800", fontSize: "18px", color: "#1e40af", marginBottom: "6px" }}>{t("dashboard.patient.onboardingAssessmentTitle")}</h3>
          <p style={{ color: "#1d4ed8", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>{t("dashboard.patient.onboardingAssessmentBody")}</p>
          <button className="dash-btn dash-btn--primary" style={{ background: "#2563eb", border: "none" }} onClick={() => onNavigate("/assessment")}>
            {t("dashboard.patient.onboardingAssessmentCta")}
          </button>
        </div>
      </div>
    );

  if (state === "choose_package")
    return (
      <div style={{ ...bannerBase, background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", borderColor: "#6ee7b7" }}>
        <span style={{ fontSize: "36px" }}>🎯</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: "800", fontSize: "18px", color: "#065f46", marginBottom: "6px" }}>{t("dashboard.patient.onboardingChooseTitle")}</h3>
          <p style={{ color: "#047857", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>{t("dashboard.patient.onboardingChooseBody")}</p>
          <button className="dash-btn dash-btn--primary" onClick={() => onNavigate("/packages")}>
            <Wallet /> اختر باقتك الآن →
          </button>
        </div>
      </div>
    );

  if (state === "awaiting_payment_review")
    return (
      <div style={{ ...bannerBase, background: "#fef3c7", borderColor: "#fcd34d" }}>
        <span style={{ fontSize: "36px" }}>⏳</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: "800", fontSize: "18px", color: "#92400e", marginBottom: "6px" }}>{t("dashboard.patient.onboardingPendingTitle")}</h3>
          <p style={{ color: "#b45309", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>{t("dashboard.patient.onboardingPendingBody", "تم استلام طلب دفعك وهو قيد المراجعة. سيتم تفعيل برنامجك فور موافقة الدكتور.")}</p>
          <button className="dash-btn dash-btn--ghost" onClick={() => onNavigate("/patient/payments")}>
            {t("dashboard.patient.viewPayments")}
          </button>
        </div>
      </div>
    );

  if (state === "unsubscribed")
    return (
      <div style={{ ...bannerBase, background: "#fee2e2", borderColor: "#fca5a5" }}>
        <span style={{ fontSize: "36px" }}>🔄</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: "800", fontSize: "18px", color: "#991b1b", marginBottom: "6px" }}>{t("dashboard.patient.onboardingExpiredTitle")}</h3>
          <p style={{ color: "#b91c1c", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>{t("dashboard.patient.onboardingExpiredBody")}</p>
          <button className="dash-btn dash-btn--primary" style={{ background: "#ef4444", border: "none" }} onClick={() => onNavigate("/packages")}>
            {t("dashboard.patient.getStarted")} →
          </button>
        </div>
      </div>
    );

  return null;
}

export default function PatientDashboard({ path }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState({
    nutrition: null,
    exercise: null,
    checkins: [],
    appointments: [],
    entitlements: [],
  });
  const [home, setHome] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user.patientId) return;
    const [nutrition, exercise, checkins, appointments, entitlements, homeData] = await Promise.all([
      nutritionApi.patient(user.patientId),
      exerciseApi.patient(user.patientId),
      checkinApi.list(user.patientId),
      appointmentApi.patientList(user.patientId),
      paymentApi.entitlements(),
      patientApi.home().catch(() => null),
    ]);
    setData({
      nutrition,
      exercise,
      checkins: checkins || [],
      appointments: appointments || [],
      entitlements: entitlements || [],
    });
    setHome(homeData);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.patientId]);

  const activeNutrition = data.nutrition?.versions?.find((v) => v.status === "active");
  const activeExercise = data.exercise?.versions?.find((v) => v.status === "active");
  const next = data.appointments.find((a) => ["pending", "confirmed"].includes(a.status));

  const join = async () => {
    setBusy(true);
    try {
      const session = await liveSessionApi.join(next.liveSessionId || next.live_session_id);
      if (session?.joinUrl)
        window.open(`${session.joinUrl}?t=${encodeURIComponent(session.token)}`, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  };

  const nav = [
    { path: "/patient", label: t("dashboard.nav.overview"), icon: LayoutDashboard },
    { path: "/patient/care", label: t("dailyCare.nav"), icon: ClipboardList },
    { path: "/patient/progress", label: t("patientProgress.nav"), icon: Scale },
    { path: "/patient/plan", label: t("dashboard.nav.myPlan"), icon: Salad },
    { path: "/patient/checkin", label: t("dashboard.patient.checkinTitle"), icon: ClipboardCheck },
    { path: "/patient/payments", label: t("dashboard.nav.payments"), icon: Wallet },
    { path: "/patient/notifications", label: t("dashboard.nav.notifications"), icon: Bell },
  ];

  let page;
  if (path === "/patient/care") page = <DailyCare />;
  else if (path === "/patient/progress") page = <PatientProgress />;
  else if (path === "/patient/payments") page = <PaymentCenter />;
  else if (path === "/patient/notifications") page = <NotificationsPanel />;
  else if (path === "/patient/plan")
    page = (
      <>
        <div className="dash-page-head">
          <span className="dash-eyebrow">
            <Salad />
            {t("dashboard.nav.myPlan")}
          </span>
          <h2>{t("dashboard.patient.myPlans")}</h2>
        </div>
        <div className="dash-plan-grid">
          <PlanCard
            title={t("dashboard.patient.nutritionPlan")}
            plan={activeNutrition}
            icon={Salad}
            status={t("dashboard.status.active")}
          />
          <PlanCard
            title={t("dashboard.patient.exercisePlan")}
            plan={activeExercise}
            icon={Dumbbell}
            status={t("dashboard.status.active")}
          />
        </div>
      </>
    );
  else if (path === "/patient/checkin")
    page = (
      <>
        <div className="dash-page-head">
          <span className="dash-eyebrow">
            <ClipboardCheck />
            {t("dashboard.patient.checkinTitle")}
          </span>
          <h2>{t("dashboard.patient.checkinTitle")}</h2>
        </div>
        <Checkin userId={user.patientId} onDone={load} />
      </>
    );
  else
    page = (
      <>
        <div className="dash-page-head">
          <span className="dash-eyebrow">
            <LayoutDashboard />
            {t("dashboard.patient.overviewTitle")}
          </span>
          <h2>{t("dashboard.patient.overviewTitle")}</h2>
          <p>{t("dashboard.patient.overviewSubtitle")}</p>
        </div>

        <OnboardingGate state={home?.onboarding?.state} onNavigate={navigate} />

        <div className="dash-stat-grid">
          <section className="dash-stat dash-stat--primary">
            <span className="dash-stat__icon">
              <Salad />
            </span>
            <div>
              <div className="dash-stat__value">{activeNutrition ? 1 : 0}</div>
              <div className="dash-stat__label">{t("dashboard.patient.nutritionPlan")}</div>
            </div>
          </section>
          <section className="dash-stat dash-stat--info">
            <span className="dash-stat__icon">
              <Dumbbell />
            </span>
            <div>
              <div className="dash-stat__value">{activeExercise ? 1 : 0}</div>
              <div className="dash-stat__label">{t("dashboard.patient.exercisePlan")}</div>
            </div>
          </section>
          <section className="dash-stat dash-stat--warning">
            <span className="dash-stat__icon">
              <ClipboardCheck />
            </span>
            <div>
              <div className="dash-stat__value">{data.checkins.length}</div>
              <div className="dash-stat__label">{t("dashboard.stats.checkins")}</div>
            </div>
          </section>
        </div>

        <div className="dash-split">
          <NextAppointment appointment={next} busy={busy} onJoin={join} />
          <NotificationsPanel compact />
        </div>
      </>
    );

  return (
    <DashboardShell
      title={t("dashboard.patient.overviewTitle")}
      navLabel={t("dashboard.nav.myPlan")}
      nav={nav}
    >
      {page}
    </DashboardShell>
  );
}
