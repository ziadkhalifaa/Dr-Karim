import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { notificationApi } from "../../api/client";

export default function NotificationsPanel({ compact = false }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setItems((await notificationApi.list()) || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unread = items.filter((x) => !x.read_at && !x.readAt).length;
  const shown = compact ? items.slice(0, 5) : items;

  const mark = async (id) => {
    await notificationApi.read(id);
    setItems((current) =>
      current.map((x) =>
        String(x.id) === String(id)
          ? { ...x, read_at: new Date().toISOString(), readAt: new Date().toISOString() }
          : x
      )
    );
  };

  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <Bell />
          {t("dashboard.notifications.title")}
        </h3>
        {unread > 0 && (
          <button
            type="button"
            className="dash-btn dash-btn--ghost dash-btn--sm"
            onClick={async () => {
              await notificationApi.readAll();
              await load();
            }}
          >
            <CheckCheck />
            {t("dashboard.notifications.markAllRead")}
          </button>
        )}
      </div>

      {error && <p className="dash-form-error">{error}</p>}

      {shown.map((item) => {
        const isRead = Boolean(item.read_at || item.readAt);
        return (
          <button
            type="button"
            key={item.id}
            className="dash-notif"
            onClick={() => !isRead && mark(item.id)}
          >
            <span className="dash-notif__body">
              <strong>{item.title}</strong>
              <small>{item.message}</small>
              {(item.created_at || item.createdAt) && (
                <small className="dash-notif__time">
                  {new Date(item.created_at || item.createdAt).toLocaleString()}
                </small>
              )}
            </span>
            {isRead ? (
              <span className="dash-badge dash-badge--neutral">{t("dashboard.notifications.read")}</span>
            ) : (
              <span className="dash-notif__dot dash-notif__dot--new" aria-label={t("dashboard.notifications.new")} />
            )}
          </button>
        );
      })}

      {!items.length && !error && (
        <div className="dash-empty">
          <Inbox />
          <p>{t("dashboard.notifications.empty")}</p>
        </div>
      )}
    </section>
  );
}
