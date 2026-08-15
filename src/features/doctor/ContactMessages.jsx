/**
 * ContactMessages.jsx
 * Doctor-only dashboard panel showing submitted contact form messages.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Mail, Clock, CheckCircle2, Inbox, RefreshCw } from "lucide-react";
import { publicApi } from "../../api/client";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [markingRead, setMarkingRead] = useState(null);

  const load = () => {
    setLoading(true);
    publicApi.contacts("?limit=50")
      .then((data) => setMessages(data?.messages || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    setMarkingRead(id);
    try {
      await publicApi.markRead(id);
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isRead: true } : m));
      if (selected?.id === id) setSelected((s) => ({ ...s, isRead: true }));
    } catch (e) { console.error(e); }
    finally { setMarkingRead(null); }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <MessageCircle size={18} />
          رسائل التواصل
        </span>
        <h2>الرسائل الواردة</h2>
        <p>رسائل الزوار الذين تواصلوا عبر نموذج الاتصال في الموقع</p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div className="dash-stat" style={{ flex: "0 0 auto", minWidth: "160px" }}>
          <span className="dash-stat__icon"><Mail /></span>
          <div>
            <div className="dash-stat__value">{messages.length}</div>
            <div className="dash-stat__label">إجمالي الرسائل</div>
          </div>
        </div>
        <div className="dash-stat dash-stat--warning" style={{ flex: "0 0 auto", minWidth: "160px" }}>
          <span className="dash-stat__icon"><Clock /></span>
          <div>
            <div className="dash-stat__value">{unreadCount}</div>
            <div className="dash-stat__label">غير مقروءة</div>
          </div>
        </div>
        <div style={{ marginInlineStart: "auto" }}>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="btn btn-outline"
            onClick={load}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px" }}
          >
            <RefreshCw size={16} /> تحديث
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--line)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : messages.length === 0 ? (
        <div className="dash-empty">
          <Inbox />
          <p>لا توجد رسائل حالياً</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "24px" }}>
          {/* Messages List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                whileHover={{ y: -2 }}
                onClick={() => { setSelected(msg); if (!msg.isRead) markRead(msg.id); }}
                style={{
                  background: selected?.id === msg.id ? "var(--highlight-bg)" : "var(--card-bg)",
                  border: `1.5px solid ${selected?.id === msg.id ? "var(--primary)" : "var(--line)"}`,
                  borderRadius: "16px", padding: "20px 24px", cursor: "pointer",
                  transition: "all 0.2s ease", position: "relative",
                  opacity: msg.isRead ? 0.75 : 1,
                }}
              >
                {!msg.isRead && (
                  <div style={{ position: "absolute", top: "20px", insetInlineEnd: "20px", width: "10px", height: "10px", borderRadius: "50%", background: "var(--primary)" }} />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--highlight-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-deep)", fontWeight: "900", fontSize: "18px" }}>
                    {msg.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p style={{ fontWeight: "800", fontSize: "16px", color: "var(--text)", margin: 0 }}>{msg.name}</p>
                    {msg.email && <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>{msg.email}</p>}
                  </div>
                </div>
                <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {msg.message}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-soft)", marginTop: "10px", fontWeight: "700" }}>{timeAgo(msg.createdAt)}</p>
              </motion.div>
            ))}
          </div>

          {/* Message Detail */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ background: "var(--card-bg)", border: "1.5px solid var(--line)", borderRadius: "20px", padding: "32px", position: "sticky", top: "20px", alignSelf: "start" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--highlight-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-deep)", fontWeight: "900", fontSize: "22px" }}>
                      {selected.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p style={{ fontWeight: "900", fontSize: "18px", color: "var(--text)", margin: 0 }}>{selected.name}</p>
                      {selected.email && (
                        <a href={`mailto:${selected.email}`} style={{ fontSize: "14px", color: "var(--primary)", fontWeight: "700" }}>{selected.email}</a>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--text-muted)" }}>✕</button>
                </div>

                <div style={{ background: "var(--bg-soft)", borderRadius: "14px", padding: "20px 24px", marginBottom: "20px" }}>
                  <p style={{ fontSize: "16px", lineHeight: 1.8, color: "var(--text)", fontWeight: 500, margin: 0 }}>{selected.message}</p>
                </div>

                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "20px" }}>
                  {timeAgo(selected.createdAt)} • {selected.isRead ? "✓ تم القراءة" : "جديدة"}
                </p>

                <div style={{ display: "flex", gap: "12px" }}>
                  {selected.email && (
                    <a href={`mailto:${selected.email}`} className="btn btn-primary" style={{ flex: 1, padding: "14px", borderRadius: "12px", textAlign: "center" }}>
                      <Mail size={16} /> الرد بالبريد
                    </a>
                  )}
                  {!selected.isRead && (
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => markRead(selected.id)}
                      disabled={markingRead === selected.id}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: "14px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                      <CheckCircle2 size={16} /> تحديد كمقروءة
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
