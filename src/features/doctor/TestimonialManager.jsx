import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Quote, Plus, Edit2, Trash2, Check, X, Star } from "lucide-react";
import { testimonialAdminApi } from "../../api/client";
import StatusBadge from "../shared/StatusBadge";

export default function TestimonialManager() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await testimonialAdminApi.list();
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
      patient_name: fd.get("patient_name"),
      patient_subtitle: fd.get("patient_subtitle") || null,
      content: fd.get("content"),
      rating: parseInt(fd.get("rating"), 10) || 5,
      image_url: fd.get("image_url") || null,
      sort_order: parseInt(fd.get("sort_order"), 10) || 0,
      is_published: fd.get("is_published") === "on",
    };

    setIsSubmitting(true);
    try {
      if (editing.id) {
        await testimonialAdminApi.update(editing.id, payload);
      } else {
        await testimonialAdminApi.create(payload);
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
    if (!window.confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await testimonialAdminApi.delete(id);
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
            <Quote /> {editing.id ? "Edit Testimonial" : "Add Testimonial"}
          </h3>
          <button className="dash-btn dash-btn--ghost" onClick={() => setEditing(null)}>
            <X size={18} /> Cancel
          </button>
        </div>
        <form className="dash-panel__body dash-form" onSubmit={handleSave}>
          <div className="dash-split">
            <div className="dash-field">
              <label>Patient Name *</label>
              <input name="patient_name" className="dash-input" defaultValue={editing.patient_name} required />
            </div>
            <div className="dash-field">
              <label>Subtitle (e.g. Lost 20kg)</label>
              <input name="patient_subtitle" className="dash-input" defaultValue={editing.patient_subtitle} />
            </div>
          </div>
          <div className="dash-field">
            <label>Testimonial Content *</label>
            <textarea name="content" className="dash-input" rows={4} defaultValue={editing.content} required />
          </div>
          <div className="dash-split">
            <div className="dash-field">
              <label>Rating (1-5)</label>
              <input type="number" name="rating" className="dash-input" min={1} max={5} defaultValue={editing.rating || 5} />
            </div>
            <div className="dash-field">
              <label>Sort Order</label>
              <input type="number" name="sort_order" className="dash-input" defaultValue={editing.sort_order || 0} />
            </div>
          </div>
          <div className="dash-field">
            <label>Image URL (Optional)</label>
            <input type="url" name="image_url" className="dash-input" defaultValue={editing.image_url} />
          </div>
          <div className="dash-field dash-check">
            <label>
              <input type="checkbox" name="is_published" defaultChecked={editing.is_published} />
              Publish this testimonial on the homepage
            </label>
          </div>
          <div className="dash-form__actions" style={{ marginTop: 24 }}>
            <button type="submit" className="dash-btn dash-btn--primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Testimonial"}
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
          <Quote /> Public Testimonials
        </h3>
        <button className="dash-btn dash-btn--primary" onClick={() => setEditing({})}>
          <Plus size={18} /> Add New
        </button>
      </div>
      {items.length === 0 ? (
        <div className="dash-empty">
          <Quote />
          <p>No testimonials added yet.</p>
          <button className="dash-btn dash-btn--outline" onClick={() => setEditing({})}>
            Add First Testimonial
          </button>
        </div>
      ) : (
        <div className="dash-table-wrap dash-panel__body--flush">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Rating</th>
                <th>Content</th>
                <th>Status</th>
                <th>Sort</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.patient_name}</strong>
                    <br />
                    <span className="dash-text-soft">{t.patient_subtitle}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <span>{t.rating}</span>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.content}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={t.is_published ? "active" : "pending"} />
                  </td>
                  <td>{t.sort_order}</td>
                  <td>
                    <div className="dash-actions">
                      <button className="dash-btn-icon" onClick={() => setEditing(t)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="dash-btn-icon dash-btn-icon--danger" onClick={() => handleDelete(t.id)} title="Delete">
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
