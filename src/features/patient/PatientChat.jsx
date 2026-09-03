import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, Send, Paperclip } from "lucide-react";
import { chatApi } from "../../api/client";
import { formatTimeAgo } from "../../utils/date";

export default function PatientChat() {
  const { t } = useTranslation();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const loadChat = async () => {
    try {
      const res = await chatApi.session();
      setSession(res.data.data.session);
      setMessages(res.data.data.messages);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Failed to load chat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await chatApi.sendMessage({ content: text });
      setMessages((prev) => [...prev, res.data.data]);
      setText("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    }
  };

  if (loading) return <div className="dash-empty">Loading...</div>;

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <MessageCircle />
          Chat
        </span>
        <h2>Messages</h2>
        <p>Communicate directly with your doctor</p>
      </div>

      <div className="dash-panel" style={{ height: "600px", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", background: "#f8fafc" }}>
        <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--dash-text-soft)", margin: "auto" }}>
              <MessageCircle size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p>Send a message to start the conversation.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isPatient = m.sender_role === "patient";
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isPatient ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "10px 16px",
                    borderRadius: 16,
                    background: isPatient ? "var(--dash-primary)" : "#fff",
                    color: isPatient ? "#fff" : "var(--dash-text)",
                    border: isPatient ? "none" : "1px solid var(--dash-border)",
                    borderBottomRightRadius: isPatient ? 4 : 16,
                    borderBottomLeftRadius: !isPatient ? 4 : 16,
                  }}>
                    {m.content}
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
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="dash-btn dash-btn--primary" disabled={!text.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
