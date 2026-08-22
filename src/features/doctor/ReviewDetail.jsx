import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UserRound,
  Phone,
  ClipboardList,
  Activity,
  CheckCircle2,
  XCircle,
  History,
  ShieldAlert,
  Inbox,
  ListChecks,
} from "lucide-react";
import { reviewApi } from "../../api/client";
import { navigate } from "../../lib/router";
import StatusBadge from "../shared/StatusBadge";
import { QUESTIONS_RAW } from "../assessment/data/questions";
import { SECTIONS } from "../assessment/data/sections";

const RELATIONSHIP_LABELS = {
  self: "نفس الشخص",
  parent: "ولي أمر",
  grandparent: "جد/جدة",
  legal_guardian: "وصي قانوني",
  spouse: "الزوج/الزوجة",
  caregiver: "مقدم رعاية",
  other: "أخرى",
};

const PREFERENCE_LABELS = {
  whatsapp: "واتساب",
  phone: "اتصال هاتفي",
  email: "بريد إلكتروني",
};

const SEX_LABELS = { male: "ذكر", female: "أنثى" };

const TIER_LABELS = {
  urgent: "عاجل",
  notice: "يستدعي انتباه",
  standard: "عادي",
};

function formatValue(q, value) {
  if (value == null || value === "") return "—";
  const list = Array.isArray(value) ? value : [value];
  if (q?.options) {
    return list
      .map((v) => q.options.find((o) => o.value === v)?.ar || String(v))
      .join("، ");
  }
  return list.join("، ");
}

function Card({ title, icon: Icon, iconColor = "var(--dash-primary)", children }) {
  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1.5px solid var(--dash-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
      <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--dash-text)" }}>
        <Icon size={18} style={{ color: iconColor }} /> {title}
      </h3>
      {children}
    </div>
  );
}

