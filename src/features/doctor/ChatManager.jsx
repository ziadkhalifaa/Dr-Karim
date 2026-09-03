import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, Send, Paperclip, User } from "lucide-react";
import { chatApi } from "../../api/client";
import { formatTimeAgo } from "../../utils/date";

export default function ChatManager() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const loadSessions = async () => {
    try {
      const res = await chatApi.listSessions();
      setSessions(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const loadMessages = async (sid) => {
    try {
      const res = await chatApi.listMessages(sid);
      setMessages(res.data?.data || []);
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      // Refresh sessions to clear unread badge
      loadSessions();
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleSelectSession = (s) => {
    setActiveSession(s);
    loadMessages(s.id);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeSession) return;
    try {
      const res = await chatApi.doctorReply(activeSession.id, { content: text });
      setMessages((prev) => [...prev, res.data.data]);
      setText("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      loadSessions(); // Update last message time in list
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    }
  };

  if (loading) return <div className="dash-empty">Loading...</div>;

  return (
    <div className="dash-panel" style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
      <div className="dash-panel__head" style={{ borderBottom: "1px solid var(--dash-border)", padding: "16px 24px" }}>
        <h3 className="dash-panel__title">
          <MessageCircle /> Messages
        </h3>
      </div>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 300, borderRight: "1px solid var(--dash-border)", overflowY: "auto", background: "var(--bg-soft)" }}>
          {sessions.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--dash-text-soft)" }}>
              No active conversations.
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s)}
                style={{
                  padding: "16px",
                  borderBottom: "1px solid var(--dash-border)",
                  cursor: "pointer",
                  background: activeSession?.id === s.id ? "#fff" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dash-primary-faint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-primary)" }}>
                  <User size={20} />
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 14, color: "var(--dash-text)" }}>Patient #{s.patient_id}</strong>
                    <span style={{ fontSize: 11, color: "var(--dash-text-soft)" }}>
                      {s.last_message_at ? formatTimeAgo(s.last_message_at) : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--dash-text-muted)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.status === "active" ? "Active Session" : "Closed"}
                  </div>
                </div>
                {s.unread_doctor > 0 && (
                  <span className="dash-badge dash-badge--danger">{s.unread_doctor}</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8fafc" }}>
          {activeSession ? (
            <>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--dash-border)", background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--dash-primary-faint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-primary)" }}>
                  <User size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: 15 }}>Patient #{activeSession.patient_id}</strong>
                  <div style={{ fontSize: 12, color: "var(--dash-text-soft)" }}>Session started {new Date(activeSession.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--dash-text-soft)", margin: "auto" }}>
                    No messages yet.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isDoc = ["doctor", "staff"].includes(m.sender_role);
                    return (
                      <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isDoc ? "flex-end" : "flex-start" }}>
                        <div style={{
                          maxWidth: "70%",
                          padding: "10px 16px",
                          borderRadius: 16,
                          background: isDoc ? "var(--dash-primary)" : "#fff",
                          color: isDoc ? "#fff" : "var(--dash-text)",
                          border: isDoc ? "none" : "1px solid var(--dash-border)",
                          borderBottomRightRadius: isDoc ? 4 : 16,
                          borderBottomLeftRadius: !isDoc ? 4 : 16,
                        }}>
                          {m.content}
                          {m.attachment_url && (
                            <div style={{ marginTop: 8 }}>
                              <a href={m.attachment_url} target="_blank" rel="noreferrer" style={{ color: isDoc ? "#fff" : "var(--dash-primary)", textDecoration: "underline", display: "flex", alignItems: "center", gap: 4 }}>
                                <Paperclip size={14} /> Attachment
                              </a>
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--dash-text-soft)", marginTop: 4 }}>
                          {formatTimeAgo(m.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} style={{ padding: 16, background: "#fff", borderTop: "1px solid var(--dash-border)", display: "flex", gap: 12 }}>
                <input
                  type="text"
                  className="dash-input"
                  style={{ flex: 1 }}
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" className="dash-btn dash-btn--primary" disabled={!text.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--dash-text-soft)" }}>
              <MessageCircle size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
