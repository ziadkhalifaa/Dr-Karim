import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, UserRound, CreditCard, ClipboardList, Scale, Wallet, Inbox, Phone, Calendar, Mail, FileText, CheckCircle2, ChevronLeft, TrendingDown, Activity, ShieldAlert, Ban, HeartPulse } from "lucide-react";
import { patientApi } from "../../api/client";
import { navigate } from "../../lib/router";
import CarePrograms from "./CarePrograms";
import DoctorProgress from "./ProgressManager";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

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

  const { patient, profile, subscription, careProgram, progress, payments, upcomingAppointments } = data;

  const TABS = [
    { key: "overview", label: "لوحة تحكم المريض", icon: UserRound },
    { key: "care", label: "برامج التغذية والرعاية", icon: ClipboardList },
    { key: "progress", label: "القياسات والمتابعة", icon: Scale },
    { key: "payments", label: "المدفوعات", icon: Wallet },
  ];

  // Derive charts and summaries from progress history
  const chartData = useMemo(() => {
    if (!progress?.history?.length) return [];
    // group by date
    const grouped = {};
    progress.history.forEach(m => {
      if (!grouped[m.measuredOn]) grouped[m.measuredOn] = { date: m.measuredOn };
      grouped[m.measuredOn][m.type] = m.value;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [progress]);

  const weightStats = useMemo(() => {
    if (!progress?.history) return null;
    const weights = progress.history.filter(m => m.type === "weight").sort((a, b) => new Date(a.measuredOn) - new Date(b.measuredOn));
    if (weights.length === 0) return null;
    const first = weights[0];
    const last = weights[weights.length - 1];
    const diff = last.value - first.value;
    const isLoss = diff < 0;
    
    // approximate weeks
    const daysDiff = (new Date(last.measuredOn) - new Date(first.measuredOn)) / (1000 * 60 * 60 * 24);
    const weeks = Math.round(daysDiff / 7);

    return {
      firstWeight: first.value,
      firstDate: first.measuredOn,
      currentWeight: last.value,
      diff: Math.abs(diff),
      isLoss,
      durationText: weeks > 0 ? `خلال ${weeks} ${weeks === 1 ? "أسبوع" : weeks <= 10 ? "أسابيع" : "أسبوع"}` : "حديثاً"
    };
  }, [progress]);

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
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {upcomingAppointments?.length > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--dash-info-soft)", color: "var(--dash-info)", padding: "6px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: "800" }}>
              <Calendar size={14} />
              موعد قادم: {new Date(upcomingAppointments[0].scheduledStartAt).toLocaleDateString("ar-EG")}
            </span>
          )}
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
              border: "none", background: activeTab === t.key ? "var(--dash-primary)" : "transparent",
              color: activeTab === t.key ? "#fff" : "var(--dash-text-muted)",
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
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Row 1: Personal Info & Subscriptions (Top Cards) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                
                {/* Personal Info Card */}
                <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1.5px solid var(--dash-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--dash-text)" }}>
                    <UserRound size={18} style={{ color: "var(--dash-primary)" }} /> المعلومات الشخصية
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600", marginBottom: "4px" }}>الاسم</div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--dash-text)" }}>{patient.fullName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600", marginBottom: "4px" }}>العمر والجنس</div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--dash-text)" }}>
                        {patient.ageYears ? `${patient.ageYears} سنة` : "غير محدد"} • {patient.sex === "male" ? "ذكر" : patient.sex === "female" ? "أنثى" : "غير محدد"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600", marginBottom: "4px" }}>رقم الهاتف</div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--dash-text)" }} dir="ltr">{patient.phoneDisplay || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600", marginBottom: "4px" }}>البريد الإلكتروني</div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--dash-text)" }}>{patient.email || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Subscription & Plans Card */}
                <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1.5px solid var(--dash-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--dash-text)" }}>
                    <CreditCard size={18} style={{ color: "var(--dash-primary)" }} /> حالة الاشتراك والبرامج
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--dash-bg)", padding: "12px 16px", borderRadius: "12px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-muted)" }}>الاشتراك الحالي</span>
                      <span style={{ fontSize: "14px", fontWeight: "800", color: subscription ? "var(--dash-primary)" : "var(--dash-text-soft)" }}>
                        {subscription ? (subscription.package?.name || "باقة نشطة") : "لا يوجد اشتراك"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--dash-bg)", padding: "12px 16px", borderRadius: "12px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-muted)" }}>برنامج التغذية</span>
                      <span style={{ fontSize: "14px", fontWeight: "800", color: careProgram?.status === "active" ? "var(--dash-primary)" : "var(--dash-text-soft)" }}>
                        {careProgram ? "مفعل" : "يحتاج خطة"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Progress Stats & Health Conditions */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                
                {/* Weight Stats Summary */}
                <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1.5px solid var(--dash-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--dash-text)" }}>
                    <Activity size={18} style={{ color: "var(--dash-primary)" }} /> ملخص القياسات والزيارات
                  </h3>
                  
                  {weightStats ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div style={{ background: "var(--dash-bg)", padding: "16px", borderRadius: "14px", textAlign: "center" }}>
                          <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "700", marginBottom: "4px" }}>الوزن في أول زيارة</div>
                          <div style={{ fontSize: "20px", fontWeight: "900", color: "var(--dash-text)" }}>{weightStats.firstWeight} <span style={{ fontSize: "12px", fontWeight: "600" }}>كغ</span></div>
                          <div style={{ fontSize: "11px", color: "var(--dash-text-soft)", marginTop: "4px" }}>{new Date(weightStats.firstDate).toLocaleDateString("ar-EG")}</div>
                        </div>
                        <div style={{ background: "var(--dash-primary-soft)", padding: "16px", borderRadius: "14px", textAlign: "center", border: "1px solid var(--dash-primary)" }}>
                          <div style={{ fontSize: "12px", color: "var(--dash-primary)", fontWeight: "700", marginBottom: "4px" }}>الوزن الحالي</div>
                          <div style={{ fontSize: "20px", fontWeight: "900", color: "var(--dash-primary)" }}>{weightStats.currentWeight} <span style={{ fontSize: "12px", fontWeight: "600" }}>كغ</span></div>
                          <div style={{ fontSize: "11px", color: "var(--dash-primary)", opacity: 0.8, marginTop: "4px" }}>تحديث اليوم</div>
                        </div>
                      </div>
                      
                      {weightStats.diff > 0 && (
                        <div style={{ background: weightStats.isLoss ? "#d1fae5" : "#fef3c7", color: weightStats.isLoss ? "#065f46" : "#92400e", padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "800", fontSize: "14px" }}>
                          <TrendingDown size={18} style={{ transform: weightStats.isLoss ? "none" : "scaleY(-1)" }} />
                          <span>
                            تم {weightStats.isLoss ? "خسارة" : "زيادة"} {weightStats.diff.toFixed(1)} كغ {weightStats.durationText}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--dash-text-soft)" }}>
                      <Scale size={32} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
                      <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>لا توجد قياسات مسجلة بعد</p>
                    </div>
                  )}
                </div>

                {/* Health Conditions */}
                <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1.5px solid var(--dash-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--dash-text)" }}>
                    <HeartPulse size={18} style={{ color: "var(--dash-danger)" }} /> السجل الطبي والحالات الخاصة
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Diseases */}
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <ShieldAlert size={14} /> الأمراض المزمنة
                      </div>
                      {profile?.conditions?.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {profile.conditions.map(c => (
                            <span key={c.id} style={{ background: "#fee2e2", color: "#b91c1c", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "800" }}>{c.condition_code}</span>
                          ))}
                        </div>
                      ) : <span style={{ fontSize: "13px", color: "var(--dash-text-soft)", fontWeight: "600" }}>لا يوجد أمراض مسجلة</span>}
                    </div>

                    {/* Allergies / Disliked Foods */}
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Ban size={14} /> الحساسية والممنوعات
                      </div>
                      {profile?.allergies?.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {profile.allergies.map(a => (
                            <span key={a.id} style={{ background: "#ffedd5", color: "#c2410c", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "800" }}>{a.allergen}</span>
                          ))}
                        </div>
                      ) : <span style={{ fontSize: "13px", color: "var(--dash-text-soft)", fontWeight: "600" }}>لا يوجد حساسيات مسجلة</span>}
                    </div>

                    {/* Pregnancy */}
                    {profile?.pregnancyRecords?.length > 0 && (
                      <div style={{ background: "var(--dash-primary-soft)", color: "var(--dash-primary)", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "800" }}>
                        🤰 حالة خاصة: المريضة حامل
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Interactive Chart */}
              <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1.5px solid var(--dash-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", color: "var(--dash-text)", margin: 0 }}>
                    <TrendingDown size={18} style={{ color: "var(--dash-primary)" }} /> تطور الوزن وتكوين الجسم
                  </h3>
                </div>
                
                {chartData.length > 0 ? (
                  <div style={{ height: 300, width: "100%" }} dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--dash-primary)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--dash-primary)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dash-border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--dash-text-muted)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "var(--dash-text-muted)" }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow-md)', fontWeight: 700 }}
                          itemStyle={{ fontWeight: 800 }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 700 }} />
                        <Area type="monotone" name="الوزن (كغ)" dataKey="weight" stroke="var(--dash-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                        <Area type="monotone" name="الدهون (%)" dataKey="body_fat_percentage" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFat)" />
                        <Area type="monotone" name="العضلات (كغ)" dataKey="muscle_mass_kg" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMuscle)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--dash-text-soft)" }}>
                    <TrendingDown size={32} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
                    <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>تحتاج إلى قياسات متعددة لعرض التطور الزمني</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === "care" && (
            <div style={{ background: "var(--dash-card-bg)", borderRadius: "20px", border: "1.5px solid var(--dash-border)", padding: "24px" }}>
              <CarePrograms patientId={patientId} />
            </div>
          )}
          
          {activeTab === "progress" && (
            <div style={{ background: "var(--dash-card-bg)", borderRadius: "20px", border: "1.5px solid var(--dash-border)", padding: "24px" }}>
              <DoctorProgress patientId={patientId} />
            </div>
          )}
          
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