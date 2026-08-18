import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Video, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { slotApi, paymentApi, appointmentApi } from "../../api/client";
import { useAuth } from "../../context/AuthProvider";

const UNIT_PERIOD_LABEL = { week: "أسبوع", month: "شهر" };

export default function BookSlotPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState("");
  const [booked, setBooked] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, ents] = await Promise.all([
        slotApi.list(),
        paymentApi.entitlements().catch(() => null),
      ]);
      setSlots(rows || []);
      setQuota(ents?.liveQuota || null);
      const list = await appointmentApi.patientList(user.patientId).catch(() => []);
      setBooked((list || []).filter((a) => ["pending", "confirmed"].includes(a.status)));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.patientId]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const book = async (id) => {
    setBusy(id);
    setNotice("");
    try {
      await slotApi.book(id, {});
      await load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(null);
    }
  };

  const quotaReached = quota?.entitled && quota.limit != null && quota.remaining <= 0;
  const showQuota = quota?.entitled && quota.limit != null;

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <CalendarDays />
          حجز موعد مباشر
        </span>
        <h2>احجز جلسة مباشرة مع الدكتور</h2>
        <p>اختر موعدًا متاحًا وسيتم تأكيده فورًا. حجزك مرتبط بباقتك ولا يشغله مريض آخر.</p>
      </div>

      {notice && (
        <p role="alert" style={{ marginBottom: 18, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "11px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={15} />
          <span style={{ flex: 1 }}>{notice}</span>
          <button onClick={() => setNotice("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }} aria-label="close">×</button>
        </p>
      )}

      {showQuota && (
        <section className="dash-panel" style={{ marginBottom: 20, borderInlineStart: "4px solid var(--dash-primary)" }}>
          <div className="dash-panel__body" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Clock size={18} style={{ color: "var(--dash-primary)" }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 800 }}>حصتك من الحجوزات:</span>{" "}
              <span className={quotaReached ? "dash-badge dash-badge--danger" : "dash-badge dash-badge--success"}>
                {quota.used} / {quota.limit} {quota.periodUnit ? `في ال${UNIT_PERIOD_LABEL[quota.periodUnit] || quota.periodUnit}` : "إجمالاً"}
              </span>
            </div>
            {quotaReached && <span style={{ color: "var(--dash-danger)", fontSize: 13, fontWeight: 700 }}>تم استهلاك حصتك في هذه الفترة</span>}
          </div>
        </section>
      )}

      {booked.length > 0 && (
        <section className="dash-panel" style={{ marginBottom: 20 }}>
          <div className="dash-panel__head">
            <h3 className="dash-panel__title">
              <CheckCircle2 />
              حجوزاتي الحالية
            </h3>
          </div>
          <div className="dash-panel__body">
            <div className="dash-list">
              {booked.map((a) => (
                <li key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span>{new Date(a.scheduled_start_at).toLocaleString()}</span>
                  <span className="dash-badge dash-badge--info">{a.status}</span>
                </li>
              ))}
            </div>
          </div>
        </section>
      )}

      {!quota?.entitled && (
        <section className="dash-panel" style={{ marginBottom: 20, background: "rgba(245,158,11,0.08)", border: "1px solid var(--dash-line)" }}>
          <div className="dash-panel__body" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Video size={18} style={{ color: "var(--dash-warning)" }} />
            <span style={{ flex: 1 }}>
              {quota ? "جلسات البث المباشر غير مشمولة في باقتك الحالية." : "اشترك في باقة تتضمن جلسات مباشرة لحجز موعد مع الدكتور."}
            </span>
          </div>
        </section>
      )}

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <CalendarDays />
            المواعيد المتاحة
          </h3>
          <span className="dash-badge dash-badge--primary">{slots.length}</span>
        </div>
        <div className="dash-panel__body">
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--dash-text-muted)" }}>جارٍ تحميل المواعيد...</div>
          ) : slots.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
              {slots.map((s) => (
                <div
                  key={s.id}
                  className="dash-panel"
                  style={{ padding: 0, border: "1px solid var(--dash-line)", borderRadius: 14 }}
                >
                  <div className="dash-panel__body">
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                      {new Date(s.startsAt).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                    <div style={{ color: "var(--dash-text-muted)", fontSize: 13.5, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={14} />
                      {new Date(s.startsAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      {" — "}
                      {new Date(s.endsAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      {s.durationMin ? ` (${s.durationMin} د)` : ""}
                    </div>
                    <button
                      className="dash-btn dash-btn--primary"
                      style={{ width: "100%" }}
                      disabled={busy === s.id || quotaReached || !quota?.entitled}
                      onClick={() => book(s.id)}
                    >
                      <Video size={15} /> {busy === s.id ? "جارٍ الحجز..." : "احجز الآن"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-empty">
              <p>لا توجد مواعيد متاحة حاليًا. سيقوم الدكتور بإضافة مواعيد جديدة قريبًا.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}