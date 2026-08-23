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
import BookSlotPage from "./BookSlotPage";
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
        <span className={`dash-badge ${plan ? "dash-badge--primary" : ""}`}>{plan ? status : t("dashboard.patient.noPlan", "لا توجد خطة")}</span>
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

const UNIT_LABEL = { month: "شهر", week: "أسبوع", one_time: "مرة واحدة" };

function SubscriptionCard({ sub }) {
  const { t } = useTranslation();
  if (!sub) return null;
  const unit = sub.duration?.unit || sub.package?.durationUnit || "one_time";
  const value = sub.duration?.value ?? sub.package?.durationValue ?? 1;
  const expired = sub.status === "expired" || sub.periodActive === false || sub.status === "cancelled" || sub.status === "rejected";
  const live = Boolean(sub.hasLiveSession && sub.periodActive !== false);
  const remaining = sub.remainingDays;
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <Wallet />
          {t("dashboard.patient.subscriptionTitle", "اشتراكي")}
        </h3>
        <span className={`dash-badge ${expired ? "dash-badge--danger" : "dash-badge--success"}`}>
          {expired ? t("dashboard.patient.subscriptionExpired", "منتهي") : t("dashboard.patient.subscriptionActive", "نشط")}
        </span>
      </div>
      <div className="dash-panel__body">
        <div className="dash-appt-meta">
          <span className="dash-appt-meta__icon">
            <Wallet />
          </span>
          <div>
            <div className="dash-appt-meta__value">{sub.package?.name || t("dashboard.patient.noPackage", "بدون باقة")}</div>
            <div className="dash-appt-meta__label">
              {value} {UNIT_LABEL[unit] || unit}
            </div>
          </div>
        </div>
        <div className="dash-appt-meta">
          <span className="dash-appt-meta__icon">
            <Clock />
          </span>
          <div>
            <div className="dash-appt-meta__value">
              {remaining != null ? `${remaining} ${t("dashboard.patient.remainingDays", "يوم متبقي")}` : "—"}
            </div>
            <div className="dash-appt-meta__label">
              {sub.endsAt ? `${t("dashboard.patient.endsAt", "ينتهي")}: ${new Date(sub.endsAt).toLocaleDateString()}` : t("dashboard.patient.noExpiry", "بدون تاريخ انتهاء")}
            </div>
          </div>
        </div>
        <p className="dash-muted" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          <Video size={15} />
          {live ? t("dashboard.patient.liveIncluded", "البث المباشر مشمول في باقتك") : t("dashboard.patient.liveNotIncluded", "البث المباشر غير مشمول في باقتك الحالية")}
        </p>
      </div>
    </section>
  );
}

function NextAppointment({ appointment, busy, onJoin, canJoinLive }) {
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
          <button className="dash-btn dash-btn--primary" disabled={busy || !canJoinLive} onClick={onJoin} title={canJoinLive ? "" : t("dashboard.patient.liveNotIncluded", "البث المباشر غير مشمول في باقتك الحالية")}>
            <Video />
            {canJoinLive ? t("dashboard.patient.joinSession") : t("dashboard.patient.liveNotIncluded", "البث غير مشمول")}
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
      <div style={{ ...bannerBase, background: "linear-gradient(135deg, #e6fbc2, #e6fbc2)", borderColor: "#c2f753" }}>
        <span style={{ fontSize: "36px" }}>🎯</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: "800", fontSize: "18px", color: "#2e7d00", marginBottom: "6px" }}>{t("dashboard.patient.onboardingChooseTitle")}</h3>
          <p style={{ color: "#3ca503", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>{t("dashboard.patient.onboardingChooseBody")}</p>
          <button className="dash-btn dash-btn--primary" onClick={() => onNavigate("/packages")}>
            <Wallet /> اختر باقتك الآن →
          </button>
        </div>
      </div>
    );

  if (state === "awaiting_payment_review")
    return (
      <div style={{ ...bannerBase, background: "#e6f2ff", borderColor: "#48d6f9" }}>
        <span style={{ fontSize: "36px" }}>⏳</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: "800", fontSize: "18px", color: "#022466", marginBottom: "6px" }}>{t("dashboard.patient.onboardingPendingTitle")}</h3>
          <p style={{ color: "#024fab", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>{t("dashboard.patient.onboardingPendingBody", "تم استلام طلب دفعك وهو قيد المراجعة. سيتم تفعيل برنامجك فور موافقة الدكتور.")}</p>
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
    // One failing endpoint (e.g. a 403) must not blank the whole dashboard.
    const safe = (p) => p.catch(() => null);
    const [nutrition, exercise, checkins, appointments, entitlements, homeData] = await Promise.all([
      safe(nutritionApi.patient(user.patientId)),
      safe(exerciseApi.patient(user.patientId)),
      safe(checkinApi.list(user.patientId)),
      safe(appointmentApi.patientList(user.patientId)),
      safe(paymentApi.entitlements()),
      safe(patientApi.home()),
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
    { path: "/patient/book", label: "احجز جلسة", icon: Video },
    { path: "/patient/checkin", label: t("dashboard.patient.checkinTitle"), icon: ClipboardCheck },
    { path: "/patient/payments", label: t("dashboard.nav.payments"), icon: Wallet },
    { path: "/patient/notifications", label: t("dashboard.nav.notifications"), icon: Bell },
  ];

  let page;
  if (path === "/patient/care") page = <DailyCare />;
  else if (path === "/patient/progress") page = <PatientProgress />;
  else if (path === "/patient/payments") page = <PaymentCenter />;
  else if (path === "/patient/notifications") page = <NotificationsPanel />;
  else if (path === "/patient/book") page = <BookSlotPage />;
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

        <SubscriptionCard sub={home?.subscription || null} />

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
          <NextAppointment appointment={next} busy={busy} onJoin={join} canJoinLive={Boolean(home?.subscription?.hasLiveSession && home?.subscription?.periodActive !== false)} />
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
