import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X, Check, ArrowLeft, Save, AlertCircle, RefreshCw, Flame, Beef, Wheat, Droplet, BookTemplate, Download } from "lucide-react";
import { foodApi, nutritionApi, planTemplateApi } from "../../api/client";
import { navigate } from "../../lib/router";

const DAYS = [
  { id: 1, label: "السبت" }, { id: 2, label: "الأحد" }, { id: 3, label: "الإثنين" },
  { id: 4, label: "الثلاثاء" }, { id: 5, label: "الأربعاء" }, { id: 6, label: "الخميس" }, { id: 7, label: "الجمعة" }
];

const MEAL_TYPES = [
  { code: "breakfast", label: "الفطور", icon: "🌅" },
  { code: "snack_1", label: "وجبة خفيفة 1", icon: "🍎" },
  { code: "lunch", label: "الغداء", icon: "🍲" },
  { code: "snack_2", label: "وجبة خفيفة 2", icon: "🍌" },
  { code: "dinner", label: "العشاء", icon: "🌙" }
];

function FoodSearchModal({ onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await foodApi.list(trimmed ? `?q=${encodeURIComponent(trimmed)}&limit=50` : "?limit=200");
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
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} style={{ background: "#fff", margin: "auto", width: "90%", maxWidth: "600px", borderRadius: "20px", display: "flex", flexDirection: "column", maxHeight: "80vh", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid var(--dash-border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <Search style={{ color: "var(--dash-text-muted)" }} size={20} />
          <input type="text" placeholder="ابحث عن صنف طعام..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontSize: "16px", background: "transparent" }} autoFocus />
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--dash-text-soft)" }}><X size={20} /></button>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {loading && <div style={{ textAlign: "center", padding: "40px", color: "var(--dash-text-soft)" }}><RefreshCw size={24} className="spin" /></div>}
          {!loading && results.length === 0 && query && <div style={{ textAlign: "center", padding: "40px", color: "var(--dash-text-soft)" }}>لم يتم العثور على نتائج</div>}
          {!loading && results.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderBottom: "1px solid var(--dash-border)", cursor: "pointer", borderRadius: "12px" }} onClick={() => onSelect(item)} className="food-search-item">
              <div>
                <div style={{ fontWeight: "800", color: "var(--dash-text)", fontSize: "15px" }}>{item.nameAr}</div>
                <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--dash-text-muted)", marginTop: "4px", fontWeight: "600" }}>
                  <span><Flame size={12} style={{ display: "inline", color: "#024fab" }}/> {item.macros?.energy_kcal || 0} kcal</span>
                  <span><Beef size={12} style={{ display: "inline", color: "#ef4444" }}/> {item.macros?.protein_g || 0}g بروتين</span>
                  <span><Wheat size={12} style={{ display: "inline", color: "#48d6f9" }}/> {item.macros?.carb_g || 0}g كارب</span>
                  <span><Droplet size={12} style={{ display: "inline", color: "#3b82f6" }}/> {item.macros?.fat_g || 0}g دهون</span>
                </div>
              </div>
              <button style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--dash-primary-soft)", color: "var(--dash-primary)", border: "none", display: "flex", alignItems: "center", justifyItems: "center", cursor: "pointer" }}>
                <Plus size={16} style={{margin:"auto"}}/>
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function NutritionBuilder({ planId, patientId }) {
  const { t } = useTranslation();
  const [activeDay, setActiveDay] = useState(1);
  const [meals, setMeals] = useState([]); // { dayId, code, items: [{ foodItem, quantity, unit }] }
  const [saving, setSaving] = useState(false);
  const [searchModalFor, setSearchModalFor] = useState(null); // { dayId, code }

  const [targets, setTargets] = useState({
    calories: 2000, protein: 150, carbs: 200, fats: 66,
  });
  const [loading, setLoading] = useState(true);

  // Templates state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateImageUrl, setTemplateImageUrl] = useState("");
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [templatesList, setTemplatesList] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const prepareApiMeals = () => {
    const apiMeals = [];
    meals.forEach(m => {
      // Only include items that have a valid foodItemId
      const validItems = m.items.filter(it => it.foodItemId);
      if (validItems.length === 0) return;
      apiMeals.push({
        code: m.code,
        dayNumber: m.dayId,
        items: validItems.map((it, idx) => ({
          foodItemId: it.foodItemId,
          quantity: it.quantity,
          unit: it.unit,
          sortOrder: idx
        }))
      });
    });
    return apiMeals;
  };

  const handleCopyToAllDays = () => {
    const activeMeals = meals.filter(m => m.dayId === activeDay);
    if (activeMeals.length === 0) return alert("حدد وجبات اليوم أولاً قبل النسخ");
    const byCode = new Map(activeMeals.map(m => [m.code, m.items]));
    const updated = [];
    for (const day of DAYS) {
      for (const mt of MEAL_TYPES) {
        updated.push({ dayId: day.id, code: mt.code, items: byCode.has(mt.code) ? [...byCode.get(mt.code)] : [] });
      }
    }
    setMeals(updated);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return alert("يرجى إدخال اسم القالب");
    try {
      setSaving(true);
      const apiMeals = prepareApiMeals();
      await planTemplateApi.create({
        domain: "nutrition",
        name: templateName,
        image_url: templateImageUrl,
        content_json: { targets, meals: apiMeals, rawMeals: meals }
      });
      setShowSaveTemplate(false);
      setTemplateName("");
      setTemplateImageUrl("");
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
      const res = await planTemplateApi.list("nutrition");
      setTemplatesList(res || []);
    } catch (err) {
      alert("Error loading templates: " + err.message);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplate = async (tmpl) => {
    try {
      const active = tmpl.content_json;
      if (active.targets) {
        setTargets(active.targets);
      }
      if (active.meals) {
        // Fetch full food details for the template items because template only has foodItemId
        // To keep it simple, we use a basic item object. When saving, the backend only needs the ID.
        // But for UI, we need the name and macros. Let's fetch them in a batch if needed,
        // or rely on the stored names if we had stored them.
        // For now, we will map them directly; if the name is missing it says "صنف محفوظ".
        // Better: we can store the rich items in the template! 
        // Wait, prepareApiMeals drops the rich data. Let's fix prepareApiMeals to include it just for templates?
        // Let's just use what's there and let the backend handle it during actual plan creation.
        alert("تنبيه: سيتم تطبيق القالب وتحديث الخطة الحالية.");
        // Actually, for proper UX, we should have stored the full `meals` array in the template instead of `apiMeals`.
        // I will change handleSaveTemplate to just save `meals` array directly!
      }
    } catch (err) {
      alert("Error applying template");
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await nutritionApi.patient(patientId);
        if (res && res.versions && res.versions.length > 0) {
          const active = res.versions.find(v => v.status === "active") || res.versions[0];
          if (active.targets_json) {
            setTargets(active.targets_json);
          }
          if (active.meals) {
            const loadedMeals = [];
            active.meals.forEach(m => {
              loadedMeals.push({
                dayId: m.day_number || 1,
                code: m.code,
                items: (m.items || []).map(it => {
                  const foodData = it.food_item || it.FoodItem || {};
                  return {
                    foodItemId: it.food_item_id,
                    foodItem: { id: it.food_item_id, nameAr: foodData.name_ar || "صنف محفوظ", unit: it.unit, macros: foodData.macros_json },
                    quantity: it.quantity,
                    unit: it.unit,
                    sortOrder: it.sort_order
                  };
                })
              });
            });
            setMeals(loadedMeals);
          }
        }
      } catch (err) {
        console.error("Failed to load existing nutrition plan", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  const currentDayMeals = useMemo(() => {
    return MEAL_TYPES.map(mt => {
      const existing = meals.find(m => m.dayId === activeDay && m.code === mt.code);
      return existing || { dayId: activeDay, code: mt.code, items: [] };
    });
  }, [meals, activeDay]);

  const handleAddFood = (foodItem) => {
    if (!searchModalFor) return;
    const { dayId, code } = searchModalFor;
    
    setMeals(prev => {
      const draft = [...prev];
      const mealIdx = draft.findIndex(m => m.dayId === dayId && m.code === code);
      const newItem = { foodItemId: foodItem.id, foodItem, quantity: 1, unit: foodItem.unit || "100g", sortOrder: 0 };
      
      if (mealIdx >= 0) {
        draft[mealIdx].items.push(newItem);
      } else {
        draft.push({ dayId, code, items: [newItem] });
      }
      return draft;
    });
    setSearchModalFor(null);
  };

  const handleRemoveFood = (dayId, code, itemIdx) => {
    setMeals(prev => {
      const draft = [...prev];
      const mealIdx = draft.findIndex(m => m.dayId === dayId && m.code === code);
      if (mealIdx >= 0) {
        draft[mealIdx].items.splice(itemIdx, 1);
      }
      return draft;
    });
  };

  const handleChangeQty = (dayId, code, itemIdx, qty) => {
    setMeals(prev => {
      const draft = [...prev];
      const mealIdx = draft.findIndex(m => m.dayId === dayId && m.code === code);
      if (mealIdx >= 0) {
        draft[mealIdx].items[itemIdx].quantity = Number(qty) || 0;
      }
      return draft;
    });
  };

  const calculateDayTotals = (dayId) => {
    let cal = 0, p = 0, c = 0, f = 0;
    meals.filter(m => m.dayId === dayId).forEach(meal => {
      meal.items.forEach(it => {
        const qtyMultiplier = it.quantity; // assuming quantity represents multiples of the base unit (e.g. 1 x 100g)
        cal += (it.foodItem.macros?.energy_kcal || 0) * qtyMultiplier;
        p += (it.foodItem.macros?.protein_g || 0) * qtyMultiplier;
        c += (it.foodItem.macros?.carb_g || 0) * qtyMultiplier;
        f += (it.foodItem.macros?.fat_g || 0) * qtyMultiplier;
      });
    });
    return { cal, p, c, f };
  };

  const dayTotals = calculateDayTotals(activeDay);

  const savePlan = async () => {
    setSaving(true);
    try {
      // transform meals to api format
      const apiMeals = prepareApiMeals();

      const body = {
        targets,
        meals: apiMeals,
        effectiveFrom: new Date().toISOString(),
      };

      const STATUS_AR = { draft: "مسودة", doctor_review: "قيد المراجعة", approved: "معتمدة", active: "منشطة" };
      let res;
      if (planId) {
        res = await nutritionApi.version(planId, body);
      } else {
        res = await nutritionApi.create({ patientId, primaryGoalCode: "weight_loss", version: body });
      }
      const pub = res?.publish;
      if (pub && !pub.published) {
        alert(`تم حفظ الخطة (${STATUS_AR[pub.status] || pub.status}) لكن لم يتم تنشيطها.\nالسبب: ${pub.reason || "غير معروف"}\nغالبًا المريض ليس لديه اشتراك فعال — يمكن تنشيط الخطة بعد الاشتراك.`);
      }

      navigate(`/doctor/patients/${patientId}`);
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <RefreshCw size={32} className="spin" style={{ color: "var(--dash-primary)" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .food-search-item:hover { background: #f8fafc; }
        .macro-bar { height: 8px; border-radius: 4px; background: var(--dash-bg); overflow: hidden; margin-top: 8px; }
        .macro-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
      `}}/>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <button onClick={() => navigate(`/doctor/patients/${patientId}`)} style={{ background: "transparent", border: "none", color: "var(--dash-text-muted)", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "0", marginBottom: "8px", fontFamily: "inherit" }}>
            <ArrowLeft size={16} /> العودة لملف المريض
          </button>
          <h1 style={{ fontSize: "28px", fontWeight: "900", color: "var(--dash-text)", margin: 0 }}>مُنشئ خطة التغذية</h1>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={openLoadTemplates} style={{ background: "#fff", color: "var(--dash-text)", border: "1.5px solid var(--dash-border)", padding: "12px 20px", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <Download size={18} /> استيراد قالب
          </button>
          <button onClick={() => setShowSaveTemplate(true)} style={{ background: "#fff", color: "var(--dash-text)", border: "1.5px solid var(--dash-border)", padding: "12px 20px", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookTemplate size={18} /> حفظ كقالب
          </button>
          <button onClick={savePlan} disabled={saving} style={{ background: "var(--dash-primary)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "12px", fontSize: "15px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: saving ? 0.7 : 1 }}>
            {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />} حفظ الخطة
          </button>
        </div>
      </div>

      {showSaveTemplate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "20px", width: "400px", maxWidth: "90%" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>حفظ الخطة كقالب</h3>
            <input type="text" placeholder="اسم القالب (مثال: نظام تنشيف للمبتدئين)" value={templateName} onChange={(e) => setTemplateName(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--dash-border)", marginBottom: "12px" }} />
            <input type="text" placeholder="رابط صورة الغلاف (اختياري)" value={templateImageUrl} onChange={(e) => setTemplateImageUrl(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--dash-border)", marginBottom: "20px" }} />
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowSaveTemplate(false)} style={{ background: "transparent", border: "none", color: "var(--dash-text)", cursor: "pointer", fontWeight: "700" }}>إلغاء</button>
              <button onClick={handleSaveTemplate} disabled={saving} style={{ background: "var(--dash-primary)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>حفظ القالب</button>
            </div>
          </div>
        </div>
      )}

      {showLoadTemplate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", padding: "32px", borderRadius: "24px", width: "900px", maxWidth: "95%", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "900", color: "var(--dash-text)" }}>استيراد من قالب التغذية</h3>
                <p style={{ margin: "4px 0 0", color: "var(--dash-text-muted)", fontSize: "14px" }}>اختر نظاماً لتطبيقه على الخطة الحالية.</p>
              </div>
              <button onClick={() => setShowLoadTemplate(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--dash-text-muted)", padding: "4px" }}><X size={24} /></button>
            </div>
            {loadingTemplates ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><RefreshCw size={32} className="spin" style={{ color: "var(--dash-primary)" }} /></div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px", paddingBottom: "20px" }}>
                {templatesList.length === 0 ? <p style={{ color: "var(--dash-text-muted)" }}>لا توجد قوالب محفوظة.</p> : templatesList.map(tmpl => (
                  <div key={tmpl.id} style={{ border: "1.5px solid var(--dash-border)", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", background: "#fff", transition: "all 0.2s", height: "380px" }} onMouseEnter={(e) => e.currentTarget.style.borderColor="var(--dash-primary)"} onMouseLeave={(e) => e.currentTarget.style.borderColor="var(--dash-border)"}>
                    <div style={{ width: "100%", height: "150px", background: "var(--dash-bg)", position: "relative", flexShrink: 0 }}>
                      {tmpl.image_url ? (
                        <img src={tmpl.image_url} alt={tmpl.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-text-soft)" }}><BookTemplate size={48} opacity={0.5} /></div>
                      )}
                    </div>
                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block", marginBottom: "6px", fontSize: "15px", fontWeight: "800", color: "var(--dash-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tmpl.name}</strong>
                      {tmpl.description ? (
                        <p style={{ fontSize: "12px", color: "var(--dash-text-muted)", margin: "0 0 12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>{tmpl.description}</p>
                      ) : (
                        <div style={{ flex: 1 }} />
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", pt: "8px", borderTop: "1px solid var(--dash-border)" }}>
                        <span style={{ fontSize: "11px", color: "var(--dash-text-soft)", fontWeight: "600" }}>{new Date(tmpl.created_at).toLocaleDateString()}</span>
                        <button onClick={() => {
                          if (!window.confirm("استيراد القالب سيقوم بتغيير الأهداف والوجبات الحالية. هل أنت متأكد؟")) return;
                          const content = tmpl.content_json;
                          if (content.targets) setTargets(content.targets);
                          if (content.rawMeals) setMeals(content.rawMeals); // Uses the raw state we will save
                          setShowLoadTemplate(false);
                        }} style={{ background: "var(--dash-primary-soft)", color: "var(--dash-primary)", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "800", cursor: "pointer", fontSize: "13px" }}>استيراد</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Target Macros */}
      <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid var(--dash-border)", padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "800", color: "var(--dash-text)" }}>
          الهدف الغذائي اليومي (اختياري)
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "var(--dash-text-muted)" }}>
          يمكنك تحديد السعرات والماكروز فقط دون الحاجة لإدخال وجبات محددة، أو استخدامها كمرجع أثناء بناء الوجبات.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", fontWeight: "700", color: "var(--dash-text)", marginBottom: "8px" }}>
              <span>السعرات الحرارية</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: "var(--dash-text-muted)" }}>{Math.round(dayTotals.cal)} /</span>
                <input type="number" value={targets.calories} onChange={(e) => setTargets({ ...targets, calories: Number(e.target.value) })} style={{ width: "60px", padding: "4px 8px", borderRadius: "8px", border: "1px solid var(--dash-border)", outline: "none", fontSize: "14px", fontWeight: "800", background: "var(--dash-bg)" }} />
              </div>
            </div>
            <div className="macro-bar"><div className="macro-bar-fill" style={{ width: Math.min((dayTotals.cal / (targets.calories || 1)) * 100, 100) + "%", background: "#024fab" }} /></div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", fontWeight: "700", color: "var(--dash-text)", marginBottom: "8px" }}>
              <span>البروتين (g)</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: "var(--dash-text-muted)" }}>{Math.round(dayTotals.p)} /</span>
                <input type="number" value={targets.protein} onChange={(e) => setTargets({ ...targets, protein: Number(e.target.value) })} style={{ width: "60px", padding: "4px 8px", borderRadius: "8px", border: "1px solid var(--dash-border)", outline: "none", fontSize: "14px", fontWeight: "800", background: "var(--dash-bg)" }} />
              </div>
            </div>
            <div className="macro-bar"><div className="macro-bar-fill" style={{ width: Math.min((dayTotals.p / (targets.protein || 1)) * 100, 100) + "%", background: "#ef4444" }} /></div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", fontWeight: "700", color: "var(--dash-text)", marginBottom: "8px" }}>
              <span>الكربوهيدرات (g)</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: "var(--dash-text-muted)" }}>{Math.round(dayTotals.c)} /</span>
                <input type="number" value={targets.carbs} onChange={(e) => setTargets({ ...targets, carbs: Number(e.target.value) })} style={{ width: "60px", padding: "4px 8px", borderRadius: "8px", border: "1px solid var(--dash-border)", outline: "none", fontSize: "14px", fontWeight: "800", background: "var(--dash-bg)" }} />
              </div>
            </div>
            <div className="macro-bar"><div className="macro-bar-fill" style={{ width: Math.min((dayTotals.c / (targets.carbs || 1)) * 100, 100) + "%", background: "#48d6f9" }} /></div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", fontWeight: "700", color: "var(--dash-text)", marginBottom: "8px" }}>
              <span>الدهون (g)</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: "var(--dash-text-muted)" }}>{Math.round(dayTotals.f)} /</span>
                <input type="number" value={targets.fats} onChange={(e) => setTargets({ ...targets, fats: Number(e.target.value) })} style={{ width: "60px", padding: "4px 8px", borderRadius: "8px", border: "1px solid var(--dash-border)", outline: "none", fontSize: "14px", fontWeight: "800", background: "var(--dash-bg)" }} />
              </div>
            </div>
            <div className="macro-bar"><div className="macro-bar-fill" style={{ width: Math.min((dayTotals.f / (targets.fats || 1)) * 100, 100) + "%", background: "#3b82f6" }} /></div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        {/* Days Sidebar */}
        <div style={{ width: "200px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={handleCopyToAllDays}
            style={{
              background: "var(--dash-primary-soft)", color: "var(--dash-primary)",
              border: "1.5px dashed var(--dash-primary)", padding: "8px", borderRadius: "10px",
              fontSize: "12px", fontWeight: "800", cursor: "pointer", width: "100%",
              fontFamily: "inherit"
            }}
          >
            📋 نسخ هذا اليوم للأسبوع كامل
          </button>
          {DAYS.map(day => (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              style={{
                background: activeDay === day.id ? "var(--dash-primary)" : "#fff",
                color: activeDay === day.id ? "#fff" : "var(--dash-text)",
                border: activeDay === day.id ? "none" : "1.5px solid var(--dash-border)",
                padding: "16px", borderRadius: "16px", fontSize: "15px", fontWeight: "800",
                cursor: "pointer", textAlign: "right", transition: "all 0.2s"
              }}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Meals Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          {currentDayMeals.map(meal => (
            <div key={meal.code} style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid var(--dash-border)", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "900", margin: 0, display: "flex", alignItems: "center", gap: "10px", color: "var(--dash-text)" }}>
                  <span>{MEAL_TYPES.find(m => m.code === meal.code)?.icon}</span>
                  {MEAL_TYPES.find(m => m.code === meal.code)?.label}
                </h3>
                <button
                  onClick={() => setSearchModalFor({ dayId: activeDay, code: meal.code })}
                  style={{ background: "var(--dash-primary-soft)", color: "var(--dash-primary)", border: "none", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Plus size={16} /> إضافة طعام
                </button>
              </div>

              {meal.items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", background: "var(--dash-bg)", borderRadius: "12px", border: "1px dashed var(--dash-border)", color: "var(--dash-text-soft)", fontSize: "14px", fontWeight: "700" }}>
                  لم يتم إضافة طعام لهذه الوجبة
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--dash-border)", color: "var(--dash-text-muted)" }}>
                      <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700" }}>الصنف</th>
                      <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700", width: "100px" }}>الكمية</th>
                      <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700", width: "120px" }}>العناصر (سعرة/ب/ك/د)</th>
                      <th style={{ padding: "12px 8px", textAlign: "center", fontWeight: "700", width: "60px" }}>حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meal.items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--dash-border)" }}>
                        <td style={{ padding: "16px 8px", fontWeight: "800", color: "var(--dash-text)" }}>
                          {it.foodItem.nameAr}
                          <div style={{ fontSize: "11px", color: "var(--dash-text-soft)", marginTop: "4px" }}>لكل {it.foodItem.unit || "100g"}</div>
                        </td>
                        <td style={{ padding: "16px 8px" }}>
                          <input type="number" step="0.1" value={it.quantity} onChange={(e) => handleChangeQty(activeDay, meal.code, idx, e.target.value)} style={{ width: "60px", padding: "6px 8px", border: "1px solid var(--dash-border)", borderRadius: "8px", outline: "none", fontSize: "14px", fontWeight: "700" }} />
                        </td>
                        <td style={{ padding: "16px 8px", fontWeight: "700", color: "var(--dash-text-muted)" }} dir="ltr">
                          <span style={{color:"#024fab"}}>{Math.round((it.foodItem.macros?.energy_kcal || 0) * it.quantity)}</span> / 
                          <span style={{color:"#ef4444"}}>{Math.round((it.foodItem.macros?.protein_g || 0) * it.quantity)}</span> / 
                          <span style={{color:"#48d6f9"}}>{Math.round((it.foodItem.macros?.carb_g || 0) * it.quantity)}</span> / 
                          <span style={{color:"#3b82f6"}}>{Math.round((it.foodItem.macros?.fat_g || 0) * it.quantity)}</span>
                        </td>
                        <td style={{ padding: "16px 8px", textAlign: "center" }}>
                          <button onClick={() => handleRemoveFood(activeDay, meal.code, idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", opacity: 0.7 }}>
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {searchModalFor && (
          <FoodSearchModal onClose={() => setSearchModalFor(null)} onSelect={handleAddFood} />
        )}
      </AnimatePresence>

    </div>
  );
}
