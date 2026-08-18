import { useState, useEffect } from "react";
import { Plus, Pencil, Trash, Check, X } from "lucide-react";
import { packageAdminApi } from "../../api/client";
import { ENTITLEMENTS, featureLabel } from "../../constants/entitlements";

export default function PackagesManager() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPkg, setEditingPkg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await packageAdminApi.list();
      setPackages(data?.packages || []);
    } catch (err) {
      setError(err.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pkgData) => {
    try {
      if (editingPkg?.id) {
        await packageAdminApi.update(editingPkg.id, pkgData);
      } else {
        await packageAdminApi.create(pkgData);
      }
      setIsModalOpen(false);
      setEditingPkg(null);
      fetchPackages();
    } catch (err) {
      alert("خطأ في الحفظ: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الباقة؟")) return;
    try {
      await packageAdminApi.delete(id);
      fetchPackages();
    } catch (err) {
      alert("خطأ في الحذف: " + err.message);
    }
  };

  if (loading) return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--dash-line)", borderTopColor: "var(--dash-primary)", animation: "spin 0.8s linear infinite", margin: "auto" }} />
    </div>
  );

  if (error) return <div style={{ padding: "24px", color: "var(--dash-danger)", background: "rgba(239,68,68,0.1)", borderRadius: "16px", margin: "24px" }}>{error}</div>;

  return (
    <div>
      {/* Page Header */}
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <Plus />
          إدارة الباقات
        </span>
        <h2>باقات المتابعة</h2>
        <p>أنشئ وعدّل باقات المتابعة التي تظهر للزوار على الموقع</p>
      </div>

      {/* Add Button */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "flex-end" }}>
        <button
          className="dash-btn dash-btn--primary"
          onClick={() => { setEditingPkg(null); setIsModalOpen(true); }}
        >
          <Plus size={18} />
          إضافة باقة جديدة
        </button>
      </div>

      {/* Packages Grid */}
      {packages.length === 0 ? (
        <div className="dash-empty">
          <p>لا توجد باقات بعد. ابدأ بإضافة أولى باقاتك.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="dash-panel"
              style={{
                position: "relative",
                opacity: pkg.active ? 1 : 0.6,
                borderTop: "3px solid var(--dash-primary)",
              }}
            >
              {!pkg.active && (
                <div style={{
                  position: "absolute", top: "12px", insetInlineEnd: "12px",
                  background: "var(--dash-danger)", color: "#fff",
                  padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700"
                }}>
                  غير مفعل
                </div>
              )}

              <div className="dash-panel__head" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                <h3 className="dash-panel__title">{pkg.name}</h3>
                <p style={{ fontSize: "14px", color: "var(--dash-text-muted)", marginTop: "4px" }}>{pkg.description}</p>
              </div>

              <div className="dash-panel__body">
                {/* Price */}
                <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--dash-primary)", marginBottom: "16px" }}>
                  {pkg.price} <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--dash-text-muted)" }}>
                    {pkg.currency} / {pkg.durationValue} {pkg.durationUnit === "month" ? "شهر" : pkg.durationUnit === "week" ? "أسبوع" : "مرة"}
                  </span>
                </div>

                {/* Features */}
                {pkg.features?.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {pkg.features.map((f, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--dash-text)" }}>
                        <Check size={14} style={{ color: "var(--dash-success)", flexShrink: 0 }} />
                        {featureLabel(f)}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                  <button
                    className="dash-btn dash-btn--ghost"
                    style={{ flex: 1 }}
                    onClick={() => { setEditingPkg(pkg); setIsModalOpen(true); }}
                  >
                    <Pencil size={15} /> تعديل
                  </button>
                  <button
                    className="dash-btn dash-btn--danger"
                    onClick={() => handleDelete(pkg.id)}
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <PackageModal
          pkg={editingPkg}
          onClose={() => { setIsModalOpen(false); setEditingPkg(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ─── Package Modal ─────────────────────────────────────────────────── */
function PackageModal({ pkg, onClose, onSave }) {
  const featureObjects = (pkg?.features || []).map(f => (typeof f === "object" ? f : { code: f }));
  const [formData, setFormData] = useState({
    name: pkg?.name || "",
    slug: pkg?.slug || "",
    description: pkg?.description || "",
    price: pkg?.price || "",
    durationValue: pkg?.durationValue || 1,
    durationUnit: pkg?.durationUnit || "month",
    active: pkg ? pkg.active : true,
    features: featureObjects.map(f => f.code).filter(Boolean),
  });
  const [quotas, setQuotas] = useState(
    Object.fromEntries(
      featureObjects.filter(f => f.code === "live_session").map(f => [
        f.code,
        { limit: f.limitValue ?? "", period: f.periodUnit || "week" },
      ])
    )
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanFeatures = formData.features
      .filter(f => f.trim())
      .map(f => {
        const quota = quotas[f];
        return {
          code: f,
          allowed: true,
          ...(quota && quota.limit !== "" ? { limitValue: Number(quota.limit), periodUnit: quota.period || "week" } : {}),
        };
      });
    onSave({ ...formData, features: cleanFeatures });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.55)", padding: "20px"
    }}>
      <div style={{
        background: "var(--dash-bg)", borderRadius: "24px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        width: "100%", maxWidth: "640px",
        maxHeight: "90vh", overflowY: "auto",
        border: "1px solid var(--dash-line)"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "24px 28px", borderBottom: "1px solid var(--dash-line)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "var(--dash-bg)", zIndex: 1, borderRadius: "24px 24px 0 0"
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--dash-text)" }}>
            {pkg ? "تعديل باقة" : "إضافة باقة جديدة"}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--dash-text-muted)", cursor: "pointer", padding: "4px" }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <label className="dash-field">
              <span>اسم الباقة (عربي)</span>
              <input
                required
                type="text"
                className="dash-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: الباقة الذهبية"
              />
            </label>
            <label className="dash-field">
              <span>الرمز (انجليزي)</span>
              <input
                required
                type="text"
                className="dash-input"
                style={{ direction: "ltr", textAlign: "left" }}
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="gold"
              />
            </label>
          </div>

          <label className="dash-field" style={{ marginBottom: "16px" }}>
            <span>وصف مختصر</span>
            <textarea
              className="dash-textarea"
              rows="2"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف قصير للباقة..."
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <label className="dash-field">
              <span>السعر (جنية)</span>
              <input
                required
                type="number"
                min="0"
                className="dash-input"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </label>
            <label className="dash-field">
              <span>المدة</span>
              <input
                required
                type="number"
                min="1"
                className="dash-input"
                value={formData.durationValue}
                onChange={e => setFormData({ ...formData, durationValue: e.target.value })}
              />
            </label>
            <label className="dash-field">
              <span>الوحدة</span>
              <select
                className="dash-input"
                value={formData.durationUnit}
                onChange={e => setFormData({ ...formData, durationUnit: e.target.value })}
              >
                <option value="month">شهر</option>
                <option value="week">أسبوع</option>
                <option value="one_time">مرة واحدة</option>
              </select>
            </label>
          </div>

          {/* Features */}
          <div style={{ marginBottom: "24px" }}>
            <span style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "12px" }}>
              المميزات والخدمات المشمولة في الباقة
            </span>

            {/* Standard entitlement codes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", marginBottom: "16px" }}>
              {ENTITLEMENTS.map((ent) => {
                const enabled = formData.features.includes(ent.code);
                return (
                  <label
                    key={ent.code}
                    className="dash-check"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "6px",
                      padding: "12px 14px",
                      background: "var(--dash-surface)",
                      borderRadius: "12px",
                      border: "1.5px solid " + (enabled ? "var(--dash-primary)" : "var(--dash-line)"),
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => {
                        const next = enabled
                          ? formData.features.filter((f) => f !== ent.code)
                          : [...formData.features, ent.code];
                        setFormData({ ...formData, features: next });
                      }}
                    />
                    <span style={{ fontWeight: "800", fontSize: "13.5px", color: "var(--dash-text)" }}>{ent.label}</span>
                    <span style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--dash-text-muted)" }}>{ent.hint}</span>
                    {ent.code === "live_session" && enabled && (
                      <div style={{ display: "flex", gap: "8px", width: "100%", marginTop: "6px" }}>
                        <input
                          type="number"
                          min="1"
                          className="dash-input"
                          style={{ width: "70px", padding: "6px 8px" }}
                          placeholder="حد"
                          title="عدد الجلسات المسموح بها في الفترة"
                          value={quotas.live_session?.limit ?? ""}
                          onChange={(e) => setQuotas(q => ({ ...q, live_session: { ...(q.live_session || {}), limit: e.target.value, period: (q.live_session || {}).period || "week" } }))}
                        />
                        <select
                          className="dash-input"
                          style={{ flex: 1, padding: "6px 8px" }}
                          value={quotas.live_session?.period || "week"}
                          onChange={(e) => setQuotas(q => ({ ...q, live_session: { ...(q.live_session || {}), period: e.target.value } }))}
                        >
                          <option value="week">جلسات / أسبوع</option>
                          <option value="month">جلسات / شهر</option>
                        </select>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Custom / extra feature codes */}
            <span style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "10px" }}>
              ميزات إضافية (كود مخصص بالإنجليزي — اختياري)
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {formData.features.filter((f) => !ENTITLEMENTS.some((e) => e.code === f)).map((f, i) => (
                <div key={`custom-${i}`} style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="dash-input"
                    style={{ flex: 1 }}
                    placeholder="مثال: gym_access"
                    value={f}
                    onChange={(e) => {
                      const next = [...formData.features];
                      const idx = next.indexOf(f);
                      if (idx !== -1) next[idx] = e.target.value;
                      setFormData({ ...formData, features: next });
                    }}
                  />
                  <button
                    type="button"
                    className="dash-btn dash-btn--ghost"
                    style={{ color: "var(--dash-danger)" }}
                    onClick={() => {
                      setFormData({ ...formData, features: formData.features.filter((x) => x !== f) });
                    }}
                  >
                    <Trash size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                style={{ width: "100%", borderStyle: "dashed" }}
                onClick={() => setFormData({ ...formData, features: [...formData.features, ""] })}
              >
                <Plus size={16} /> إضافة ميزة مخصصة
              </button>
            </div>
          </div>

          {/* Active Toggle */}
          <label className="dash-check" style={{ marginBottom: "28px", padding: "16px", background: "var(--dash-surface)", borderRadius: "12px" }}>
            <input
              type="checkbox"
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
            />
            <span>تفعيل الباقة (تظهر للزوار على الموقع)</span>
          </label>

          {/* Submit */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid var(--dash-line)" }}>
            <button type="button" className="dash-btn dash-btn--ghost" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="dash-btn dash-btn--primary">
              <Check size={16} />
              حفظ الباقة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
