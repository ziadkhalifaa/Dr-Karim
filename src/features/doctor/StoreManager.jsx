import { useEffect, useState } from "react";
import { storeApi } from "../../api/client";
import {
  Plus, Pencil, Trash, X, Check, Save, ImagePlus, Package, Tag, ShoppingBag, CreditCard, MessageSquare,
} from "lucide-react";

const STATUS_LABEL = {
  active: "متاح", draft: "مسودة", out_of_stock: "نفذ",
  pending_payment: "بانتظار الدفع", paid: "مدفوع", processing: "قيد التجهيز",
  shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي",
};
const PAY_STATUS_LABEL = { pending: "بانتظار المراجعة", approved: "مقبول", rejected: "مرفوض" };

export default function StoreManager() {
  const [tab, setTab] = useState("products");
  return (
    <div>
      <div className="dash-page-head">
        <span className="dash-eyebrow"><Package /> إدارة المتجر</span>
        <h2>متجر المنتجات</h2>
        <p>أضف منتجات التخسيس والفيتامينات، تابع الطلبات والمدفوعات</p>
      </div>
      <div className="st-tabs">
        <button className={tab === "products" ? "is-active" : ""} onClick={() => setTab("products")}><Package size={16} /> المنتجات</button>
        <button className={tab === "categories" ? "is-active" : ""} onClick={() => setTab("categories")}><Tag size={16} /> التصنيفات</button>
        <button className={tab === "orders" ? "is-active" : ""} onClick={() => setTab("orders")}><ShoppingBag size={16} /> الطلبات</button>
        <button className={tab === "payments" ? "is-active" : ""} onClick={() => setTab("payments")}><CreditCard size={16} /> المدفوعات</button>
        <button className={tab === "reviews" ? "is-active" : ""} onClick={() => setTab("reviews")}><MessageSquare size={16} /> التقييمات</button>
      </div>
      {tab === "products" && <ProductsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "reviews" && <ReviewsTab />}
    </div>
  );
}

/* ============================ CATEGORIES ============================ */
function CategoriesTab() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await storeApi.doctorCategories(); setCats(r.categories || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    try {
      if (edit?.id) await storeApi.updateCategory(edit.id, data);
      else await storeApi.createCategory(data);
      setOpen(false); setEdit(null); load();
    } catch (e) { alert("خطأ: " + e.message); }
  };
  const del = async (id) => {
    if (!window.confirm("حذف التصنيف؟")) return;
    try { await storeApi.deleteCategory(id); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div style={{ textAlign: "left", marginBottom: 16 }}>
        <button className="dash-btn dash-btn--primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> تصنيف جديد</button>
      </div>
      {loading ? <div className="dash-empty">...تحميل</div> :
        <div className="st-cat-list">
          {cats.map((c) => (
            <div key={c.id} className="st-cat-row">
              <div>
                <strong>{c.name}</strong>
                <span className="st-muted"> · {c.slug}</span>
                {!c.active && <span className="st-chip st-chip--off">غير مفعل</span>}
              </div>
              <div>
                <button className="dash-btn dash-btn--ghost" onClick={() => { setEdit(c); setOpen(true); }}><Pencil size={15} /></button>
                <button className="dash-btn dash-btn--danger" onClick={() => del(c.id)}><Trash size={15} /></button>
              </div>
            </div>
          ))}
        </div>}
      {open && <CategoryModal cat={edit} onClose={() => { setOpen(false); setEdit(null); }} onSave={save} />}
    </div>
  );
}

function CategoryModal({ cat, onClose, onSave }) {
  const [form, setForm] = useState({
    name: cat?.name || "", slug: cat?.slug || "", description: cat?.description || "",
    active: cat ? cat.active : true, sortOrder: cat?.sortOrder ?? 0,
  });
  const submit = (e) => { e.preventDefault(); onSave(form); };
  return (
    <Modal onClose={onClose} title={cat ? "تعديل تصنيف" : "تصنيف جديد"}>
      <form onSubmit={submit}>
        <label className="dash-field"><span>الاسم</span>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="dash-field"><span>الرابط (slug)</span>
          <input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" /></label>
        <label className="dash-field"><span>وصف</span>
          <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <div className="dash-form--grid">
          <label className="dash-field"><span>الترتيب</span>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></label>
          <label className="dash-check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> مفعل</label>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </Modal>
  );
}

