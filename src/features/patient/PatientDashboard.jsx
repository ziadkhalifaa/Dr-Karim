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
  ShoppingBag,
} from "lucide-react";
import DashboardShell from "../shared/DashboardShell";
import NotificationsPanel from "../shared/NotificationsPanel";
import PaymentCenter from "./PaymentCenter";
import DailyCare from "./DailyCare";
import PatientProgress from "./Progress";
import BookSlotPage from "./BookSlotPage";
import PatientOrders from "./PatientOrders";
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

const MEAL_META = {
  breakfast: { label: "فطار", icon: "🌅" },
  snack_1: { label: "سناك ١", icon: "🍎" },
  lunch: { label: "غدا", icon: "🍲" },
  snack_2: { label: "سناك ٢", icon: "🍌" },
  snack: { label: "سناك", icon: "🍎" },
  dinner: { label: "عشا", icon: "🌙" },
};

const MACRO_TILES = [
  ["calories", "سعرات", "pp-macro--cal"],
  ["protein", "بروتين", "pp-macro--prot"],
  ["carbs", "كارب", "pp-macro--carb"],
  ["fat", "دهون", "pp-macro--fat"],
];

function PlanCard({ title, version, icon: Icon }) {
  const { t } = useTranslation();
  const targets = version?.targets_json || null;
  const meals = Array.isArray(version?.meals) ? version.meals : [];
  const rx = version
    ? [
        ["مجموعات", version.sets],
        ["تكرارات", version.reps],
        ["المدة", version.duration],
        ["الأسبوعي", version.frequency],
        ["راحة", version.rest],
      ].filter(([, v]) => v != null && v !== "")
    : [];

  const dayMap = new Map();
  meals.forEach((meal) => {
    const d = meal.day_number ?? 1;
    if (!dayMap.has(d)) dayMap.set(d, []);
    dayMap.get(d).push(meal);
  });
  const days = [...dayMap.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <section className="pp-card">
      <div className="pp-card__head">
        <h3 className="pp-card__title">
          <Icon />
          {title}
        </h3>
        <span className={`dash-badge ${version ? "dash-badge--primary" : ""}`}>
          {version ? t("dashboard.status.active") : t("dashboard.patient.noPlan", "لا توجد خطة")}
        </span>
      </div>
      <div className="pp-card__body">
        {!version && (
          <div className="pp-empty">
            <div className="pp-empty__icon">
              <Icon />
            </div>
            <p>{t("dashboard.patient.noActivePlan")}</p>
          </div>
        )}

        {version && targets && (
          <div className="pp-macros">
            {MACRO_TILES.filter(([k]) => targets[k] != null && targets[k] !== "").map(
              ([k, label, cls]) => (
                <div key={k} className={`pp-macro ${cls}`}>
                  <div className="pp-macro__value">{targets[k]}</div>
                  <div className="pp-macro__label">{label}</div>
                </div>
              )
            )}
          </div>
        )}

        {version && rx.length > 0 && (
          <div className="pp-rx" style={{ marginBottom: meals.length ? 18 : 0 }}>
            {rx.map(([label, v]) => (
              <span key={label} className="pp-rx__chip">
                <span className="pp-rx__label">{label}</span>
                <span className="pp-rx__value">{v}</span>
              </span>
            ))}
          </div>
        )}

        {version && meals.length > 0 && (
          <div className="pp-days">
            {days.map(([dayNum, dayMeals]) => (
              <div key={dayNum}>
                {days.length > 1 && <div className="pp-day__label">اليوم {dayNum}</div>}
                {dayMeals.map((meal, mi) => {
                  const meta = MEAL_META[meal.code];
                  const items = Array.isArray(meal.items) ? meal.items : [];
                  return (
                    <div key={meal.id || mi} className="pp-meal">
                      <div className="pp-meal__head">
                        <span className="pp-meal__emoji">{meta?.icon || "🍽️"}</span>
                        <span className="pp-meal__name">
                          {meta?.label || meal.name_ar || meal.name_en || meal.code || `وجبة ${mi + 1}`}
                        </span>
                        <span className="pp-meal__count">{items.length} صنف</span>
                      </div>
                      <ul className="pp-meal__items">
                        {items.map((it, ii) => {
                          const food = it.food_item || it.FoodItem || {};
                          const qty = it.quantity ? `${it.quantity}${it.unit || ""}` : null;
                          return (
                            <li key={it.id || ii} className="pp-meal__item">
                              <span className="pp-meal__item-dot" />
                              <span className="pp-meal__item-name">
                                {food.name_ar || food.name_en || "صنف"}
                              </span>
                              {qty && <span className="pp-meal__item-qty">× {qty}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
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
    <section className="pp-card">
      <div className="pp-card__head">
        <h3 className="pp-card__title">
          <ClipboardCheck />
          {t("dashboard.patient.checkinTitle")}
        </h3>
      </div>
      <form className="pp-card__body" style={{ display: "grid", gap: 16 }} onSubmit={submit}>
        <label className="pp-field">
          <span className="pp-field__label">
            <Scale />
            {t("dashboard.patient.weight")}
          </span>
          <input
            className="pp-input"
            type="number"
            name="weight"
            min="20"
            max="400"
            step="0.1"
            required
            placeholder="كجم"
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <label className="pp-field">
            <span className="pp-field__label">
              <Salad />
              {t("dashboard.patient.nutritionAdherence")}
            </span>
            <input className="pp-input" type="number" name="nutritionAdherence" min="0" max="10" required placeholder="من ١٠" />
          </label>
          <label className="pp-field">
            <span className="pp-field__label">
              <Dumbbell />
              {t("dashboard.patient.exerciseAdherence")}
            </span>
            <input className="pp-input" type="number" name="exerciseAdherence" min="0" max="10" required placeholder="من ١٠" />
          </label>
        </div>
        <label className="pp-field">
          <span className="pp-field__label">{t("dashboard.patient.note")}</span>
          <textarea className="pp-input" name="note" rows="3" />
        </label>
        <button className="pp-submit" disabled={busy}>
          <Send size={17} />
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
    { path: "/patient/orders", label: "طلباتي", icon: ShoppingBag },
    { path: "/patient/notifications", label: t("dashboard.nav.notifications"), icon: Bell },
  ];

  let page;
  if (path === "/patient/care") page = <DailyCare />;
  else if (path === "/patient/progress") page = <PatientProgress />;
  else if (path === "/patient/payments") page = <PaymentCenter />;
  else if (path === "/patient/orders") page = <PatientOrders />;
  else if (path === "/patient/notifications") page = <NotificationsPanel />;
  else if (path === "/patient/book") page = <BookSlotPage />;
  else if (path === "/patient/plan")
    page = (
      <>
        <div className="pp-hero">
          <span className="pp-hero__icon">
            <Salad />
          </span>
          <div className="pp-hero__body">
            <div className="pp-hero__eyebrow">برنامجك الغذائي والرياضي</div>
            <h2 className="pp-hero__title">{t("dashboard.patient.myPlans")}</h2>
            <p className="pp-hero__sub">خطط محدثة من فريق الدكتور كريم — التزم بيوم بخطوة</p>
          </div>
        </div>
        <div className="dash-plan-grid">
          <PlanCard
            title={t("dashboard.patient.nutritionPlan")}
            version={activeNutrition}
            icon={Salad}
          />
          <PlanCard
            title={t("dashboard.patient.exercisePlan")}
            version={activeExercise}
            icon={Dumbbell}
          />
        </div>
      </>
    );
  else if (path === "/patient/checkin")
    page = (
      <>
        <div className="pp-hero">
          <span className="pp-hero__icon">
            <ClipboardCheck />
          </span>
          <div className="pp-hero__body">
            <div className="pp-hero__eyebrow">متابعتك اليومية</div>
            <h2 className="pp-hero__title">{t("dashboard.patient.checkinTitle")}</h2>
            <p className="pp-hero__sub">سجل وزنك ومستوى التزامك لمساعدة الفريق في متابعة تقدمك</p>
          </div>
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