function Info({ label, value, ltr = false }) {
  return (
    <div>
      <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--dash-text)" }} dir={ltr ? "ltr" : undefined}>
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function ReviewDetail({ reviewId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = async () => {
    try {
      setData(await reviewApi.get(reviewId));
      setError("");
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  const run = async (fn) => {
    setBusy(true);
    setActionError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const answerMap = useMemo(() => {
    const map = {};
    for (const a of data?.assessment?.answers || []) {
      map[a.question_code] = a.stored_array_json ?? a.stored_value;
    }
    return map;
  }, [data]);

  if (error && !data)
    return (
      <div className="dash-panel" style={{ padding: "40px 20px", textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontWeight: "700" }}>{error}</p>
        <button onClick={() => navigate("/doctor/reviews")} className="dash-btn dash-btn--ghost" style={{ marginTop: "16px" }}>
          العودة لقائمة المراجعات
        </button>
      </div>
    );

  if (!data)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--dash-border)", borderTopColor: "var(--dash-primary)" }}
        />
      </div>
    );

  const { review, contact, assessment, derived, events } = data;
  const session = assessment?.session;
  const identity = data.patientIdentity || {};
  const flags = assessment?.flags || [];

  const displayName = identity.full_name || session?.patient_name || contact?.patientName || session?.reference_number;
  const ageText = identity.age_years != null ? `${identity.age_years} سنة` : session?.patient_age_years != null ? `${session.patient_age_years} سنة` : "غير محدد";

  const statusActions = [];
  if (review.status === "queued")
    statusActions.push(
      <button key="assign" className="dash-btn dash-btn--ghost dash-btn--sm" disabled={busy} onClick={() => run(() => reviewApi.assign(review.id, {}))}>
        تعيين لي
      </button>
    );
  if (review.status === "assigned")
    statusActions.push(
      <button key="open" className="dash-btn dash-btn--primary dash-btn--sm" disabled={busy} onClick={() => run(() => reviewApi.open(review.id))}>
        بدء المراجعة
      </button>
    );
  if (review.status === "in_review") {
    statusActions.push(
      <button key="approve" className="dash-btn dash-btn--primary dash-btn--sm" disabled={busy} onClick={() => run(() => reviewApi.approve(review.id, {}))}>
        <CheckCircle2 size={14} /> اعتماد وإنشاء ملف المريض
      </button>
    );
    statusActions.push(
      <button
        key="reject"
        className="dash-btn dash-btn--danger dash-btn--sm"
        disabled={busy}
        onClick={() => {
          const reason = window.prompt("سبب الرفض:", "يحتاج متابعة سريرية");
          if (reason) run(() => reviewApi.reject(review.id, { reason }));
        }}
      >
        <XCircle size={14} /> رفض
      </button>
    );
  }

  return (
    <>
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <button
            onClick={() => navigate("/doctor/reviews")}
            style={{ background: "transparent", border: "none", color: "var(--dash-text-muted)", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "0", marginBottom: "16px", fontFamily: "inherit" }}
          >
            <ArrowLeft size={16} /> العودة لقائمة المراجعات
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ width: 64, height: 64, borderRadius: "20px", background: "var(--dash-primary-soft)", color: "var(--dash-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "900", flexShrink: 0 }}>
              {displayName ? displayName.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <h2 style={{ fontSize: "28px", fontWeight: "900", color: "var(--dash-text)", margin: "0 0 6px", lineHeight: "1" }}>{displayName}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--dash-text-muted)", fontSize: "14px", fontWeight: "600", flexWrap: "wrap" }}>
                <span dir="ltr">{session?.reference_number}</span>
                <StatusBadge status={review.status} />
                <span className={`dash-badge ${derived?.overallTier === "urgent" ? "dash-badge--danger" : "dash-badge--neutral"}`}>
                  {TIER_LABELS[derived?.overallTier] || derived?.overallTier || "عادي"}
                </span>
                {session?.submitted_at && <span>أُرسل في {new Date(session.submitted_at).toLocaleString("ar-EG")}</span>}
              </div>
            </div>
          </div>
        </div>
        {statusActions.length > 0 && <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>{statusActions}</div>}
      </div>

      {actionError && (
        <p role="alert" style={{ margin: "0 0 18px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "11px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 700 }}>
          {actionError}
        </p>
      )}

      {/* Row 1: identity + contact */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        <Card title="البيانات الأساسية للمريض" icon={UserRound}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Info label="الاسم" value={identity.full_name || session?.patient_name} />
            <Info label="العمر" value={ageText} />
            <Info label="النوع" value={SEX_LABELS[identity.sex || session?.patient_sex] || "غير محدد"} />
            <Info label="مؤشر كتلة الجسم (BMI)" value={session?.derived_bmi ?? "—"} />
            <Info label="الطول (سم)" value={answerMap.Q02_01 ?? "—"} />
            <Info label="الوزن الحالي (كجم)" value={answerMap.Q02_02 ?? "—"} />
            <Info label="الوزن المستهدف (كجم)" value={answerMap.Q02_06 ?? "—"} />
            <Info label="تاريخ الميلاد" value={identity.dob ? new Date(identity.dob).toLocaleDateString("ar-EG") : "—"} />
          </div>
        </Card>

        <Card title="بيانات التواصل" icon={Phone}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Info label="اسم مساعد التواصل" value={contact?.patientName} />
            <Info label="رقم الواتساب" value={contact?.handoffPhone} ltr />
            <Info label="رقم المريض" value={contact?.patientPhone} ltr />
            <Info label="البريد الإلكتروني" value={contact?.email} ltr />
            <Info label="وسيلة التواصل المفضلة" value={PREFERENCE_LABELS[contact?.preference] || contact?.preference || "—"} />
            <Info label="أفضل وقت للتواصل" value={contact?.bestTime || "—"} />
            <Info label="صفة المسجل" value={RELATIONSHIP_LABELS[contact?.relationship] || contact?.relationship || "نفس الشخص"} />
            <Info label="موافق على التواصل" value={contact?.consentContact ? "نعم" : "لا"} />
          </div>
        </Card>
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <Card title={`تنبيهات التقييم (${flags.length})`} icon={ShieldAlert} iconColor="var(--dash-danger)">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {flags.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "700",
                    background: f.tier === "urgent" ? "#fee2e2" : "#fef9c3",
                    color: f.tier === "urgent" ? "#991b1b" : "#854d0e",
                  }}
                >
                  <AlertTriangleIcon tier={f.tier} />
                  <span style={{ flex: 1 }}>{f.message_ar || f.message_en || f.rule_id}</span>
                  <span className={`dash-badge ${f.tier === "urgent" ? "dash-badge--danger" : "dash-badge--neutral"}`}>{TIER_LABELS[f.tier] || f.tier}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Answers by section */}
      <Card title="إجابات الاستمارة الغذائية" icon={ClipboardList}>
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {SECTIONS.map((section) => {
            const qs = QUESTIONS_RAW.filter((q) => q.section === section.no && answerMap[q.id] !== undefined);
            if (!qs.length) return null;
            return (
              <div key={section.no}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ background: "var(--dash-primary-soft)", color: "var(--dash-primary)", fontWeight: "900", fontSize: "12px", borderRadius: "999px", padding: "4px 12px" }}>
                    الخطوة {section.no}
                  </span>
                  <strong style={{ fontSize: "15px", color: "var(--dash-text)" }}>{section.titleAr}</strong>
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <tbody>
                      {qs.map((q) => (
                        <tr key={q.id}>
                          <td style={{ width: "45%", color: "var(--dash-text-muted)", fontWeight: "700" }}>{q.labelAr}</td>
                          <td style={{ fontWeight: "800" }}>{formatValue(q, answerMap[q.id])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          {!Object.keys(answerMap).length && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--dash-text-soft)" }}>
              <Inbox size={32} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
              <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>لا توجد إجابات مسجلة</p>
            </div>
          )}
        </div>
      </Card>

      {/* Timeline */}
      <div style={{ marginTop: "20px" }}>
        <Card title="سجل حالة المراجعة" icon={History}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(events || []).map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--dash-bg)", borderRadius: "12px", fontSize: "13.5px", fontWeight: "600", color: "var(--dash-text-muted)", flexWrap: "wrap" }}>
                <ListChecks size={15} />
                <span>{e.from_status ? `${e.from_status} → ` : ""}{e.to_status}</span>
                <span>· بواسطة {e.actor_type === "system" ? "النظام" : e.actor_type}</span>
                {e.note && <span style={{ color: "var(--dash-text-soft)" }}>· {e.note}</span>}
                <span style={{ marginInlineStart: "auto", fontSize: "12px" }} dir="ltr">{new Date(e.created_at).toLocaleString("ar-EG")}</span>
              </div>
            ))}
            {!events?.length && <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "var(--dash-text-soft)" }}>لا توجد أحداث</p>}
          </div>
        </Card>
      </div>

      {/* Derived summary */}
      <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--dash-bg)", borderRadius: "12px", padding: "10px 16px", fontSize: "13.5px", fontWeight: "800", color: "var(--dash-text)" }}>
          <Activity size={15} /> BMI: {session?.derived_bmi ?? "—"}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--dash-bg)", borderRadius: "12px", padding: "10px 16px", fontSize: "13.5px", fontWeight: "800", color: "var(--dash-text)" }}>
          عدد التنبيهات: {flags.length}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--dash-bg)", borderRadius: "12px", padding: "10px 16px", fontSize: "13.5px", fontWeight: "800", color: "var(--dash-text)" }}>
          لغة الاستمارة: {session?.language === "en" ? "English" : "العربية"}
        </span>
      </div>
    </>
  );
}

function AlertTriangleIcon({ tier }) {
  const color = tier === "urgent" ? "#dc2626" : "#ca8a04";
  return <ShieldAlert size={16} style={{ color, flexShrink: 0 }} />;
}