/* ============================ PRODUCTS ============================ */
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([storeApi.doctorProducts(), storeApi.doctorCategories()]);
      setProducts(p.products || []);
      setCats(c.categories || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    try {
      if (edit?.id) await storeApi.updateProduct(edit.id, data);
      else await storeApi.createProduct(data);
      setOpen(false); setEdit(null); load();
    } catch (e) { alert("خطأ: " + e.message); }
  };
  const del = async (id) => {
    if (!window.confirm("حذف المنتج؟")) return;
    try { await storeApi.deleteProduct(id); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div style={{ textAlign: "left", marginBottom: 16 }}>
        <button className="dash-btn dash-btn--primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> منتج جديد</button>
      </div>
      {loading ? <div className="dash-empty">...تحميل</div> :
        <div className="st-prod-grid">
          {products.map((p) => (
            <div key={p.id} className="st-prod-card">
              <div className="st-prod-card__img">{p.primaryImage ? <img src={p.primaryImage} alt={p.name} /> : <span>🛍️</span>}</div>
              <div className="st-prod-card__body">
                <div className="st-prod-card__name">{p.name}</div>
                <div className="st-prod-card__price">{Number(p.price).toLocaleString("ar-EG")} ج</div>
                <span className={`st-chip st-chip--${p.status === "active" ? "on" : "off"}`}>{STATUS_LABEL[p.status]}</span>
              </div>
              <div className="st-prod-card__actions">
                <button className="dash-btn dash-btn--ghost" onClick={() => { setEdit(p); setOpen(true); }}><Pencil size={15} /></button>
                <button className="dash-btn dash-btn--danger" onClick={() => del(p.id)}><Trash size={15} /></button>
              </div>
            </div>
          ))}
        </div>}
      {open && <ProductModal product={edit} categories={cats} onClose={() => { setOpen(false); setEdit(null); }} onSave={save} onChanged={load} />}
    </div>
  );
}

function ProductModal({ product, categories, onClose, onSave, onChanged }) {
  const [form, setForm] = useState({
    name: product?.name || "", categoryId: product?.categoryId || "", price: product?.price || "",
    compareAtPrice: product?.compareAtPrice ?? "", currency: product?.currency || "EGP",
    stockQuantity: product?.stockQuantity ?? 0, sku: product?.sku || "",
    status: product?.status || "active", featured: product ? product.featured : false,
    shortDescription: product?.shortDescription || "", description: product?.description || "",
    weightGrams: product?.weightGrams ?? "", sortOrder: product?.sortOrder ?? 0,
  });
  const [images, setImages] = useState(product?.images || []);
  const [uploading, setUploading] = useState(false);

  const upload = async (file) => {
    if (!product?.id) { alert("احفظ المنتج أولاً ثم أضف الصور"); return; }
    setUploading(true);
    try {
      const r = await storeApi.uploadProductImage(product.id, file);
      setImages(r.product.images || []);
      onChanged();
    } catch (e) { alert(e.message); } finally { setUploading(false); }
  };
  const removeImg = async (url) => {
    const next = images.filter((i) => i.url !== url);
    setImages(next);
    if (product?.id) { await storeApi.updateProduct(product.id, { images: next }); onChanged(); }
  };

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === "" ? null : Number(form.compareAtPrice),
      stockQuantity: Number(form.stockQuantity),
      weightGrams: form.weightGrams === "" ? null : Number(form.weightGrams),
      sortOrder: Number(form.sortOrder),
      images,
    });
  };

  return (
    <Modal onClose={onClose} title={product ? "تعديل منتج" : "منتج جديد"} wide>
      <form onSubmit={submit}>
        <div className="dash-form--grid">
          <label className="dash-field"><span>الاسم *</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="dash-field"><span>التصنيف</span>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">بدون</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <label className="dash-field"><span>السعر (ج) *</span>
            <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          <label className="dash-field"><span>السعر قبل الخصم</span>
            <input type="number" min="0" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} /></label>
          <label className="dash-field"><span>الكمية</span>
            <input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} /></label>
          <label className="dash-field"><span>SKU</span>
            <input dir="ltr" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></label>
          <label className="dash-field"><span>الحالة</span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">متاح</option><option value="draft">مسودة</option><option value="out_of_stock">نفذ</option>
            </select></label>
          <label className="dash-field"><span>الوزن (جم)</span>
            <input type="number" value={form.weightGrams} onChange={(e) => setForm({ ...form, weightGrams: e.target.value })} /></label>
        </div>

        <label className="dash-field"><span>وصف قصير</span>
          <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="جملة جذابة تظهر في البطاقة" /></label>
        <label className="dash-field"><span>الوصف التفصيلي</span>
          <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>

        <label className="dash-check" style={{ marginBottom: 12 }}>
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> منتج مميز (يظهر في الواجهة)
        </label>

        <div className="st-upload">
          <div className="st-upload__head"><ImagePlus size={16} /> صور المنتج</div>
          <div className="st-upload__grid">
            {images.map((img) => (
              <div key={img.url} className="st-upload__img">
                <img src={img.url} alt="" />
                <button type="button" onClick={() => removeImg(img.url)}><X size={14} /></button>
              </div>
            ))}
            <label className="st-upload__add">
              {uploading ? "..." : "+"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
          </div>
        </div>

        <ModalActions onClose={onClose} />
      </form>
    </Modal>
  );
}

