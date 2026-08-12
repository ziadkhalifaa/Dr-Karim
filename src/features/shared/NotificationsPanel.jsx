import { useEffect, useState } from "react";
import { notificationApi } from "../../api/client";

export default function NotificationsPanel({ compact = false }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const load = async () => { try { setItems(await notificationApi.list() || []); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, []);
  const unread = items.filter((x) => !x.read_at && !x.readAt).length;
  const mark = async (id) => { await notificationApi.read(id); setItems((current) => current.map((x) => String(x.id) === String(id) ? { ...x, read_at: new Date().toISOString(), readAt: new Date().toISOString() } : x)); };
  return <section className="panel"><div className="panel-title"><h3>Notifications {unread > 0 && <span className="status">{unread}</span>}</h3>{unread > 0 && <button className="text-button" onClick={async () => { await notificationApi.readAll(); await load(); }}>Mark all read</button>}</div>{error && <p className="form-error">{error}</p>}{items.slice(0, compact ? 5 : undefined).map((item) => <button className="list-row notification-row" key={item.id} onClick={() => !item.read_at && mark(item.id)}><span><strong>{item.title}</strong><small className="muted">{item.message}</small></span><span className={`status ${item.read_at || item.readAt ? "" : "status-urgent"}`}>{item.read_at || item.readAt ? "Read" : "New"}</span></button>)}{!items.length && !error && <p className="muted">No notifications.</p>}</section>;
}
