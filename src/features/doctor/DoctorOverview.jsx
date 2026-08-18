import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Clock,
  AlertTriangle,
  CalendarDays,
  Wallet,
  TrendingUp,
  Bell,
  ClipboardList,
  Activity,
  Video,
  FileText,
  Package,
  MessageCircle,
  Stethoscope,
  CircleDollarSign,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { doctorStatsApi } from "../../api/client";
import NotificationsPanel from "../shared/NotificationsPanel";
import StatusBadge from "../shared/StatusBadge";

const currency = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value || 0);

function StatCard({ icon: Icon, value, label, tone = "" }) {
  return (
    <section className={`dash-stat ${tone}`}>
      <span className="dash-stat__icon">
        <Icon />
      </span>
      <div>
        <div className="dash-stat__value">{value}</div>
        <div className="dash-stat__label">{label}</div>
      </div>
    </section>
  );
}

function ChartCard({ title, icon: Icon, children, hint }) {
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <Icon />
          {title}
        </h3>
        {hint ? <span className="dash-badge dash-badge--info">{hint}</span> : null}
      </div>
      <div className="dash-panel__body">{children}</div>
    </section>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-EG", { day: "numeric", month: "short" });
}

export default function DoctorOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setStats(await doctorStatsApi.overview());
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <div className="dash-panel">
        <div className="dash-panel__body">
          <p role="alert" style={{ color: "#991b1b", fontWeight: 700 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dash-panel">
        <div className="dash-panel__body">
          <p style={{ color: "var(--dash-text-muted)" }}>{t("dashboard.stats.loading", "جاري تحميل الإحصائيات...")}</p>
        </div>
      </div>
    );
  }

  const { patients, subscriptions, reviews, appointments, payments, operations, trends, recent } = stats;
  const revenueLabel = `${currency(payments.revenueThisMonth)} EGP`;

  const appointmentChart = appointments.upcoming
    ? [
        { key: t("dashboard.stats.chart.today", "اليوم"), value: appointments.today },
        { key: t("dashboard.stats.chart.upcoming", "القادمة"), value: appointments.upcoming - appointments.today },
        { key: t("dashboard.stats.chart.completed", "المكتملة"), value: appointments.completed },
      ]
    : [];

  const reviewBars = [
    { key: t("dashboard.stats.chart.queued", "في الانتظار"), value: reviews.queued, fill: "#94a3b8" },
    { key: t("dashboard.stats.chart.assigned", "مُعيَّنة"), value: reviews.assigned, fill: "#3b82f6" },
    { key: t("dashboard.stats.chart.inReview", "قيد المراجعة"), value: reviews.inReview, fill: "#f59e0b" },
    { key: t("dashboard.stats.chart.clarification", "تساؤلات"), value: reviews.needsClarification, fill: "#8b5cf6" },
    { key: t("dashboard.stats.chart.approved", "معتمدة"), value: reviews.approved, fill: "#22c55e" },
    { key: t("dashboard.stats.chart.rejected", "مرفوضة"), value: reviews.rejected, fill: "#ef4444" },
  ];

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <Stethoscope />
          {t("dashboard.nav.overview")}
        </span>
        <h2>{t("dashboard.stats.overviewTitle")}</h2>
        <p>{t("dashboard.stats.overviewSubtitle")}</p>
      </div>

      {/* KPI grid */}
      <div className="dash-stat-grid">
        <StatCard icon={Users} value={patients.total} label={t("dashboard.stats.patients", "إجمالي المرضى")} />
        <StatCard icon={Clock} value={reviews.pending} label={t("dashboard.stats.pendingReviews")} />
        <StatCard icon={AlertTriangle} value={reviews.urgent} label={t("dashboard.stats.urgentReviews")} tone="dash-stat--danger" />
        <StatCard icon={CalendarDays} value={appointments.today} label={t("dashboard.stats.appointmentsToday", "مواعيد اليوم")} tone="dash-stat--info" />
        <StatCard icon={CircleDollarSign} value={revenueLabel} label={t("dashboard.stats.revenueMonth", "إيرادات هذا الشهر")} tone="dash-stat--gold" />
        <StatCard icon={Wallet} value={payments.pending + patients.pendingPayment} label={t("dashboard.stats.pendingPayments", "مدفوعات منتظرة")} tone="dash-stat--warning" />
        <StatCard icon={Bell} value={operations.unread} label={t("dashboard.stats.unread")} tone="dash-stat--warning" />
        <StatCard icon={Activity} value={subscriptions.active} label={t("dashboard.stats.activePlans")} />
      </div>

      {/* Trend charts */}
      <div className="dash-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <ChartCard title={t("dashboard.stats.chart.newPatients", "مرضى جدد (آخر 14 يوم)")} icon={TrendingUp}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.patients} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" />
                <XAxis dataKey="date" tickFormatter={formatDate} fontSize={11} stroke="var(--dash-text-soft)" />
                <YAxis allowDecimals={false} fontSize={11} stroke="var(--dash-text-soft)" />
                <RechartsTooltip />
                <Area type="monotone" dataKey="value" name={t("dashboard.stats.axis.patients", "المرضى")} stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("dashboard.stats.chart.revenueTrend", "الإيرادات (آخر 14 يوم)")} icon={Wallet}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.payments} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPayments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab308" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#eab308" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" />
                <XAxis dataKey="date" tickFormatter={formatDate} fontSize={11} stroke="var(--dash-text-soft)" />
                <YAxis fontSize={11} stroke="var(--dash-text-soft)" tickFormatter={(v) => currency(v)} />
                <RechartsTooltip formatter={(v) => [`${currency(v)} EGP`, t("dashboard.stats.axis.revenue", "الإيراد")]} />
                <Area type="monotone" dataKey="value" name={t("dashboard.stats.axis.revenue", "الإيراد")} stroke="#eab308" strokeWidth={2.5} fill="url(#gradPayments)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Review pipeline + appointment distribution */}
      <div className="dash-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <ChartCard title={t("dashboard.stats.chart.reviewPipeline", "مسار المراجعات")} icon={ClipboardList}>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewBars} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" />
                <XAxis dataKey="key" fontSize={10.5} stroke="var(--dash-text-soft)" interval={0} />
                <YAxis allowDecimals={false} fontSize={11} stroke="var(--dash-text-soft)" />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" name={t("dashboard.stats.axis.reviews", "المراجعات")} fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={26}>
                  {reviewBars.map((entry) => (
                    <rect key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("dashboard.stats.chart.appointmentsDist", "المواعيد")} icon={CalendarDays}>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentChart} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" />
                <XAxis dataKey="key" fontSize={11} stroke="var(--dash-text-soft)" />
                <YAxis allowDecimals={false} fontSize={11} stroke="var(--dash-text-soft)" />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" name={t("dashboard.stats.axis.appointments", "المواعيد")} fill="var(--dash-info)" radius={[6, 6, 0, 0]} barSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Operations */}
      <div className="dash-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <StatCard icon={Activity} value={operations.checkinsPending} label={t("dashboard.stats.checkins")} />
        <StatCard icon={ClipboardList} value={operations.careActive} label={t("dashboard.stats.carePrograms", "برامج رعاية نشطة")} tone="dash-stat--info" />
        <StatCard icon={FileText} value={operations.articlesPublished} label={t("dashboard.stats.articles", "مقالات منشورة")} />
        <StatCard icon={Package} value={operations.servicesActive} label={t("dashboard.stats.services", "خدمات مفعّلة")} tone="dash-stat--gold" />
        <StatCard icon={MessageCircle} value={operations.unreadMessages} label={t("dashboard.stats.messages", "رسائل غير مقروءة")} tone={operations.unreadMessages ? "dash-stat--danger" : "dash-stat--warning"} />
        <StatCard icon={Video} value={`${appointments.slots.booked}/${appointments.slots.booked + appointments.slots.open}`} label={t("dashboard.stats.slotsBooked", "سلوتات محجوزة")} />
      </div>

      {/* Recent activity */}
      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <Activity />
            {t("dashboard.stats.recentActivity", "أحدث النشاط")}
          </h3>
          <span className="dash-badge dash-badge--primary">{recent.patients.length}</span>
        </div>
        <div className="dash-table-wrap dash-panel__body--flush">
          <table className="dash-table">
            <thead>
              <tr>
                <th>{t("dashboard.reviews.patient")}</th>
                <th>{t("dashboard.stats.chart.recentType", "النوع")}</th>
                <th>{t("dashboard.appointments.status")}</th>
                <th>{t("dashboard.appointments.start")}</th>
              </tr>
            </thead>
            <tbody>
              {recent.patients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="dash-cell-main">{p.fullName || "—"}</span>
                    <span className="dash-cell-sub">#{p.id}</span>
                  </td>
                  <td className="dash-cell-muted">
                    <Users size={14} /> {t("dashboard.stats.chart.newPatient", "مريض جديد")}
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="dash-cell-muted">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upcoming appointments + recent payments */}
      <div className="dash-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
        <section className="dash-panel">
          <div className="dash-panel__head">
            <h3 className="dash-panel__title">
              <CalendarDays />
              {t("dashboard.stats.nextAppointments", "المواعيد القادمة")}
            </h3>
            <span className="dash-badge dash-badge--info">{recent.appointments.length}</span>
          </div>
          {recent.appointments.length ? (
            <ul style={{ padding: "6px 22px 18px", margin: 0, listStyle: "none" }}>
              {recent.appointments.map((a) => (
                <li key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--dash-border)" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.patientName || "—"}</div>
                    <div style={{ fontSize: 12.5, color: "var(--dash-text-muted)" }}>{formatDate(a.scheduledStartAt)}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="dash-panel__body">
              <p style={{ color: "var(--dash-text-muted)" }}>{t("dashboard.appointments.empty")}</p>
            </div>
          )}
        </section>

        <section className="dash-panel">
          <div className="dash-panel__head">
            <h3 className="dash-panel__title">
              <Wallet />
              {t("dashboard.stats.latestPayments", "أحدث المدفوعات")}
            </h3>
            <span className="dash-badge dash-badge--primary">{recent.payments.length}</span>
          </div>
          {recent.payments.length ? (
            <ul style={{ padding: "6px 22px 18px", margin: 0, listStyle: "none" }}>
              {recent.payments.map((p) => (
                <li key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--dash-border)" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.patientName || p.packageName || "—"}</div>
                    <div style={{ fontSize: 12.5, color: "var(--dash-text-muted)" }}>{p.packageName || formatDate(p.createdAt)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 800 }}>{currency(p.amount)} EGP</span>
                    <StatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dash-panel__body">
              <p style={{ color: "var(--dash-text-muted)" }}>{t("dashboard.payments.empty")}</p>
            </div>
          )}
        </section>
      </div>

      {operations.unread > 0 && <NotificationsPanel compact />}
    </>
  );
}