/* ============================ ORDERS ============================ */
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await storeApi.doctorOrders(filter ? `?status=${filter}` : ""); setOrders(r.orders || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const openDetail = async (id) => { try { const r = await storeApi.doctorOrder(id); setDetail(r.order); } catch (e) { alert(e.message); } };
  const setStatus = async (id, status) => { await storeApi.updateOrderStatus(id, status); setDetail(null); load(); openDetail(id); };

  return (
    <div>
      <div className="st-filter">
        <button className={!filter ? "is-active" : ""} onClick={() => setFilter("")}>الكل</button>
        {["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled"].map((s) => (
          <button key={s} className={filter === s ? "is-active" : ""} onClick={() => setFilter(s)}>{STATUS_LABEL[s]}</button>
        ))}
      </div>
      {loading ? <div className="dash-empty">...تحميل</div> :
        <div className="st-table-wrap">
          <table className="dash-table">
            <thead><tr><th>رقم الطلب</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.orderNumber}</strong></td>
                  <td>{o.customerName}<br /><span className="st-muted" dir="ltr">{o.customerPhone}</span></td>
                  <td>{Number(o.subtotal).toLocaleString("ar-EG")} ج</td>
                  <td><span className={`st-chip st-chip--${o.status === "cancelled" ? "off" : "on"}`}>{STATUS_LABEL[o.status]}</span></td>
                  <td><button className="dash-btn dash-btn--ghost" onClick={() => openDetail(o.id)}>عرض</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      {detail && <OrderModal order={detail} onClose={() => setDetail(null)} onStatus={(s) => setStatus(detail.id, s)} />}
    </div>
  );
}

