import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  ListChecks,
  Wallet,
  Settings,
  CalendarDays,
  Bell,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Scale,
  Users,
  FileText,
  MessageCircle,
  Video,
  Plus,
  StopCircle,
  ShoppingBag,
} from "lucide-react";
import DashboardShell from "../shared/DashboardShell";
import NotificationsPanel from "../shared/NotificationsPanel";
import StatusBadge from "../shared/StatusBadge";
import PaymentReview from "./PaymentReview";
import AdminConfiguration from "./AdminConfiguration";
import CarePrograms from "./CarePrograms";
import CareTemplates from "./CareTemplates";
import DoctorProgress from "./ProgressManager";
import PatientsList from "./PatientsList";
import PatientProfile from "./PatientProfile";
import ReviewDetail from "./ReviewDetail";
import NutritionBuilder from "./NutritionBuilder";
import ExerciseBuilder from "./ExerciseBuilder";
import ArticleManager from "./ArticleManager";
import ServicesManager from "./ServicesManager";
import ContactMessages from "./ContactMessages";
import PackagesManager from "./PackagesManager";
import SlotManager from "./SlotManager";
import StoreManager from "./StoreManager";
import DoctorOverview from "./DoctorOverview";
import TestimonialManager from "./TestimonialManager";
import CouponsManager from "./CouponsManager";
import ChatManager from "./ChatManager";
import { reviewApi, appointmentApi, liveSessionApi, patientApi } from "../../api/client";
import { navigate } from "../../lib/router";
import { useAuth } from "../../context/AuthProvider";

function Empty({ text }) {
  return (
    <div className="dash-empty">
      <Inbox />
      <p>{text}</p>
    </div>
  );
}

