import { useState, useEffect } from "react";
import { Search, Edit2, Save, X, RefreshCw, Dumbbell, Play, Check } from "lucide-react";
import { exerciseCatalogApi } from "../../api/client";
import { motion, AnimatePresence } from "framer-motion";

export default function ExerciseManager() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    const delay = setTimeout(fetchExercises, query ? 400 : 0);
    return () => clearTimeout(delay);
  }, [query]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const res = await exerciseCatalogApi.list(
        query.trim() ? `?q=${encodeURIComponent(query)}&limit=100` : "?limit=100"
      );
      setExercises(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (ex) => {
    setEditingId(ex.id);
    setEditValue(ex.nameAr || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (ex) => {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await exerciseCatalogApi.setArName(ex.id, ex.name, editValue.trim());
      setExercises(prev =>
        prev.map(e => e.id === ex.id ? { ...e, nameAr: editValue.trim() } : e)
      );
      setSavedIds(prev => new Set([...prev, ex.id]));
      setTimeout(() => setSavedIds(prev => { const s = new Set(prev); s.delete(ex.id); return s; }), 2000);
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <h2>إدارة أسماء التمارين</h2>
        <p className="dash-muted" style={{ margin: 0 }}>يمكنك تخصيص الاسم العربي لأي تمرين — سيظهر هذا الاسم للمرضى بدلاً من الاسم الإنجليزي</p>
      </div>

      <section className="dash-panel" style={{ padding: 20 }}>
        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search size={18} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--dash-text-muted)" }} />
          <input
            type="text"
            className="dash-input"
            placeholder="ابحث بالاسم الإنجليزي أو العربي..."
            style={{ paddingRight: 40 }}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--dash-text-soft)" }}>
            <RefreshCw size={28} className="spin" />
            <p style={{ marginTop: 12, fontWeight: 600 }}>جاري تحميل التمارين...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--dash-text-soft)" }}>
            <Dumbbell size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>لم يتم العثور على تمارين</p>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>فيديو</th>
                  <th>الاسم الإنجليزي</th>
                  <th>الاسم العربي</th>
                  <th>المجموعة العضلية</th>
                  <th style={{ width: 120 }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map(ex => (
                  <tr key={ex.id} style={{ background: savedIds.has(ex.id) ? "var(--dash-success-soft, #f0fdf4)" : undefined, transition: "background 0.5s" }}>
                    <td>
                      {ex.gifUrl || ex.imageUrl ? (
                        <img
                          src={ex.imageUrl || ex.gifUrl}
                          alt={ex.name}
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--dash-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Dumbbell size={20} style={{ opacity: 0.3 }} />
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{ex.name}</td>
                    <td>
                      {editingId === ex.id ? (
                        <input
                          type="text"
                          className="dash-input"
                          style={{ fontSize: 13, padding: "6px 10px" }}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(ex); if (e.key === "Escape") cancelEdit(); }}
                          autoFocus
                          placeholder="أدخل الاسم العربي..."
                        />
                      ) : (
                        <span style={{ fontWeight: ex.nameAr ? 800 : 400, color: ex.nameAr ? "var(--dash-text)" : "var(--dash-text-soft)", fontSize: 14 }}>
                          {savedIds.has(ex.id) ? (
                            <span style={{ color: "var(--dash-success, #22c55e)", display: "flex", alignItems: "center", gap: 6 }}>
                              <Check size={14} /> تم الحفظ
                            </span>
                          ) : (ex.nameAr || <span style={{ fontSize: 12, opacity: 0.5 }}>— لم يحدد بعد</span>)}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--dash-text-muted)", fontWeight: 600 }}>
                      {ex.muscleGroup || ex.bodyPart || "—"}
                    </td>
                    <td>
                      {editingId === ex.id ? (
                        <div className="dash-row-actions">
                          <button className="dash-btn dash-btn--primary dash-btn--sm" onClick={() => saveEdit(ex)} disabled={saving}>
                            <Save size={14} />
                          </button>
                          <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={cancelEdit}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => startEdit(ex)}>
                          <Edit2 size={15} /> تعديل
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
