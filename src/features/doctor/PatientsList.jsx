import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Users, Search, ChevronLeft, ChevronRight, Inbox, Clock, Phone, AlertCircle, Calendar } from "lucide-react";
import { patientApi } from "../../api/client";
import { navigate } from "../../lib/router";

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

export default function PatientsList() {
  const { t } = useTranslation();
  const [data, setData] = useState({ items: [], pagination: { total: 0, page: 1, limit: 25, pages: 1 } });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setBusy(true);
    setError("");
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("limit", "12"); // Use smaller limit for card grid
    params.set("page", String(page));
    params.set("sort", sort);
    if (status !== "all") params.set("status", status);
    
    try {
      setData(await patientApi.list(`?${params.toString()}`));
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort, page]);

  const search = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const { items, pagination } = data;
  const last = pagination.pages || 1;

  const FILTERS = [
    { key: "all", label: "جميع المرضى" },
    { key: "active", label: "نشط" },
    { key: "pending_payment", label: "في انتظار الدفع" },
    { key: "inactive", label: "غير نشط" },
  ];

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <Users />
          {t("doctorPatients.title", "المرضى")}
        </span>
        <h2>{t("doctorPatients.title", "قائمة المرضى")}</h2>
        <p style={{ color: "var(--dash-text-muted)", fontSize: "15px", marginTop: "6px" }}>
          إدارة ملفات المرضى، متابعة حالتهم، واستعراض برامج الرعاية الخاصة بهم
        </p>
      </div>

      {/* Filters & Search */}
      <div style={{ background: "var(--dash-card-bg)", borderRadius: "16px", padding: "16px", border: "1.5px solid var(--dash-border)", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Status Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatus(f.key); setPage(1); }}
              style={{
                padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: "700",
                border: "1.5px solid " + (status === f.key ? "var(--dash-primary)" : "var(--dash-border)"),
                background: status === f.key ? "var(--dash-primary-soft)" : "transparent",
                color: status === f.key ? "var(--dash-primary)" : "var(--dash-text-muted)",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
          <form onSubmit={search} style={{ position: "relative", minWidth: "240px" }}>
            <Search size={16} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--dash-text-soft)" }} />
            <input
              className="dash-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("doctorPatients.searchPlaceholder", "ابحث بالاسم أو رقم الهاتف...")}
              style={{ paddingRight: "40px", borderRadius: "12px", width: "100%", border: "1.5px solid var(--dash-border)" }}
            />
          </form>
          <select
            className="dash-select"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            style={{ borderRadius: "12px", minWidth: "140px", border: "1.5px solid var(--dash-border)", fontWeight: "600" }}
          >
            <option value="recent">{t("doctorPatients.sortRecent", "الأحدث أولاً")}</option>
            <option value="name">{t("doctorPatients.sortName", "أبجدياً (أ-ي)")}</option>
            <option value="oldest">{t("doctorPatients.sortOldest", "الأقدم أولاً")}</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", color: "#ef4444", fontWeight: "700" }}>
          {error}
        </div>
      )}

      {/* Grid */}
      {busy && items.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--dash-border)", borderTopColor: "var(--dash-primary)" }} />
        </div>
      ) : items.length === 0 ? (
        <div className="dash-panel" style={{ textAlign: "center", padding: "80px 20px" }}>
          <Inbox size={48} style={{ color: "var(--dash-text-soft)", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--dash-text)", marginBottom: "8px" }}>لا يوجد مرضى</h3>
          <p style={{ color: "var(--dash-text-muted)", fontWeight: "600" }}>لم يتم العثور على أي مرضى يطابقون بحثك.</p>
        </div>
      ) : (
        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}
        >
          {items.map((p) => (
            <motion.div
              key={p.id}
              variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
              whileHover={{ y: -4, boxShadow: "var(--dash-shadow-lg)" }}
              onClick={() => navigate(`/doctor/patients/${p.id}`)}
              style={{
                background: "var(--dash-card-bg)", border: "1.5px solid " + (p.hasPendingPayment ? "#fcd34d" : "var(--dash-border)"),
                borderRadius: "20px", padding: "24px", cursor: "pointer", position: "relative",
                boxShadow: "var(--dash-shadow-sm)", transition: "all 0.2s ease"
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "16px", background: "var(--dash-primary-soft)",
                    color: "var(--dash-primary)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", fontWeight: "900", flexShrink: 0
                  }}>
                    {p.fullName ? p.fullName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--dash-text)", margin: "0 0 4px" }}>
                      {p.fullName || "مريض #" + p.id}
                    </h3>
                    <StatusPill status={p.status} />
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ display: "grid", gap: "12px", borderTop: "1px solid var(--dash-border)", paddingTop: "16px", marginBottom: "20px" }}>
                {p.phoneDisplay && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--dash-text-muted)", fontSize: "13.5px", fontWeight: "600" }}>
                    <Phone size={16} style={{ color: "var(--dash-text-soft)" }} />
                    <span dir="ltr">{p.phoneDisplay}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--dash-text-muted)", fontSize: "13.5px", fontWeight: "600" }}>
                  <Calendar size={16} style={{ color: "var(--dash-text-soft)" }} />
                  <span>انضم: {p.createdAt ? new Date(p.createdAt).toLocaleDateString("ar-EG") : "—"}</span>
                </div>
              </div>

              {/* Footer Subscription Status */}
              <div style={{ background: "var(--dash-bg)", padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--dash-text-muted)" }}>الاشتراك</span>
                <span style={{
                  fontSize: "13px", fontWeight: "800",
                  color: p.subscriptionStatus === "active" ? "var(--dash-primary)" : "var(--dash-text-soft)"
                }}>
                  {p.subscriptionStatus === "active" ? "✅ نشط" : "غير مشترك"}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "32px" }}>
          <button
            disabled={page <= 1}
            onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
            style={{ padding: "10px 16px", borderRadius: "12px", border: "1.5px solid var(--dash-border)", background: "var(--dash-card-bg)", color: "var(--dash-text)", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}
          >
            <ChevronRight size={18} /> السابق
          </button>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-muted)" }}>
            صفحة {page} من {last}
          </span>
          <button
            disabled={page >= last}
            onClick={() => { setPage((p) => Math.min(last, p + 1)); }}
            style={{ padding: "10px 16px", borderRadius: "12px", border: "1.5px solid var(--dash-border)", background: "var(--dash-card-bg)", color: "var(--dash-text)", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: page >= last ? "not-allowed" : "pointer", opacity: page >= last ? 0.5 : 1 }}
          >
            التالي <ChevronLeft size={18} />
          </button>
        </div>
      )}
    </>
  );
}