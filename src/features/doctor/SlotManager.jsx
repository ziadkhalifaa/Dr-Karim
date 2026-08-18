import { useState, useEffect } from "react";
import { Plus, Trash, CalendarDays, AlertTriangle } from "lucide-react";
import { slotApi } from "../../api/client";

const STATUS_LABEL = { open: "متاح", booked: "محجوز", cancelled: "ملغي" };
const UNIT_LABEL = { none: "مرة واحدة", weekly: "كل أسبوع", biweekly: "كل أسبوعين" };

export default function SlotManager() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    startsAt: "",
    durationMin: 30,
    repeatUnit: "biweekly",
    repeatCount: 4,
  });

  const load = async () => {
    setLoading(true);
    try {
      const rows = await slotApi.list(`?from=${new Date(Date.now() - 3600000).toISOString()}`);
      setSlots(rows || []);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await slotApi.create({
        startsAt: new Date(form.startsAt).toISOString(),
        durationMin: Number(form.durationMin),
        repeatUnit: form.repeatUnit,
        repeatCount: Number(form.repeatCount),
      });
      setForm({ ...form, startsAt: "" });
      await load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm("إلغاء هذا الموعد المتاح؟ سيلغي الحجز المرتبط إن وجد.")) return;
    setBusy(id);
    setNotice("");
    try {
      await slotApi.cancel(id);
      await load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="dash-panel" style={{ marginBottom: "24px" }}>
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <CalendarDays />
          مواعيد الحجز الإضافية
        </h3>
      </div>
      <div className="dash-panel__body">
        {notice && (
          <p role="alert" style={{ marginBottom: 14, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "11px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={15} />
            <span style={{ flex: 1 }}>{notice}</span>
            <button onClick={() => setNotice("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }} aria-label="close">×</button>
          </p>
        )}

        <form
          onSubmit={create}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px", alignItems: "end", marginBottom: "22px" }}
        >
          <label className="dash-field">
            <span>تاريخ ووقت البداية</span>
            <input
              required
              type="datetime-local"
              className="dash-input"
              style={{ direction: "ltr" }}
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </label>
          <label className="dash-field">
            <span>المدة (دقيقة)</span>
            <input
              required
              type="number"
              min="10"
              max="180"
              step="5"
              className="dash-input"
              value={form.durationMin}
              onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
            />
          </label>
          <label className="dash-field">
            <span>التكرار</span>
            <select className="dash-input" value={form.repeatUnit} onChange={(e) => setForm({ ...form, repeatUnit: e.target.value })}>
              <option value="none">{UNIT_LABEL.none}</option>
              <option value="weekly">{UNIT_LABEL.weekly}</option>
              <option value="biweekly">{UNIT_LABEL.biweekly}</option>
            </select>
          </label>
          {form.repeatUnit !== "none" && (
            <label className="dash-field">
              <span>عدد المرات</span>
              <input
                required
                type="number"
                min="1"
                max="52"
                className="dash-input"
                value={form.repeatCount}
                onChange={(e) => setForm({ ...form, repeatCount: e.target.value })}
              />
            </label>
          )}
          <button type="submit" className="dash-btn dash-btn--primary" disabled={busy}>
            <Plus size={16} /> إضافة
          </button>
        </form>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--dash-text-muted)" }}>جارٍ التحميل...</div>
        ) : slots.length ? (
          <div className="dash-table-wrap dash-panel__body--flush">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>الموعد</th>
                  <th>المدة</th>
                  <th>الحالة</th>
                  <th>المريض</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id}>
                    <td className="dash-cell-main">{new Date(s.startsAt).toLocaleString()}</td>
                    <td className="dash-cell-muted">{s.durationMin} دقيقة</td>
                    <td>
                      <span className={`dash-badge ${s.status === "open" ? "dash-badge--success" : s.status === "booked" ? "dash-badge--info" : "dash-badge--neutral"}`}>
                        {STATUS_LABEL[s.status] || s.status}
                      </span>
                    </td>
                    <td className="dash-cell-muted">{s.patientName || "—"}</td>
                    <td>
                      {s.status !== "cancelled" && (
                        <button className="dash-btn dash-btn--danger dash-btn--sm" disabled={busy === s.id} onClick={() => cancel(s.id)}>
                          <Trash size={14} /> إلغاء
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dash-empty">
            <p>لا توجد مواعيد بعد. أضف موعدًا متاحًا ليحجزه المرضى.</p>
          </div>
        )}
      </div>
    </section>
  );
}