import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, Trash2, Loader2, Search, Image as ImageIcon } from "lucide-react";
import { servicesApi } from "../../api/client";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ServicesManager() {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", body: "", code: "", status: "active", categoryId: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, cats] = await Promise.all([
        servicesApi.doctorList("ar"),
        servicesApi.categories("ar"),
      ]);
      setServices(res.services || []);
      setCategories(cats.categories || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (svc) => {
    setEditingId(svc.id);
    setEditForm({
      title: svc.title || "",
      body: svc.body || "",
      code: svc.code || "",
      status: svc.status || "active",
      categoryId: svc.categoryId || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ title: "", body: "", code: "", status: "active", categoryId: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      alert("العنوان مطلوب");
      return;
    }
    
    setIsSaving(true);
    try {
      if (editingId === "new") {
        await servicesApi.create({
          title: editForm.title,
          body: editForm.body,
          code: editForm.code,
          serviceCategoryId: editForm.categoryId || null,
        });
      } else {
        await servicesApi.update(editingId, {
          title: editForm.title,
          body: editForm.body,
          status: editForm.status,
          serviceCategoryId: editForm.categoryId || null,
        });
      }
      await loadData();
      handleCancel();
    } catch (err) {
      alert(err.message || "Failed to save service");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;
    try {
      await servicesApi.delete(id);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to delete service");
    }
  };

  const handleCoverUpload = async (id, file) => {
    if (!file) return;
    setUploadingId(id);
    try {
      await servicesApi.uploadCover(id, file);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to upload image");
    } finally {
      setUploadingId(null);
    }
  };

  const filteredServices = services.filter((s) => 
    (s.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.code || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dash-empty">
        <Loader2 className="spinner" size={32} />
        <p>جاري تحميل الخدمات...</p>
      </div>
    );
  }

  return (
    <>
      <div className="dash-page-head">
        <h2>إدارة الخدمات</h2>
        <p>أضف أو عدل الخدمات الطبية المقدمة في الموقع</p>
      </div>

      <div className="dash-toolbar">
        <div className="dash-toolbar-search">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="ابحث عن خدمة..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="dash-btn dash-btn--primary"
          onClick={() => handleEdit({ id: "new" })}
          disabled={editingId !== null}
        >
          <Plus size={18} /> إضافة خدمة
        </button>
      </div>

      {error && <div className="dash-alert dash-alert--danger">{error}</div>}

      {editingId && (
        <div className="dash-panel" style={{ marginBottom: "2rem" }}>
          <div className="dash-panel__head">
            <h3 className="dash-panel__title">
              {editingId === "new" ? "إضافة خدمة جديدة" : "تعديل الخدمة"}
            </h3>
          </div>
          <div className="dash-panel__body">
            <form onSubmit={handleSave} className="drke-form">
              <div className="drke-form-group">
                <label>الكود الداخلي (اختياري)</label>
                <input
                  type="text"
                  className="drke-input"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  placeholder="مثال: svc-nutrition"
                  disabled={editingId !== "new"}
                />
              </div>

              <div className="drke-form-group">
                <label>اسم الخدمة *</label>
                <input
                  type="text"
                  className="drke-input"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="drke-form-group">
                <label>القسم</label>
                <select
                  className="drke-input"
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                >
                  <option value="">بدون قسم</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                  ))}
                </select>
              </div>

              <div className="drke-form-group">
                <label>الوصف</label>
                <textarea
                  className="drke-input"
                  rows={4}
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                />
              </div>

              <div className="drke-form-group">
                <label>الحالة</label>
                <select
                  className="drke-input"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="active">مفعل</option>
                  <option value="inactive">غير مفعل</option>
                </select>
              </div>

              <div className="drke-form-actions">
                <button type="button" className="dash-btn dash-btn--ghost" onClick={handleCancel}>
                  إلغاء
                </button>
                <button type="submit" className="dash-btn dash-btn--primary" disabled={isSaving}>
                  {isSaving ? <Loader2 className="spinner" size={18} /> : "حفظ التعديلات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>الصورة</th>
              <th>الخدمة</th>
              <th>القسم</th>
              <th>الحالة</th>
              <th className="dash-table-actions">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.map((svc) => (
              <tr key={svc.id}>
                <td>
                  <div style={{ position: "relative", width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {svc.coverImageUrl ? (
                      <img src={svc.coverImageUrl} alt={svc.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <ImageIcon size={20} color="#cbd5e1" />
                    )}
                    <label style={{ position: "absolute", inset: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: uploadingId === svc.id ? "rgba(255,255,255,0.7)" : "transparent" }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: "none" }}
                        onChange={(e) => handleCoverUpload(svc.id, e.target.files[0])}
                        disabled={uploadingId === svc.id}
                      />
                      {uploadingId === svc.id && <Loader2 className="spinner" size={16} color="#0f172a" />}
                    </label>
                  </div>
                </td>
                <td>
                  <div className="dash-cell-main">{svc.title}</div>
                  <div className="dash-cell-sub" style={{ maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{svc.body}</div>
                </td>
                <td className="dash-cell-muted">
                  {categories.find((c) => String(c.id) === String(svc.categoryId))?.title || svc.code}
                </td>
                <td>
                  <span className={classNames("dash-badge", svc.status === "active" ? "dash-badge--success" : "dash-badge--neutral")}>
                    {svc.status === "active" ? "مفعل" : "غير مفعل"}
                  </span>
                </td>
                <td className="dash-table-actions">
                  <div className="dash-row-actions">
                    <button
                      className="dash-btn dash-btn--ghost dash-btn--sm"
                      onClick={() => handleEdit(svc)}
                      title="تعديل"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="dash-btn dash-btn--danger dash-btn--sm dash-btn--icon-only"
                      onClick={() => handleDelete(svc.id)}
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredServices.length === 0 && (
              <tr>
                <td colSpan="5" className="dash-empty" style={{ padding: "3rem" }}>
                  <p>لا توجد خدمات مضافة حتى الآن.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
