import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Ticket, Plus, Edit2, Trash2, X } from "lucide-react";
import { couponApi } from "../../api/client";
import StatusBadge from "../shared/StatusBadge";

export default function CouponsManager() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await couponApi.list();
      setItems(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      code: fd.get("code"),
      discount_type: fd.get("discount_type"),
      discount_value: parseFloat(fd.get("discount_value")),
      max_uses: fd.get("max_uses") ? parseInt(fd.get("max_uses"), 10) : null,
      expires_at: fd.get("expires_at") || null,
      active: fd.get("active") === "on",
    };

    setIsSubmitting(true);
    try {
      if (editing.id) {
        await couponApi.update(editing.id, payload);
      } else {
        await couponApi.create(payload);
      }
      setEditing(null);
      loadItems();
    } catch (err) {
      alert("Failed to save: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await couponApi.delete(id);
      loadItems();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  if (loading) return <div className="dash-empty">Loading...</div>;

  if (editing) {
    return (
      <div className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <Ticket /> {editing.id ? "Edit Coupon" : "Add Coupon"}
          </h3>
          <button className="dash-btn dash-btn--ghost" onClick={() => setEditing(null)}>
            <X size={18} /> Cancel
          </button>
        </div>
        <form className="dash-panel__body dash-form" onSubmit={handleSave}>
          <div className="dash-split">
            <div className="dash-field">
              <label>Coupon Code *</label>
              <input name="code" className="dash-input" defaultValue={editing.code} required placeholder="e.g. SUMMER20" />
            </div>
            <div className="dash-field">
              <label>Discount Type *</label>
              <select name="discount_type" className="dash-input" defaultValue={editing.discount_type || "percentage"}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (EGP)</option>
              </select>
            </div>
          </div>
          <div className="dash-split">
            <div className="dash-field">
              <label>Discount Value *</label>
              <input type="number" step="0.01" name="discount_value" className="dash-input" defaultValue={editing.discount_value} required />
            </div>
            <div className="dash-field">
              <label>Max Uses (optional)</label>
              <input type="number" name="max_uses" className="dash-input" defaultValue={editing.max_uses} placeholder="Unlimited if empty" />
            </div>
          </div>
          <div className="dash-field">
            <label>Expiry Date (optional)</label>
            <input type="date" name="expires_at" className="dash-input" defaultValue={editing.expires_at ? editing.expires_at.split('T')[0] : ""} />
          </div>
          <div className="dash-field dash-check">
            <label>
              <input type="checkbox" name="active" defaultChecked={editing.active !== false} />
              Active
            </label>
          </div>
          <div className="dash-form__actions" style={{ marginTop: 24 }}>
            <button type="submit" className="dash-btn dash-btn--primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Coupon"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <Ticket /> Promo Codes
        </h3>
        <button className="dash-btn dash-btn--primary" onClick={() => setEditing({})}>
          <Plus size={18} /> Add New
        </button>
      </div>
      {items.length === 0 ? (
        <div className="dash-empty">
          <Ticket />
          <p>No coupons found.</p>
          <button className="dash-btn dash-btn--outline" onClick={() => setEditing({})}>
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="dash-table-wrap dash-panel__body--flush">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value} EGP`}</td>
                  <td>{c.used_count} / {c.max_uses || "∞"}</td>
                  <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td>
                  <td>
                    <StatusBadge status={c.active ? "active" : "disabled"} />
                  </td>
                  <td>
                    <div className="dash-actions">
                      <button className="dash-btn-icon" onClick={() => setEditing(c)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="dash-btn-icon dash-btn-icon--danger" onClick={() => handleDelete(c.id)} title="Delete">
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
    </div>
  );
}