function OrderModal({ order, onClose, onStatus }) {
  return (
    <Modal onClose={onClose} title={`طلب #${order.orderNumber}`} wide>
      <div className="st-od">
        <div><strong>العميل:</strong> {order.customerName} — <span dir="ltr">{order.customerPhone}</span></div>
        {order.city && <div><strong>المدينة:</strong> {order.city}</div>}
        {order.address && <div><strong>العنوان:</strong> {order.address}</div>}
        {order.notes && <div><strong>ملاحظات:</strong> {order.notes}</div>}
      </div>
      <table className="dash-table">
        <thead><tr><th>المنتج</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id}><td>{i.name}</td><td>{Number(i.price).toLocaleString("ar-EG")}</td><td>{i.quantity}</td><td>{Number(i.lineTotal).toLocaleString("ar-EG")}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="st-od__total">الإجمالي: <strong>{Number(order.subtotal).toLocaleString("ar-EG")} ج</strong></div>
      {order.payments?.length > 0 && (
        <div className="st-od__pay">
          <strong>المدفوعات:</strong>
          {order.payments.map((p) => (
            <div key={p.id} className="st-pay-line">
              {p.method === "vodafone_cash" ? "فودافون كاش" : "إنستاباي"} — {Number(p.amount).toLocaleString("ar-EG")} ج — {PAY_STATUS_LABEL[p.status]}
              {p.transactionReference && <span dir="ltr"> (#{p.transactionReference})</span>}
            </div>
          ))}
        </div>
      )}
      <div className="st-od__status">
        <span>تحديث الحالة:</span>
        {["paid", "processing", "shipped", "delivered", "cancelled"].map((s) => (
          <button key={s} className="dash-btn dash-btn--ghost" onClick={() => onStatus(s)}>{STATUS_LABEL[s]}</button>
        ))}
      </div>
    </Modal>
  );
}

/* ============================ PAYMENTS ============================ */
function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try { const r = await storeApi.doctorPayments("?status=pending"); setPayments(r.payments || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const review = async (id, action, reason) => {
    try { await storeApi.reviewPayment(id, action, reason); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      {loading ? <div className="dash-empty">...تحميل</div> :
        payments.length === 0 ? <div className="dash-empty">لا توجد مدفوعات بانتظار المراجعة</div> :
          <div className="st-pay-list">
            {payments.map((p) => (
              <div key={p.id} className="st-pay-card">
                <div className="st-pay-card__top">
                  <strong>{Number(p.amount).toLocaleString("ar-EG")} ج</strong>
                  <span className="st-chip st-chip--on">{p.method === "vodafone_cash" ? "فودافون كاش" : "إنستاباي"}</span>
                </div>
                <div className="st-muted">طلب #{p.orderNumber} — {p.customerName}</div>
                <div className="st-muted" dir="ltr">هاتف المُرسِل: {p.senderPhone}</div>
                {p.transactionReference && <div className="st-muted" dir="ltr">عملية: {p.transactionReference}</div>}
                <div className="st-pay-card__actions">
                  <button className="dash-btn dash-btn--success" onClick={() => review(p.id, "approve")}><Check size={15} /> قبول</button>
                  <button className="dash-btn dash-btn--danger" onClick={() => { const r = window.prompt("سبب الرفض"); if (r !== null) review(p.id, "reject", r); }}><X size={15} /> رفض</button>
                </div>
              </div>
            ))}
          </div>}
    </div>
  );
}

/* ============================ REVIEWS ============================ */
function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await storeApi.doctorReviews(); setReviews(r.reviews || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const sendReply = async (id, reply) => {
    try { await storeApi.doctorReviewReply(id, reply); setReplyTo(null); load(); }
    catch (e) { alert(e.message); }
  };
  const del = async (id) => {
    if (!window.confirm("حذف التقييم؟")) return;
    try { await storeApi.deleteReview(id); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      {loading ? <div className="dash-empty">...تحميل</div> :
        reviews.length === 0 ? <div className="dash-empty">لا توجد تقييمات بعد</div> :
          <div className="st-rev-list">
            {reviews.map((rv) => (
              <div key={rv.id} className="st-rev-card">
                <div className="st-rev-card__head">
                  <span className="st-card__stars">{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</span>
                  <strong>{rv.authorName}</strong>
                  <span className="st-muted">{rv.productName}</span>
                </div>
                {rv.comment && <p className="st-rev-card__body">{rv.comment}</p>}
                {rv.images?.length > 0 && (
                  <div className="st-review__imgs">
                    {rv.images.map((img, i) => (
                      <a key={i} href={img.url} target="_blank" rel="noreferrer" className="st-review__img"><img src={img.url} alt="" /></a>
                    ))}
                  </div>
                )}
                {rv.doctorReply ? (
                  <div className="st-review__reply">
                    <span className="st-review__reply-by">رد الدكتور</span>
                    <p>{rv.doctorReply}</p>
                    <button className="dash-btn dash-btn--ghost" onClick={() => setReplyTo(rv)}>تعديل الرد</button>
                  </div>
                ) : (
                  <div className="st-rev-card__actions">
                    <button className="dash-btn dash-btn--primary" onClick={() => setReplyTo(rv)}>رد</button>
                    <button className="dash-btn dash-btn--danger" onClick={() => del(rv.id)}><Trash size={15} /></button>
                  </div>
                )}
                {replyTo?.id === rv.id && (
                  <ReplyBox
                    initial={rv.doctorReply || ""}
                    onCancel={() => setReplyTo(null)}
                    onSend={(reply) => sendReply(rv.id, reply)}
                  />
                )}
              </div>
            ))}
          </div>}
    </div>
  );
}

function ReplyBox({ initial, onCancel, onSend }) {
  const [text, setText] = useState(initial);
  return (
    <div className="st-reply-box">
      <textarea className="st-input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="رد الدكتور على التقييم" />
      <div className="st-modal__actions">
        <button className="dash-btn dash-btn--ghost" onClick={onCancel}>إلغاء</button>
        <button className="dash-btn dash-btn--primary" onClick={() => onSend(text)}>إرسال الرد</button>
      </div>
    </div>
  );
}

/* ============================ SHARED UI ============================ */
function Modal({ onClose, title, wide, children }) {
  return (
    <div className="st-modal-overlay" onClick={onClose}>
      <div className={`st-modal ${wide ? "st-modal--wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="st-modal__head">
          <h3>{title}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="st-modal__body">{children}</div>
      </div>
    </div>
  );
}
function ModalActions({ onClose }) {
  return (
    <div className="st-modal__actions">
      <button type="button" className="dash-btn dash-btn--ghost" onClick={onClose}>إلغاء</button>
      <button type="submit" className="dash-btn dash-btn--primary"><Save size={16} /> حفظ</button>
    </div>
  );
}
