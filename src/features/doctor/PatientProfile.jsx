import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, UserRound, CreditCard, ClipboardList, Scale, Wallet, Inbox, Phone, Calendar, Mail, FileText, CheckCircle2, ChevronLeft } from "lucide-react";
import { patientApi } from "../../api/client";
import { navigate } from "../../lib/router";
import CarePrograms from "./CarePrograms";
import DoctorProgress from "./ProgressManager";

const STATUS_STYLES = {
  active: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dot: "#10b981", label: "نشط" },
  pending_payment: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d", dot: "#f59e0b", label: "في انتظار الدفع" },
  inactive: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", dot: "#94a3b8", label: "غير نشط" },
  archived: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", dot: "#94a3b8", label: "مؤرشف" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.inactive;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      background: s.bg, color: s.color, border: "1px solid " + s.border,
      padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "800",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div style={{ background: "var(--dash-card-bg)", borderRadius: "16px", padding: "20px", border: "1.5px solid var(--dash-border)", display: "flex", gap: "16px", alignItems: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: "14px", background: highlight ? "var(--dash-primary-soft)" : "var(--dash-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={24} style={{ color: highlight ? "var(--dash-primary)" : "var(--dash-text-muted)" }} />
      </div>
      <div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "4px" }}>{label}</div>
        <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--dash-text)", lineHeight: "1.2" }}>{value}</div>
        {sub && <div style={{ fontSize: "12px", color: "var(--dash-text-soft)", marginTop: "4px" }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function PatientProfile({ patientId }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const load = async () => {
    setError("");
    try {
      setData(await patientApi.get(patientId));
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  if (error && !data) return (
    <div className="dash-panel" style={{ padding: "40px 20px", textAlign: "center" }}>
      <p style={{ color: "#ef4444", fontWeight: "700" }}>{error}</p>
      <button onClick={() => navigate("/doctor/patients")} className="dash-btn dash-btn--ghost" style={{ marginTop: "16px" }}>
        العودة للقائمة
      </button>
    </div>
  );
  
  if (!data) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--dash-border)", borderTopColor: "var(--dash-primary)" }} />
    </div>
  );

  const { patient, subscription, careProgram, progress, payments } = data;

  const TABS = [
    { key: "overview", label: "نظرة عامة", icon: UserRound },
    { key: "care", label: "برامج الرعاية", icon: ClipboardList },
    { key: "progress", label: "القياسات والتقدم", icon: Scale },
    { key: "payments", label: "المدفوعات", icon: Wallet },
  ];

  return (
    <>
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <button
            onClick={() => navigate("/doctor/patients")}
            style={{ background: "transparent", border: "none", color: "var(--dash-text-muted)", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "0", marginBottom: "16px", fontFamily: "inherit" }}
          >
            <ArrowLeft size={16} /> العودة لقائمة المرضى
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "20px", background: "var(--dash-primary-soft)", color: "var(--dash-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "900", flexShrink: 0 }}>
              {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <h2 style={{ fontSize: "28px", fontWeight: "900", color: "var(--dash-text)", margin: "0 0 6px", lineHeight: "1" }}>{patient.fullName}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--dash-text-muted)", fontSize: "14px", fontWeight: "600" }}>
                {patient.phoneDisplay && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={14} /> <span dir="ltr">{patient.phoneDisplay}</span></span>}
                {patient.email && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail size={14} /> <span>{patient.email}</span></span>}
              </div>
            </div>
          </div>
        </div>
        <div>
          <StatusPill status={patient.status} />
        </div>
      </div>

      {/* Modern Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", borderBottom: "1.5px solid var(--dash-border)", paddingBottom: "16px", overflowX: "auto" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "10px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: "800",
              border: "none", background: activeTab === t.key ? "var(--dash-text)" : "transparent",
              color: activeTab === t.key ? "var(--dash-bg)" : "var(--dash-text-muted)",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap"
            }}
          >
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "overview" && (
            <div style={{ display: "grid", gap: "24px" }}>
              {/* Top Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <StatCard
                  icon={Calendar} label="العمر"
                  value={patient.ageYears != null ? `${patient.ageYears} سنة` : "غير محدد"}
                  sub={patient.sex ? (patient.sex === "M" ? "ذكر" : "أنثى") : ""}
                />
                <StatCard
                  icon={CreditCard} label="الاشتراك الحالي" highlight={!!subscription}
                  value={subscription ? (subscription.package?.name || "باقة مخصصة") : "لا يوجد اشتراك"}
                  sub={subscription?.endsAt ? `ينتهي في ${new Date(subscription.endsAt).toLocaleDateString("ar-EG")}` : ""}
                />
                <StatCard
                  icon={ClipboardList} label="برنامج الرعاية" highlight={careProgram?.status === "active"}
                  value={careProgram ? careProgram.status : "لا يوجد برنامج"}
                  sub={careProgram ? "تم تعيين خطة" : "يحتاج إنشاء خطة"}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
                
                {/* Latest Measurements */}
                <div style={{ background: "var(--dash-card-bg)", borderRadius: "20px", padding: "24px", border: "1.5px solid var(--dash-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                      <Scale size={20} style={{ color: "var(--dash-primary)" }} /> أحدث القياسات
                    </h3>
                    <button onClick={() => setActiveTab("progress")} style={{ background: "transparent", border: "none", color: "var(--dash-text-muted)", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontFamily: "inherit" }}>
                      عرض الكل <ChevronLeft size={14} />
                    </button>
                  </div>
                  {progress?.latest?.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {progress.latest.map((m, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "var(--dash-bg)", borderRadius: "12px" }}>
                          <span style={{ fontWeight: "700", color: "var(--dash-text)" }}>{m.type}</span>
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontWeight: "800", color: "var(--dash-primary)", fontSize: "16px" }}>{m.value} {m.unit}</div>
                            <div style={{ fontSize: "11px", color: "var(--dash-text-muted)" }}>{m.measuredOn}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--dash-text-soft)" }}>
                      <Scale size={32} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
                      <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>لا توجد قياسات مسجلة</p>
                    </div>
                  )}
                </div>

                {/* Subscriptions Entitlements */}
                <div style={{ background: "var(--dash-card-bg)", borderRadius: "20px", padding: "24px", border: "1.5px solid var(--dash-border)" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 20px" }}>
                    <CheckCircle2 size={20} style={{ color: "var(--dash-info)" }} /> صلاحيات الباقة
                  </h3>
                  {subscription?.entitlements?.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {subscription.entitlements.map((e, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "var(--dash-bg)", borderRadius: "12px" }}>
                          <span style={{ fontWeight: "700", color: "var(--dash-text)" }}>{e.code}</span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-muted)", background: "var(--dash-border)", padding: "4px 10px", borderRadius: "999px" }}>
                            تم استخدام {e.used} / {e.limit ?? "∞"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--dash-text-soft)" }}>
                      <FileText size={32} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
                      <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>لا توجد صلاحيات لعرضها</p>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          )}

          {activeTab === "care" && <div style={{ background: "var(--dash-card-bg)", borderRadius: "20px", border: "1.5px solid var(--dash-border)", padding: "24px" }}><CarePrograms patientId={patientId} /></div>}
          
          {activeTab === "progress" && <div style={{ background: "var(--dash-card-bg)", borderRadius: "20px", border: "1.5px solid var(--dash-border)", padding: "24px" }}><DoctorProgress patientId={patientId} /></div>}
          
          {activeTab === "payments" && (
            <div style={{ background: "var(--dash-card-bg)", borderRadius: "20px", border: "1.5px solid var(--dash-border)", padding: "24px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 20px" }}>
                <Wallet size={20} /> سجل المدفوعات
              </h3>
              {payments?.length ? (
                <div style={{ display: "grid", gap: "12px" }}>
                  {payments.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "var(--dash-bg)", borderRadius: "16px", border: "1px solid var(--dash-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "12px", background: "var(--dash-card-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                          {p.method === "vodafone_cash" ? "📱" : p.method === "instapay" ? "🏦" : "💳"}
                        </div>
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: "900", color: "var(--dash-text)" }}>{p.amount} {p.currency}</div>
                          <div style={{ fontSize: "13px", color: "var(--dash-text-muted)", marginTop: "2px" }}>
                            {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString("ar-EG") : "—"}
                          </div>
                        </div>
                      </div>
                      <StatusPill status={p.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--dash-text-soft)" }}>
                  <Inbox size={48} style={{ opacity: 0.5, margin: "0 auto 16px" }} />
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "15px" }}>لا يوجد سجل مدفوعات</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}