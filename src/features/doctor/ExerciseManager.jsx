import { useState, useRef, useEffect } from "react";
import { Search, Edit2, Save, X, RefreshCw, Dumbbell, Play, Check, ImageIcon, UploadCloud, Link as LinkIcon } from "lucide-react";
import { exerciseCatalogApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ExerciseManager() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedEx, setSelectedEx] = useState(null);
  const [mediaType, setMediaType] = useState("url"); // "url" | "file"
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaSaving, setMediaSaving] = useState(false);
  const fileInputRef = useRef(null);

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

  const toast = useToast();

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
      toast.success("تم تحديث الاسم العربي بنجاح");
    } catch (err) {
      toast.error(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const openMediaModal = (ex) => {
    setSelectedEx(ex);
    setMediaType("url");
    setMediaUrl(ex.gifUrl || ex.imageUrl || "");
    setMediaFile(null);
    setMediaModalOpen(true);
  };

  const saveMedia = async () => {
    if (mediaType === "url" && !mediaUrl.trim()) return;
    if (mediaType === "file" && !mediaFile) return;
    
    setMediaSaving(true);
    try {
      const payload = mediaType === "file" ? mediaFile : mediaUrl.trim();
      const res = await exerciseCatalogApi.setMedia(selectedEx.id, payload);
      const newUrl = mediaType === "file" ? `/uploads/exercises/${res.data.media}` : res.data.media;
      
      setExercises(prev =>
        prev.map(e => e.id === selectedEx.id ? { ...e, gifUrl: newUrl, imageUrl: newUrl } : e)
      );
      setMediaModalOpen(false);
      toast.success("تم تحديث وسائط التمرين بنجاح");
    } catch (err) {
      toast.error(err.message || "حدث خطأ أثناء حفظ الوسائط");
    } finally {
      setMediaSaving(false);
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
                        <div className="dash-row-actions">
                          <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => startEdit(ex)}>
                            <Edit2 size={15} /> تعديل الاسم
                          </button>
                          <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => openMediaModal(ex)}>
                            <ImageIcon size={15} /> الوسائط
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AnimatePresence>
        {mediaModalOpen && selectedEx && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setMediaModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{ background: "var(--dash-card-bg)", width: "100%", maxWidth: 500, borderRadius: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--dash-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>تعديل فيديو / صورة التمرين</h3>
                <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => setMediaModalOpen(false)}><X size={20}/></button>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 8, padding: 4, background: "var(--dash-bg)", borderRadius: 12 }}>
                  <button className={`dash-btn ${mediaType === "url" ? "dash-btn--primary" : "dash-btn--ghost"}`} style={{ flex: 1 }} onClick={() => setMediaType("url")}>
                    <LinkIcon size={16} /> رابط خارجي
                  </button>
                  <button className={`dash-btn ${mediaType === "file" ? "dash-btn--primary" : "dash-btn--ghost"}`} style={{ flex: 1 }} onClick={() => setMediaType("file")}>
                    <UploadCloud size={16} /> رفع ملف
                  </button>
                </div>

                {mediaType === "url" ? (
                  <label className="dash-field">
                    <span>رابط الصورة المتحركة (GIF) أو الفيديو</span>
                    <input type="url" className="dash-input" placeholder="https://..." value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
                    <span style={{ fontSize: 11, color: "var(--dash-text-muted)", marginTop: 4 }}>يمكنك لصق رابط من Giphy أو يوتيوب أو أي موقع آخر</span>
                  </label>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*,video/mp4" onChange={e => setMediaFile(e.target.files[0])} />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ border: "2px dashed var(--dash-border)", borderRadius: 12, padding: 30, textAlign: "center", cursor: "pointer", background: "var(--dash-bg)" }}
                    >
                      <UploadCloud size={32} style={{ color: "var(--dash-text-muted)", marginBottom: 12 }} />
                      <div style={{ fontWeight: 600 }}>{mediaFile ? mediaFile.name : "اضغط هنا لاختيار ملف"}</div>
                      <div style={{ fontSize: 12, color: "var(--dash-text-muted)", marginTop: 4 }}>يدعم الصور, GIF, والفيديو (أقل من 10MB)</div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--dash-border)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setMediaModalOpen(false)}>إلغاء</button>
                <button type="button" className="dash-btn dash-btn--primary" onClick={saveMedia} disabled={mediaSaving}>
                  <Save size={18} /> حفظ الوسائط
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