function Reviews({ rows, reload }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(null);
  const run = async (id, fn) => {
    setBusy(id);
    try {
      await fn();
      await reload();
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <ListChecks />
          {t("dashboard.nav.reviewQueue")}
        </span>
        <h2>{t("dashboard.reviews.title")}</h2>
        <p>{t("dashboard.reviews.subtitle")}</p>
      </div>

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <ListChecks />
            {t("dashboard.reviews.title")}
          </h3>
          <span className="dash-badge dash-badge--primary">{rows.length}</span>
        </div>
        {rows.length ? (
          <div className="dash-table-wrap dash-panel__body--flush">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t("dashboard.reviews.patient")}</th>
                  <th>{t("dashboard.reviews.submitted")}</th>
                  <th>{t("dashboard.reviews.priority")}</th>
                  <th>{t("dashboard.reviews.status")}</th>
                  <th>{t("dashboard.reviews.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/doctor/reviews/${r.id}`)}
                  >
                    <td>
                      <span className="dash-cell-main">{r.patientName || r.referenceNumber}</span>
                      {r.referenceNumber && <span className="dash-cell-sub">{r.referenceNumber}</span>}
                    </td>
                    <td className="dash-cell-muted">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <span className={`dash-badge ${r.priority === "urgent" || r.tier === "urgent" ? "dash-badge--danger" : "dash-badge--neutral"}`}>
                        {r.priority === "urgent" || r.tier === "urgent"
                          ? t("dashboard.status.urgent")
                          : t("dashboard.status.standard")}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="dash-row-actions">
                        <button
                          className="dash-btn dash-btn--ghost dash-btn--sm"
                          onClick={() => navigate(`/doctor/reviews/${r.id}`)}
                        >
                          {t("dashboard.reviews.view", "عرض البيانات")}
                        </button>
                        {r.status === "queued" && (
                          <button
                            className="dash-btn dash-btn--ghost dash-btn--sm"
                            disabled={busy === r.id}
                            onClick={() => run(r.id, () => reviewApi.assign(r.id, {}))}
                          >
                            {t("dashboard.reviews.assign")}
                          </button>
                        )}
                        {r.status === "assigned" && (
                          <button
                            className="dash-btn dash-btn--primary dash-btn--sm"
                            disabled={busy === r.id}
                            onClick={() => run(r.id, () => reviewApi.open(r.id))}
                          >
                            {t("dashboard.reviews.open")}
                          </button>
                        )}
                        {r.status === "in_review" && (
                          <>
                            <button
                              className="dash-btn dash-btn--primary dash-btn--sm"
                              disabled={busy === r.id}
                              onClick={() => run(r.id, () => reviewApi.approve(r.id, {}))}
                            >
                              <CheckCircle2 />
                              {t("dashboard.reviews.approve")}
                            </button>
                            <button
                              className="dash-btn dash-btn--danger dash-btn--sm"
                              disabled={busy === r.id}
                              onClick={() =>
                                run(r.id, () => reviewApi.reject(r.id, { reason: "Needs clinical follow-up" }))
                              }
                            >
                              {t("dashboard.reviews.reject")}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text={t("dashboard.reviews.empty")} />
        )}
      </section>
    </>
  );
}

function Appointments({ rows, reload, subscriptions }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState("");

  const liveEntitlement = (a) => {
    const sub = subscriptions[String(a.patient_id || a.patientId)];
    if (!sub) return { entitled: true, label: t("dashboard.appointments.noSubscription", "بدون اشتراك") };
    if (sub.periodActive === false || sub.status === "expired" || sub.status === "cancelled" || sub.status === "rejected")
      return { entitled: false, label: t("dashboard.appointments.expired", "منتهي") };
    if (!sub.hasLiveSession) return { entitled: false, label: t("dashboard.appointments.noLive", "بدون بث") };
    return { entitled: true, label: sub.packageName || t("dashboard.appointments.active", "نشط") };
  };

  const run = async (id, action) => {
    setBusy(id);
    setNotice("");
    try {
      await appointmentApi.transition(id, action);
      await reload();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(null);
    }
  };

  const createSession = async (a) => {
    setBusy(a.id);
    setNotice("");
    try {
      await liveSessionApi.create(a.id);
      await reload();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(null);
    }
  };

  const joinSession = async (a) => {
    setBusy(a.id);
    setNotice("");
    try {
      const session = await liveSessionApi.join(a.liveSessionId);
      if (session?.joinUrl)
        window.open(`${session.joinUrl}?t=${encodeURIComponent(session.token)}`, "_blank", "noopener,noreferrer");
      else setNotice(t("dashboard.appointments.noUrl", "رابط الجلسة غير متاح بعد"));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(null);
    }
  };

  const endSession = async (a) => {
    setBusy(a.id);
    setNotice("");
    try {
      await liveSessionApi.end(a.liveSessionId);
      await reload();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <CalendarDays />
          {t("dashboard.appointments.title")}
        </span>
        <h2>{t("dashboard.appointments.title")}</h2>
      </div>

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <CalendarDays />
            {t("dashboard.appointments.title")}
          </h3>
          <span className="dash-badge dash-badge--info">{rows.length}</span>
        </div>
        {notice && (
          <p role="alert" style={{ margin: "14px 20px 0", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "11px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={15} />
            <span style={{ flex: 1 }}>{notice}</span>
            <button onClick={() => setNotice("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }} aria-label="close">×</button>
          </p>
        )}
        {rows.length ? (
          <div className="dash-table-wrap dash-panel__body--flush">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t("dashboard.appointments.patient")}</th>
                  <th>{t("dashboard.appointments.subscription", "الاشتراك")}</th>
                  <th>{t("dashboard.appointments.start")}</th>
                  <th>{t("dashboard.appointments.type")}</th>
                  <th>{t("dashboard.appointments.status")}</th>
                  <th>{t("dashboard.appointments.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="dash-cell-main">{a.patient_id || a.patientId || "—"}</span>
                    </td>
                    <td>
                      {(() => { const ent = liveEntitlement(a); const sub = subscriptions[String(a.patient_id || a.patientId)]; return (
                        <span className={`dash-badge ${ent.entitled ? "dash-badge--success" : "dash-badge--danger"}`} title={`${ent.label}${sub?.expiresAt ? ` — ${t("dashboard.appointments.endsAt", "ينتهي")}: ${new Date(sub.expiresAt).toLocaleDateString()}` : ""}`}>
                          {ent.label}
                        </span>
                      ); })()}
                    </td>
                    <td className="dash-cell-muted">
                      {a.scheduled_start_at ? new Date(a.scheduled_start_at).toLocaleString() : "—"}
                    </td>
                    <td className="dash-cell-muted">{a.type || "—"}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>
                      <div className="dash-row-actions">
                        {a.status === "pending" && (
                          <button
                            className="dash-btn dash-btn--ghost dash-btn--sm"
                            disabled={busy === a.id}
                            onClick={() => run(a.id, "confirm")}
                          >
                            {t("dashboard.appointments.confirm")}
                          </button>
                        )}
                        {a.status === "confirmed" && !a.liveSessionId && liveEntitlement(a).entitled && (
                          <button
                            className="dash-btn dash-btn--primary dash-btn--sm"
                            disabled={busy === a.id}
                            onClick={() => createSession(a)}
                          >
                            <Plus size={14} />
                            {t("dashboard.appointments.createSession")}
                          </button>
                        )}
                        {a.status === "confirmed" && a.liveSessionId && (
                          <>
                            <button
                              className="dash-btn dash-btn--primary dash-btn--sm"
                              disabled={busy === a.id}
                              onClick={() => joinSession(a)}
                            >
                              <Video size={14} />
                              {t("dashboard.appointments.openSession")}
                            </button>
                            <button
                              className="dash-btn dash-btn--danger dash-btn--sm"
                              disabled={busy === a.id}
                              onClick={() => endSession(a)}
                            >
                              <StopCircle size={14} />
                              {t("dashboard.appointments.endSession")}
                            </button>
                          </>
                        )}
                        {a.status === "confirmed" && (
                          <button
                            className="dash-btn dash-btn--ghost dash-btn--sm"
                            disabled={busy === a.id}
                            onClick={() => run(a.id, "complete")}
                          >
                            <CheckCircle2 />
                            {t("dashboard.appointments.complete")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text={t("dashboard.appointments.empty")} />
        )}
      </section>
    </>
  );
}

export default function DoctorDashboard({ path }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});

  const reload = async () => {
    const [r, a, patients] = await Promise.all([
      reviewApi.list(),
      user.doctorId ? appointmentApi.doctorList(user.doctorId) : Promise.resolve([]),
      patientApi.list("?limit=100").catch(() => []),
    ]);
    const subs = {};
    for (const p of patients?.items || []) {
      const pid = String(p.id);
      subs[pid] = p.subscription
        ? {
            status: p.subscription.status,
            periodActive: p.subscription.periodActive,
            hasLiveSession: p.subscription.hasLiveSession,
            expiresAt: p.subscription.expiresAt,
            packageName: p.subscription.package?.name || null,
          }
        : null;
    }
    setReviews(r || []);
    setAppointments(a || []);
    setSubscriptions(subs);
  };

  useEffect(() => {
    reload().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.doctorId]);

  const nav = [
    { path: "/doctor", label: t("dashboard.nav.overview"), icon: LayoutDashboard },
    { path: "/doctor/patients", label: t("dashboard.nav.patients"), icon: Users },
    { path: "/doctor/reviews", label: t("dashboard.nav.reviewQueue"), icon: ListChecks },
    { path: "/doctor/care", label: t("doctorCare.title"), icon: ClipboardList },
    { path: "/doctor/templates", label: "قوالب الرعاية", icon: ClipboardList },
    { path: "/doctor/progress", label: t("doctorProgress.nav"), icon: Scale },
    { path: "/doctor/articles", label: "نصائح طبية", icon: FileText },
    { path: "/doctor/services", label: "إدارة الخدمات", icon: ClipboardList },
    { path: "/doctor/packages", label: "إدارة الباقات", icon: Wallet },
    { path: "/doctor/coupons", label: "كوبونات الخصم", icon: Wallet },
    { path: "/doctor/store", label: "المتجر", icon: ShoppingBag },
    { path: "/doctor/chat", label: "المحادثات المباشرة", icon: MessageCircle },
    { path: "/doctor/messages", label: "رسائل التواصل", icon: MessageCircle },
    { path: "/doctor/testimonials", label: "آراء العملاء", icon: ListChecks },
    { path: "/doctor/payments", label: t("dashboard.nav.payments"), icon: Wallet },
    { path: "/doctor/configuration", label: t("dashboard.nav.configuration"), icon: Settings },
    { path: "/doctor/appointments", label: t("dashboard.nav.appointments"), icon: CalendarDays },
    { path: "/doctor/notifications", label: t("dashboard.nav.notifications"), icon: Bell },
  ];

  const patientProfileMatch = path.match(/^\/doctor\/patients\/(\d+)$/);
  const nutritionBuilderMatch = path.match(/^\/doctor\/patients\/(\d+)\/nutrition-builder$/);
  const exerciseBuilderMatch = path.match(/^\/doctor\/patients\/(\d+)\/exercise-builder$/);
  const reviewDetailMatch = path.match(/^\/doctor\/reviews\/(\d+)$/);

  let page;
  if (nutritionBuilderMatch) page = <NutritionBuilder patientId={nutritionBuilderMatch[1]} />;
  else if (exerciseBuilderMatch) page = <ExerciseBuilder patientId={exerciseBuilderMatch[1]} />;
  else if (patientProfileMatch) page = <PatientProfile patientId={patientProfileMatch[1]} />;
  else if (reviewDetailMatch) page = <ReviewDetail reviewId={reviewDetailMatch[1]} />;
  else if (path === "/doctor/patients") page = <PatientsList />;
  else if (path === "/doctor/payments") page = <PaymentReview />;
  else if (path === "/doctor/store") page = <StoreManager />;
  else if (path === "/doctor/configuration") page = <AdminConfiguration />;
  else if (path === "/doctor/notifications") page = <NotificationsPanel />;
  else if (path === "/doctor/reviews") page = <Reviews rows={reviews} reload={reload} />;
  else if (path === "/doctor/care") page = <CarePrograms />;
  else if (path === "/doctor/templates") page = <CareTemplates />;
  else if (path === "/doctor/progress") page = <DoctorProgress />;
  else if (path === "/doctor/articles") page = <ArticleManager />;
  else if (path === "/doctor/services") page = <ServicesManager />;
  else if (path === "/doctor/packages") page = <PackagesManager />;
  else if (path === "/doctor/coupons") page = <CouponsManager />;
  else if (path === "/doctor/chat") page = <ChatManager />;
  else if (path === "/doctor/messages") page = <ContactMessages />;
  else if (path === "/doctor/testimonials") page = <TestimonialManager />;
  else if (path === "/doctor/appointments") page = (<>
      <SlotManager />
      <Appointments rows={appointments} reload={reload} subscriptions={subscriptions} />
    </>);
  else
    page = <DoctorOverview />;

  return (
    <DashboardShell
      title={t("dashboard.stats.overviewTitle")}
      navLabel={t("dashboard.nav.overview")}
      nav={nav}
    >
      {page}
    </DashboardShell>
  );
}
