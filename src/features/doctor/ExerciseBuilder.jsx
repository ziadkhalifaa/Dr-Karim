import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X, ArrowLeft, Save, RefreshCw, Dumbbell, Play, BookTemplate, Download } from "lucide-react";
import { api, exerciseApi, planTemplateApi } from "../../api/client";
import { navigate } from "../../lib/router";

const DAYS = [
  { id: 1, label: "السبت" }, { id: 2, label: "الأحد" }, { id: 3, label: "الإثنين" },
  { id: 4, label: "الثلاثاء" }, { id: 5, label: "الأربعاء" }, { id: 6, label: "الخميس" }, { id: 7, label: "الجمعة" }
];

function GifCard({ item, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onSelect(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px", borderRadius: "14px", cursor: "pointer", border: "1.5px solid var(--dash-border)", background: hovered ? "#f8fafc" : "#fff", transition: "all 0.2s" }}
    >
      {/* GIF / Image thumbnail */}
      <div style={{ width: 72, height: 72, borderRadius: "12px", overflow: "hidden", flexShrink: 0, background: "var(--dash-bg)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {item.gifUrl ? (
          <img
            src={hovered ? item.gifUrl : (item.imageUrl || item.gifUrl)}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <Dumbbell size={28} style={{ color: "var(--dash-text-muted)", opacity: 0.4 }} />
        )}
        {item.gifUrl && !hovered && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
            <Play size={20} style={{ color: "#fff" }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "800", color: "var(--dash-text)", fontSize: "14px", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {item.muscleGroup && <span style={{ background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>{item.muscleGroup}</span>}
          {item.equipment && <span style={{ background: "var(--dash-bg)", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", color: "var(--dash-text-muted)" }}>{item.equipment}</span>}
          {item.bodyPart && <span style={{ background: "var(--dash-bg)", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", color: "var(--dash-text-muted)" }}>{item.bodyPart}</span>}
        </div>
      </div>

      <button style={{ width: 32, height: 32, borderRadius: "50%", background: "#fee2e2", color: "#ef4444", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
        <Plus size={16} />
      </button>
    </div>
  );
}

function ExerciseSearchModal({ onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trimmed = query.trim();
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(trimmed ? `/exercises?q=${encodeURIComponent(trimmed)}&limit=100` : "/exercises?limit=100");
        setResults(res.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, trimmed ? 400 : 0);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", width: "90%", maxWidth: "680px", borderRadius: "24px", display: "flex", flexDirection: "column", maxHeight: "85vh", boxShadow: "0 30px 60px rgba(0,0,0,0.15)" }}
      >
        {/* Search Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--dash-border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 40, height: 40, background: "#fee2e2", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Search size={18} style={{ color: "#ef4444" }} />
          </div>
          <input
            type="text"
            placeholder="ابحث باسم التمرين أو العضلة... (مثال: chest, biceps, squat)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", fontSize: "15px", background: "transparent", fontFamily: "inherit", color: "var(--dash-text)" }}
            autoFocus
          />
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--dash-text-muted)", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        {/* Hint */}
        <div style={{ padding: "8px 24px", background: "#fafafa", fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600" }}>
          💡 حرّك الماوس فوق أي تمرين لمشاهدة الـ GIF التوضيحي
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--dash-text-muted)" }}>
              <RefreshCw size={28} style={{ animation: "spin 1s linear infinite" }} />
              <div style={{ marginTop: "12px", fontWeight: "700", fontSize: "14px" }}>جاري تحميل التمارين...</div>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--dash-text-muted)" }}>
              <Dumbbell size={32} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <div style={{ fontWeight: "700" }}>لا توجد نتائج</div>
            </div>
          )}
          {!loading && results.map((item) => (
            <GifCard key={item.id} item={item} onSelect={(ex) => { onSelect(ex); }} />
          ))}
        </div>

        <div style={{ padding: "12px 24px", borderTop: "1px solid var(--dash-border)", fontSize: "12px", color: "var(--dash-text-muted)", fontWeight: "600", display: "flex", justifyContent: "space-between" }}>
          <span>📊 عرض {results.length} نتيجة (ابحث للمزيد)</span>
          <span>مصدر: hasaneyldrm/exercises-dataset — 1324 تمرين</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function ExerciseBuilder({ planId, patientId }) {
  const [activeDay, setActiveDay] = useState(1);
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [globalNotes, setGlobalNotes] = useState("");
  const [previewEx, setPreviewEx] = useState(null);

  // Templates state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [templatesList, setTemplatesList] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return alert("يرجى إدخال اسم القالب");
    try {
      setSaving(true);
      await planTemplateApi.create({
        domain: "exercise",
        name: templateName,
        content_json: { exercises, notes: globalNotes }
      });
      setShowSaveTemplate(false);
      setTemplateName("");
      alert("تم حفظ القالب بنجاح!");
    } catch (err) {
      alert("Error saving template: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openLoadTemplates = async () => {
    setShowLoadTemplate(true);
    setLoadingTemplates(true);
    try {
      const res = await planTemplateApi.list("exercise");
      setTemplatesList(res.data || []);
    } catch (err) {
      alert("Error loading templates: " + err.message);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await exerciseApi.patient(patientId);
        if (res && res.versions && res.versions.length > 0) {
          const active = res.versions.find(v => v.status === "active") || res.versions[0];
          setGlobalNotes(active.notes || "");
          if (active.exercises_json) setExercises(active.exercises_json);
        }
      } catch (err) {
        console.error("Failed to load existing exercise plan", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  const currentDayExercises = useMemo(() => exercises.filter(m => m.dayId === activeDay), [exercises, activeDay]);

  const handleAddExercise = (exerciseItem) => {
    setExercises(prev => [
      ...prev,
      {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        dayId: activeDay,
        exercise: exerciseItem,
        sets: 3,
        reps: "10-12",
        rest: "60s",
        instructions: "",
      }
    ]);
    setSearchModalOpen(false);
  };

  const handleRemoveExercise = (id) => setExercises(prev => prev.filter(m => m.id !== id));
  const handleChangeField = (id, field, value) => setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));

  const savePlan = async () => {
    setSaving(true);
    try {
      const body = { exercises, notes: globalNotes, effectiveFrom: new Date().toISOString() };
      const STATUS_AR = { draft: "مسودة", doctor_review: "قيد المراجعة", approved: "معتمدة", active: "منشطة" };
      const res = planId
        ? await exerciseApi.version(planId, body)
        : await exerciseApi.create({ patientId, version: body });
      const pub = res?.publish;
      if (pub && !pub.published)
        alert(`تم حفظ الخطة (${STATUS_AR[pub.status] || pub.status}) لكن لم يتم تنشيطها.\nالسبب: ${pub.reason || "غير معروف"}`);
      navigate(`/doctor/patients/${patientId}`);
    } catch (err) {
      alert("خطأ في الحفظ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px" }}>
      <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", color: "#ef4444" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <button onClick={() => navigate(`/doctor/patients/${patientId}`)} style={{ background: "transparent", border: "none", color: "var(--dash-text-muted)", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: 0, marginBottom: "10px", fontFamily: "inherit" }}>
            <ArrowLeft size={14} /> العودة لملف المريض
          </button>
          <h1 style={{ fontSize: "26px", fontWeight: "900", color: "var(--dash-text)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: 44, height: 44, background: "linear-gradient(135deg, #ef4444, #dc2626)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Dumbbell size={24} style={{ color: "#fff" }} />
            </span>
            مُنشئ خطة التمارين
          </h1>
          <p style={{ margin: "8px 0 0", color: "var(--dash-text-muted)", fontSize: "14px", fontWeight: "600" }}>1324 تمرين مع GIF توضيحي — مقسمة على أيام الأسبوع</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={openLoadTemplates} style={{ background: "#fff", color: "var(--dash-text)", border: "1.5px solid var(--dash-border)", padding: "12px 20px", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <Download size={18} /> استيراد قالب
          </button>
          <button onClick={() => setShowSaveTemplate(true)} style={{ background: "#fff", color: "var(--dash-text)", border: "1.5px solid var(--dash-border)", padding: "12px 20px", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookTemplate size={18} /> حفظ كقالب
          </button>
          <button
            onClick={savePlan}
            disabled={saving}
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", padding: "14px 28px", borderRadius: "14px", fontSize: "15px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 20px rgba(239,68,68,0.35)", opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}
          >
            {saving ? <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={18} />}
            {saving ? "جاري الحفظ..." : "حفظ الخطة"}
          </button>
        </div>
      </div>

      {showSaveTemplate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "20px", width: "400px", maxWidth: "90%" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>حفظ الخطة كقالب</h3>
            <input type="text" placeholder="اسم القالب (مثال: Push Pull Legs)" value={templateName} onChange={(e) => setTemplateName(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--dash-border)", marginBottom: "20px" }} />
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowSaveTemplate(false)} style={{ background: "transparent", border: "none", color: "var(--dash-text)", cursor: "pointer", fontWeight: "700" }}>إلغاء</button>
              <button onClick={handleSaveTemplate} disabled={saving} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>حفظ القالب</button>
            </div>
          </div>
        </div>
      )}

      {showLoadTemplate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "20px", width: "500px", maxWidth: "90%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>استيراد من قالب</h3>
              <button onClick={() => setShowLoadTemplate(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            {loadingTemplates ? <p>جاري التحميل...</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {templatesList.length === 0 ? <p style={{ color: "var(--dash-text-muted)" }}>لا توجد قوالب محفوظة.</p> : templatesList.map(tmpl => (
                  <div key={tmpl.id} style={{ padding: "16px", border: "1px solid var(--dash-border)", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ display: "block", marginBottom: "4px" }}>{tmpl.name}</strong>
                      <span style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>تم الحفظ في: {new Date(tmpl.created_at).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => {
                      if (!window.confirm("استيراد القالب سيقوم بتبديل التمارين الحالية. هل أنت متأكد؟")) return;
                      const content = tmpl.content_json;
                      if (content.exercises) setExercises(content.exercises);
                      if (content.notes) setGlobalNotes(content.notes);
                      setShowLoadTemplate(false);
                    }} style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>استيراد</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Notes */}
      <div style={{ background: "#fff", borderRadius: "18px", border: "1.5px solid var(--dash-border)", padding: "20px", marginBottom: "24px" }}>
        <div style={{ fontWeight: "800", fontSize: "14px", color: "var(--dash-text)", marginBottom: "10px" }}>📝 تعليمات وإرشادات عامة للخطة</div>
        <textarea value={globalNotes} onChange={(e) => setGlobalNotes(e.target.value)} placeholder="اكتب تعليمات عامة للمريض حول التمارين والإحماء والراحة..." style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid var(--dash-border)", outline: "none", fontSize: "14px", fontFamily: "inherit", resize: "vertical", minHeight: "90px", background: "var(--dash-bg)", boxSizing: "border-box" }} />
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* Days Sidebar */}
        <div style={{ width: "190px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px", position: "sticky", top: "20px" }}>
          {DAYS.map(day => {
            const count = exercises.filter(e => e.dayId === day.id).length;
            const isActive = activeDay === day.id;
            return (
              <button
                key={day.id}
                onClick={() => setActiveDay(day.id)}
                style={{
                  background: isActive ? "linear-gradient(135deg, #ef4444, #dc2626)" : "#fff",
                  color: isActive ? "#fff" : "var(--dash-text)",
                  border: isActive ? "none" : "1.5px solid var(--dash-border)",
                  padding: "14px 16px", borderRadius: "14px", fontSize: "14px", fontWeight: "800",
                  cursor: "pointer", textAlign: "right", transition: "all 0.2s",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  boxShadow: isActive ? "0 4px 12px rgba(239,68,68,0.3)" : "none",
                  fontFamily: "inherit"
                }}
              >
                {day.label}
                <span style={{ fontSize: "12px", background: isActive ? "rgba(255,255,255,0.25)" : (count > 0 ? "#fee2e2" : "var(--dash-bg)"), color: isActive ? "#fff" : (count > 0 ? "#ef4444" : "var(--dash-text-muted)"), padding: "2px 8px", borderRadius: "8px", fontWeight: "900" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Exercises Area */}
        <div style={{ flex: 1 }}>
          <div style={{ background: "#fff", borderRadius: "18px", border: "1.5px solid var(--dash-border)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "900", margin: 0, color: "var(--dash-text)" }}>
                تمارين يوم {DAYS.find(d => d.id === activeDay)?.label}
              </h3>
              <button
                onClick={() => setSearchModalOpen(true)}
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 12px rgba(239,68,68,0.25)", fontFamily: "inherit" }}
              >
                <Plus size={16} /> إضافة تمرين
              </button>
            </div>

            {currentDayExercises.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "60px 20px", background: "var(--dash-bg)", borderRadius: "14px", border: "2px dashed var(--dash-border)", cursor: "pointer" }}
                onClick={() => setSearchModalOpen(true)}
              >
                <Dumbbell size={40} style={{ color: "#ef4444", opacity: 0.4, marginBottom: "12px" }} />
                <div style={{ fontWeight: "800", color: "var(--dash-text-muted)", fontSize: "15px" }}>راحة — اضغط لإضافة تمارين</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {currentDayExercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    style={{ border: "1.5px solid var(--dash-border)", borderRadius: "16px", overflow: "hidden", transition: "box-shadow 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                  >
                    {/* Exercise Header with GIF */}
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", padding: "16px", background: "var(--dash-bg)", borderBottom: "1px solid var(--dash-border)" }}>
                      {/* GIF thumbnail */}
                      <div
                        style={{ width: 64, height: 64, borderRadius: "12px", overflow: "hidden", flexShrink: 0, background: "#fff", cursor: "pointer", border: "1px solid var(--dash-border)" }}
                        onClick={() => setPreviewEx(previewEx?.id === ex.id ? null : ex)}
                      >
                        {ex.exercise?.gifUrl ? (
                          <img src={previewEx?.id === ex.id ? ex.exercise.gifUrl : (ex.exercise.imageUrl || ex.exercise.gifUrl)} alt={ex.exercise.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Dumbbell size={24} style={{ color: "var(--dash-text-muted)", opacity: 0.3 }} />
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: 28, height: 28, background: "#ef4444", color: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "13px", flexShrink: 0 }}>{idx + 1}</span>
                          <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--dash-text)" }}>{ex.exercise?.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                          {ex.exercise?.muscleGroup && <span style={{ background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>{ex.exercise.muscleGroup}</span>}
                          {ex.exercise?.equipment && <span style={{ background: "#fff", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", color: "var(--dash-text-muted)", border: "1px solid var(--dash-border)" }}>{ex.exercise.equipment}</span>}
                          {ex.exercise?.gifUrl && <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>🎬 GIF</span>}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveExercise(ex.id)} style={{ background: "#fee2e2", border: "none", color: "#ef4444", cursor: "pointer", width: 32, height: 32, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={16} />
                      </button>
                    </div>

                    {/* GIF Preview */}
                    {previewEx?.id === ex.id && ex.exercise?.gifUrl && (
                      <div style={{ padding: "16px", background: "#000", display: "flex", justifyContent: "center" }}>
                        <img src={ex.exercise.gifUrl} alt={ex.exercise.name} style={{ maxHeight: "300px", borderRadius: "8px" }} />
                      </div>
                    )}

                    {/* Fields */}
                    <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)" }}>المجموعات (Sets)</span>
                        <input type="number" value={ex.sets} onChange={e => handleChangeField(ex.id, "sets", Number(e.target.value))} style={{ padding: "8px 12px", border: "1px solid var(--dash-border)", borderRadius: "8px", outline: "none", fontWeight: "800", fontFamily: "inherit", background: "var(--dash-bg)" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)" }}>التكرارات (Reps)</span>
                        <input type="text" value={ex.reps} onChange={e => handleChangeField(ex.id, "reps", e.target.value)} placeholder="10-12" style={{ padding: "8px 12px", border: "1px solid var(--dash-border)", borderRadius: "8px", outline: "none", fontWeight: "800", fontFamily: "inherit", background: "var(--dash-bg)" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)" }}>الراحة (Rest)</span>
                        <input type="text" value={ex.rest} onChange={e => handleChangeField(ex.id, "rest", e.target.value)} placeholder="60s" style={{ padding: "8px 12px", border: "1px solid var(--dash-border)", borderRadius: "8px", outline: "none", fontWeight: "800", fontFamily: "inherit", background: "var(--dash-bg)" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "1 / -1" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--dash-text-muted)" }}>ملاحظات التكنيك</span>
                        <input type="text" value={ex.instructions} onChange={e => handleChangeField(ex.id, "instructions", e.target.value)} placeholder="أي ملاحظات خاصة بأداء التمرين..." style={{ padding: "8px 12px", border: "1px solid var(--dash-border)", borderRadius: "8px", outline: "none", fontWeight: "600", fontFamily: "inherit", background: "var(--dash-bg)" }} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {searchModalOpen && (
          <ExerciseSearchModal onClose={() => setSearchModalOpen(false)} onSelect={handleAddExercise} />
        )}
      </AnimatePresence>
    </div>
  );
}
