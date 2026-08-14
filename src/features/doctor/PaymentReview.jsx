import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, CheckCircle2, XCircle, Inbox, Image, Clock, User, CreditCard } from "lucide-react";
import { paymentApi } from "../../api/client";

const METHOD_ICONS = {
  vodafone_cash: "📱",
  instapay: "🏦",
};

const STATUS_STYLES = {
  pending: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d", dot: "#f59e0b", label: "في الانتظار" },
  approved: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dot: "#10b981", label: "مقبول" },
  rejected: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dot: "#ef4444", label: "مرفوض" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
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

function RejectModal({ payment, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--dash-card-bg)", borderRadius: "20px", padding: "32px", maxWidth: "480px", width: "100%", boxShadow: "var(--dash-shadow-lg)" }}
      >
        <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--dash-text)", marginBottom: "8px" }}>رفض الدفع</h3>
        <p style={{ color: "var(--dash-text-muted)", fontSize: "14px", marginBottom: "20px" }}>
          سيتم إخطار المريض {payment?.patient?.full_name || ""} بسبب الرفض.
        </p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="اكتب سبب الرفض..."
          rows={4}
          style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid var(--dash-border)", background: "var(--dash-bg)", color: "var(--dash-text)", fontSize: "14px", fontFamily: "inherit", resize: "vertical", outline: "none" }}
        />
        <div style={{ display: "flex", gap: "12px", marginTop: "20px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid var(--dash-border)", background: "transparent", color: "var(--dash-text-muted)", cursor: "pointer", fontFamily: "inherit", fontWeight: "700" }}>
            إلغاء
          </button>
          <button
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
            style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: reason.trim() ? "#ef4444" : "#94a3b8", color: "#fff", cursor: reason.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <XCircle size={16} /> تأكيد الرفض
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PaymentReview() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      setRows((await paymentApi.doctorList()) || []);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (row) => {
    setBusy(row.id);
    try {
      await paymentApi.approve(row.id);
      await load();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(null);
    }
  };

  const rejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setBusy(rejectTarget.id);
    setRejectTarget(null);
    try {
      await paymentApi.reject(rejectTarget.id, reason);
      await load();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(null);
    }
  };

  const pending = rows.filter((r) => r.status === "pending");
  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const FILTERS = [
    { key: "all", label: "الكل", count: rows.length },
    { key: "pending", label: "في الانتظار", count: pending.length },
    { key: "approved", label: "مقبول", count: rows.filter((r) => r.status === "approved").length },
    { key: "rejected", label: "مرفوض", count: rows.filter((r) => r.status === "rejected").length },
  ];

  return (
    <>
      {/* Header */}
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <Wallet />
          {t("dashboard.payments.title", "المدفوعات")}
        </span>
        <h2>{t("dashboard.payments.title", "مراجعة المدفوعات")}</h2>
        <p style={{ color: "var(--dash-text-muted)", fontSize: "15px", marginTop: "6px" }}>
          راجع طلبات الدفع ووافق عليها أو ارفضها لتفعيل الاشتراكات
        </p>
      </div>

      {/* Pending alert banner */}
      {pending.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "1.5px solid #fcd34d", borderRadius: "16px", padding: "18px 24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "14px" }}
        >
          <Clock size={22} style={{ color: "#92400e", flexShrink: 0 }} />
          <div>
            <strong style={{ color: "#92400e", fontSize: "15px" }}>{pending.length} طلب دفع في الانتظار</strong>
            <p style={{ color: "#b45309", fontSize: "13px", marginTop: "2px" }}>هؤلاء المرضى ينتظرون موافقتك لبدء برامجهم</p>
          </div>
        </motion.div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "8px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: "700",
              border: "1.5px solid " + (filter === f.key ? "var(--dash-primary)" : "var(--dash-border)"),
              background: filter === f.key ? "var(--dash-primary-soft)" : "var(--dash-card-bg)",
              color: filter === f.key ? "var(--dash-primary)" : "var(--dash-text-muted)",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            {f.label}
            <span style={{
              background: filter === f.key ? "var(--dash-primary)" : "var(--dash-bg)",
              color: filter === f.key ? "#fff" : "var(--dash-text-muted)",
              borderRadius: "999px", padding: "1px 8px", fontSize: "12px", fontWeight: "800",
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {message && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", color: "#ef4444", fontWeight: "700" }}>
          {message}
        </div>
      )}

      {/* Payments Cards */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--dash-border)", borderTopColor: "var(--dash-primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="dash-panel" style={{ textAlign: "center", padding: "60px 20px" }}>
          <Inbox size={40} style={{ color: "var(--dash-text-soft)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--dash-text-muted)", fontWeight: "600" }}>لا توجد مدفوعات</p>
        </div>
      ) : (
        <motion.div style={{ display: "grid", gap: "16px" }}
          initial="hidden" animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
        >
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              style={{
                background: "var(--dash-card-bg)", border: "1.5px solid " + (p.status === "pending" ? "#fcd34d" : "var(--dash-border)"),
                borderRadius: "16px", padding: "20px 24px", display: "grid",
                gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "center",
                boxShadow: p.status === "pending" ? "0 4px 16px rgba(245,158,11,0.1)" : "var(--dash-shadow-sm)",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", alignItems: "center" }}>
                {/* Patient */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dash-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={18} style={{ color: "var(--dash-primary)" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: "800", fontSize: "14px", color: "var(--dash-text)" }}>
                      {p.patient?.full_name || p.patientName || "مريض #" + p.patient_id}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>
                      {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString("ar-EG") : "—"}
                    </div>
                  </div>
                </div>

                {/* Package & Amount */}
                <div>
                  <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--dash-text)" }}>{p.package?.name || "باقة #" + p.package_id}</div>
                  <div style={{ fontSize: "15px", fontWeight: "900", color: "var(--dash-primary)", marginTop: "2px" }}>
                    {Number(p.amount).toLocaleString("ar-EG")} {p.currency}
                  </div>
                </div>

                {/* Method */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{METHOD_ICONS[p.method] || "💳"}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text)" }}>
                      {p.method === "vodafone_cash" ? "فودافون كاش" : p.method === "instapay" ? "إنستاباي" : p.method}
                    </div>
                    {p.sender_phone && <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", direction: "ltr" }}>{p.sender_phone}</div>}
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <div style={{ fontSize: "12px", color: "var(--dash-text-muted)", marginBottom: "2px" }}>رقم العملية</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--dash-text)", direction: "ltr" }}>{p.transaction_reference || "—"}</div>
                </div>

                {/* Receipt */}
                {p.receipts?.length > 0 && (
                  <div>
                    <a
                      href={`/api/v1/payments/${p.id}/receipt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", color: "var(--dash-info)", textDecoration: "none" }}
                    >
                      <Image size={14} /> عرض الإيصال
                    </a>
                  </div>
                )}

                {/* Status */}
                <div><StatusPill status={p.status} /></div>
              </div>

              {/* Actions */}
              {p.status === "pending" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "140px" }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={busy === p.id}
                    onClick={() => approve(p)}
                    style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "var(--dash-primary)", color: "#fff", fontWeight: "800", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: busy === p.id ? 0.6 : 1 }}
                  >
                    <CheckCircle2 size={15} />
                    {busy === p.id ? "جاري..." : t("dashboard.payments.approve", "قبول")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={busy === p.id}
                    onClick={() => setRejectTarget(p)}
                    style={{ padding: "10px 16px", borderRadius: "10px", border: "1.5px solid #fca5a5", background: "transparent", color: "#ef4444", fontWeight: "800", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <XCircle size={15} />
                    {t("dashboard.payments.reject", "رفض")}
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            payment={rejectTarget}
            onConfirm={rejectConfirm}
            onClose={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
