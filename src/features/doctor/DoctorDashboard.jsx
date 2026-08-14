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
  Clock,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Scale,
  Users,
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
import { reviewApi, appointmentApi, notificationApi } from "../../api/client";
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
          {t("dashboard.reviewQueue")}
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
                  <tr key={r.id}>
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
                    <td>
                      <div className="dash-row-actions">
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

function Appointments({ rows, reload }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(null);
  const run = async (id, action) => {
    setBusy(id);
    try {
      await appointmentApi.transition(id, action);
      await reload();
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <CalendarDays />
          {t("dashboard.appointments")}
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
        {rows.length ? (
          <div className="dash-table-wrap dash-panel__body--flush">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t("dashboard.appointments.patient")}</th>
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
                        {a.status === "confirmed" && (
                          <button
                            className="dash-btn dash-btn--primary dash-btn--sm"
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
  const [unread, setUnread] = useState(0);

  const reload = async () => {
    const [r, a, notifs] = await Promise.all([
      reviewApi.list(),
      user.doctorId ? appointmentApi.doctorList(user.doctorId) : Promise.resolve([]),
      notificationApi.list().catch(() => []),
    ]);
    setReviews(r || []);
    setAppointments(a || []);
    setUnread((notifs || []).filter((n) => !n.read_at && !n.readAt).length);
  };

  useEffect(() => {
    reload().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.doctorId]);

  const urgent = reviews.filter(
    (r) => r.status !== "approved" && r.status !== "rejected" && (r.priority === "urgent" || r.tier === "urgent")
  ).length;
  const pending = reviews.filter((r) => r.status !== "approved" && r.status !== "rejected").length;

  const nav = [
    { path: "/doctor", label: t("dashboard.nav.overview"), icon: LayoutDashboard },
    { path: "/doctor/patients", label: t("dashboard.nav.patients"), icon: Users },
    { path: "/doctor/reviews", label: t("dashboard.nav.reviewQueue"), icon: ListChecks },
    { path: "/doctor/care", label: t("doctorCare.title"), icon: ClipboardList },
    { path: "/doctor/templates", label: "قوالب الرعاية", icon: ClipboardList },
    { path: "/doctor/progress", label: t("doctorProgress.nav"), icon: Scale },
    { path: "/doctor/payments", label: t("dashboard.nav.payments"), icon: Wallet },
    { path: "/doctor/configuration", label: t("dashboard.nav.configuration"), icon: Settings },
    { path: "/doctor/appointments", label: t("dashboard.nav.appointments"), icon: CalendarDays },
    { path: "/doctor/notifications", label: t("dashboard.nav.notifications"), icon: Bell },
  ];

  const patientProfileMatch = path.match(/^\/doctor\/patients\/(\d+)$/);

  let page;
  if (patientProfileMatch) page = <PatientProfile patientId={patientProfileMatch[1]} />;
  else if (path === "/doctor/patients") page = <PatientsList />;
  else if (path === "/doctor/payments") page = <PaymentReview />;
  else if (path === "/doctor/configuration") page = <AdminConfiguration />;
  else if (path === "/doctor/notifications") page = <NotificationsPanel />;
  else if (path === "/doctor/reviews") page = <Reviews rows={reviews} reload={reload} />;
  else if (path === "/doctor/care") page = <CarePrograms />;
  else if (path === "/doctor/templates") page = <CareTemplates />;
  else if (path === "/doctor/progress") page = <DoctorProgress />;
  else if (path === "/doctor/appointments") page = <Appointments rows={appointments} reload={reload} />;
  else
    page = (
      <>
        <div className="dash-page-head">
          <span className="dash-eyebrow">
            <LayoutDashboard />
            {t("dashboard.nav.overview")}
          </span>
          <h2>{t("dashboard.stats.overviewTitle")}</h2>
          <p>{t("dashboard.stats.overviewSubtitle")}</p>
        </div>

        <div className="dash-stat-grid">
          <section className="dash-stat">
            <span className="dash-stat__icon">
              <Clock />
            </span>
            <div>
              <div className="dash-stat__value">{pending}</div>
              <div className="dash-stat__label">{t("dashboard.stats.pendingReviews")}</div>
            </div>
          </section>

          <section className="dash-stat dash-stat--danger">
            <span className="dash-stat__icon">
              <AlertTriangle />
            </span>
            <div>
              <div className="dash-stat__value">{urgent}</div>
              <div className="dash-stat__label">{t("dashboard.stats.urgentReviews")}</div>
            </div>
          </section>

          <section className="dash-stat dash-stat--info">
            <span className="dash-stat__icon">
              <CalendarDays />
            </span>
            <div>
              <div className="dash-stat__value">{appointments.length}</div>
              <div className="dash-stat__label">{t("dashboard.stats.appointments")}</div>
            </div>
          </section>

          <section className="dash-stat dash-stat--warning">
            <span className="dash-stat__icon">
              <Bell />
            </span>
            <div>
              <div className="dash-stat__value">{unread}</div>
              <div className="dash-stat__label">{t("dashboard.stats.unread")}</div>
            </div>
          </section>
        </div>

        <NotificationsPanel compact />
      </>
    );

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
