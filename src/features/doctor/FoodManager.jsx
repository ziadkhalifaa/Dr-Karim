import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Edit2, Trash2, X, Save, RefreshCw, Flame, Beef, Wheat, Droplet } from "lucide-react";
import { foodApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

export default function FoodManager() {
  const { t } = useTranslation();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nameAr: "",
    nameEn: "",
    unit: "100g",
    category: "general",
    macros: { energy_kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, fiber_g: 0 }
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchFoods();
    }, query ? 400 : 0);
    return () => clearTimeout(delay);
  }, [query]);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await foodApi.list(query.trim() ? `?q=${encodeURIComponent(query)}&limit=100` : "?limit=100");
      setFoods(res.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (food) => {
    setEditingId(food.id);
    setFormData({
      nameAr: food.nameAr || "",
      nameEn: food.nameEn || "",
      unit: food.unit || "100g",
      category: food.category || "general",
      macros: {
        energy_kcal: food.macros?.energy_kcal || 0,
        protein_g: food.macros?.protein_g || 0,
        carb_g: food.macros?.carb_g || 0,
        fat_g: food.macros?.fat_g || 0,
        fiber_g: food.macros?.fiber_g || 0,
      }
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      nameAr: "",
      nameEn: "",
      unit: "100g",
      category: "general",
      macros: { energy_kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, fiber_g: 0 }
    });
    setModalOpen(true);
  };

  const toast = useToast();

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف أو تعطيل "${name}"؟`)) return;
    try {
      await foodApi.delete(id);
      setFoods(foods.filter(f => f.id !== id));
      toast.success("تم حذف العنصر بنجاح");
    } catch (err) {
      toast.error(err.message || "حدث خطأ أثناء الحذف");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        unit: formData.unit,
        category: formData.category,
        macros: {
          energy_kcal: Number(formData.macros.energy_kcal) || 0,
          protein_g: Number(formData.macros.protein_g) || 0,
          carb_g: Number(formData.macros.carb_g) || 0,
          fat_g: Number(formData.macros.fat_g) || 0,
          fiber_g: Number(formData.macros.fiber_g) || 0,
        }
      };

      if (editingId) {
        await foodApi.update(editingId, payload);
        toast.success("تم تحديث بيانات الطعام بنجاح");
      } else {
        await foodApi.create(payload);
        toast.success("تم إضافة الطعام الجديد بنجاح");
      }
      setModalOpen(false);
      fetchFoods();
    } catch (err) {
      toast.error(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <h2>إدارة الأطعمة</h2>
        <button className="dash-btn dash-btn--primary" onClick={handleAdd}>
          <Plus size={18} /> إضافة طعام جديد
        </button>
      </div>

      <section className="dash-panel" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--dash-text-muted)" }} />
            <input 
              type="text" 
              className="dash-input" 
              placeholder="ابحث عن اسم الطعام..." 
              style={{ paddingRight: 40 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {error && <div style={{ color: "var(--dash-danger)", marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--dash-text-soft)" }}>
            <RefreshCw size={24} className="spin" />
          </div>
        ) : foods.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--dash-text-soft)" }}>
            لم يتم العثور على أطعمة
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>وحدة القياس</th>
                  <th>السعرات</th>
                  <th>البروتين</th>
                  <th>الكارب</th>
                  <th>الدهون</th>
                  <th style={{ width: 100 }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {foods.map(food => (
                  <tr key={food.id}>
                    <td style={{ fontWeight: 800 }}>{food.nameAr}</td>
                    <td>{food.unit}</td>
                    <td><Flame size={14} style={{ display: "inline", color: "#024fab", verticalAlign: "middle" }}/> {food.macros?.energy_kcal || 0}</td>
                    <td><Beef size={14} style={{ display: "inline", color: "#ef4444", verticalAlign: "middle" }}/> {food.macros?.protein_g || 0}g</td>
                    <td><Wheat size={14} style={{ display: "inline", color: "#48d6f9", verticalAlign: "middle" }}/> {food.macros?.carb_g || 0}g</td>
                    <td><Droplet size={14} style={{ display: "inline", color: "#3b82f6", verticalAlign: "middle" }}/> {food.macros?.fat_g || 0}g</td>
                    <td>
                      <div className="dash-row-actions">
                        <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => handleEdit(food)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => handleDelete(food.id, food.nameAr)} style={{ color: "var(--dash-danger)" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AnimatePresence>
        {modalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{ background: "var(--dash-card-bg)", width: "100%", maxWidth: 600, borderRadius: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--dash-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editingId ? "تعديل طعام" : "إضافة طعام جديد"}</h3>
                <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => setModalOpen(false)}><X size={20}/></button>
              </div>
              <div style={{ padding: 24, overflowY: "auto" }}>
                <form id="foodForm" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <label className="dash-field">
                    <span>الاسم بالعربية <span style={{color: "var(--dash-danger)"}}>*</span></span>
                    <input type="text" className="dash-input" required value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} />
                  </label>
                  
                  <div className="dash-split">
                    <label className="dash-field">
                      <span>الاسم بالإنجليزية</span>
                      <input type="text" className="dash-input" value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} />
                    </label>
                    <label className="dash-field">
                      <span>وحدة القياس <span style={{color: "var(--dash-danger)"}}>*</span></span>
                      <input type="text" className="dash-input" required placeholder="مثال: 100g, 1 cup, قطعة" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                    </label>
                  </div>

                  <h4 style={{ margin: "16px 0 8px", fontSize: 14, fontWeight: 800, color: "var(--dash-text-muted)" }}>القيم الغذائية لكل وحدة</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <label className="dash-field">
                      <span>السعرات الحرارية (kcal)</span>
                      <input type="number" step="any" min="0" className="dash-input" value={formData.macros.energy_kcal} onChange={e => setFormData({...formData, macros: {...formData.macros, energy_kcal: e.target.value}})} />
                    </label>
                    <label className="dash-field">
                      <span>البروتين (g)</span>
                      <input type="number" step="any" min="0" className="dash-input" value={formData.macros.protein_g} onChange={e => setFormData({...formData, macros: {...formData.macros, protein_g: e.target.value}})} />
                    </label>
                    <label className="dash-field">
                      <span>الكربوهيدرات (g)</span>
                      <input type="number" step="any" min="0" className="dash-input" value={formData.macros.carb_g} onChange={e => setFormData({...formData, macros: {...formData.macros, carb_g: e.target.value}})} />
                    </label>
                    <label className="dash-field">
                      <span>الدهون (g)</span>
                      <input type="number" step="any" min="0" className="dash-input" value={formData.macros.fat_g} onChange={e => setFormData({...formData, macros: {...formData.macros, fat_g: e.target.value}})} />
                    </label>
                  </div>
                </form>
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--dash-border)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setModalOpen(false)}>إلغاء</button>
                <button type="submit" form="foodForm" className="dash-btn dash-btn--primary" disabled={submitting}>
                  <Save size={18} /> حفظ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
