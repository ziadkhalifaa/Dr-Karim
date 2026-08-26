import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";
import { storeApi, paymentApi } from "../../api/client";
import { navigate } from "../../lib/router";
import { ShoppingCart, CheckCircle2, Truck, CreditCard } from "lucide-react";

const fmt = (n) => `${Number(n).toLocaleString("ar-EG")} ج`;

const METHODS = [
  { key: "vodafone_cash", label: "فودافون كاش", icon: "📱", fieldKey: "vodafone_cash_number" },
  { key: "instapay", label: "إنستاباي", icon: "🏦", fieldKey: "instapay_username" },
];

export default function Checkout() {
  const cart = useCart();
  const [settings, setSettings] = useState(null);
  const [method, setMethod] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [txRef, setTxRef] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", city: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    paymentApi.settings()
      .then((cfg) => {
        setSettings(cfg);
        const available = METHODS.filter((m) => cfg?.[m.fieldKey]);
        if (available.length) setMethod(available[0].key);
      })
      .catch(() => setSettings({}));
  }, []);

  if (success) {
    return (
      <div className="st-page">
        <StoreBar />
        <div className="st-success">
          <div className="st-success__icon"><CheckCircle2 size={48} /></div>
          <h2>تم استلام طلبك!</h2>
          <p>رقم الطلب: <strong>#{success}</strong></p>
          <p className="st-success__note">تم إرسال بيانات الدفع وسيقوم فريق الدكتور كريم بمراجعتها وتأكيد الطلب قريباً.</p>
          <button className="st-btn st-btn--primary" onClick={() => navigate("/store")}>العودة للمتجر</button>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="st-page">
        <StoreBar />
        <div className="st-noresults">
          سلتك فارغة.{" "}
          <button className="st-link" onClick={() => navigate("/store")}>تصفح المنتجات ←</button>
        </div>
      </div>
    );
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setReceiptFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!customer.name.trim() || !customer.phone.trim()) { setError("الاسم ورقم الهاتف مطلوبان"); return; }
    if (!method) { setError("اختر طريقة الدفع"); return; }
    if (!senderPhone.trim()) { setError("أدخل رقم الهاتف المُرسِل"); return; }
    setSubmitting(true);
    try {
      const order = await storeApi.checkout({
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customer,
      });
      const receiptJson = receiptFile
        ? await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ mimeType: receiptFile.type, originalName: receiptFile.name, data: reader.result });
            reader.onerror = () => reject(new Error("تعذر قراءة الإيصال"));
            reader.readAsDataURL(receiptFile);
          })
        : null;
      await storeApi.pay(order.order.id, {
        method,
        senderPhone: senderPhone.trim(),
        transactionReference: txRef.trim() || undefined,
        receiptJson,
      });
      cart.clear();
      setSuccess(order.order.orderNumber);
    } catch (err) {
      setError(err.message || "فشل إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const currentMethod = METHODS.find((m) => m.key === method);
  const account = settings?.[currentMethod?.fieldKey] || "";
  const subtotal = cart.total;

  return (
    <div className="st-page">
      <StoreBar />
      <h1 className="st-checkout__title">إتمام الطلب</h1>
      <div className="st-checkout">
        <form className="st-checkout__form" onSubmit={handleSubmit}>
          <section className="st-block">
            <h3>بيانات العميل</h3>
            <div className="st-form-grid">
              <label className="st-field">
                <span>الاسم الكامل *</span>
                <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="مثال: محمد أحمد" required />
              </label>
              <label className="st-field">
                <span>رقم الهاتف *</span>
                <input dir="ltr" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="01xxxxxxxxx" required />
              </label>
              <label className="st-field">
                <span>البريد الإلكتروني</span>
                <input dir="ltr" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="email@example.com" />
              </label>
              <label className="st-field">
                <span>المدينة</span>
                <input value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} placeholder="القاهرة" />
              </label>
              <label className="st-field st-field--full">
                <span>العنوان التفصيلي</span>
                <input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="الشارع، رقم العمارة..." />
              </label>
              <label className="st-field st-field--full">
                <span>ملاحظات (اختياري)</span>
                <textarea rows="2" value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} />
              </label>
            </div>
          </section>

          <section className="st-block">
            <h3><CreditCard size={18} /> طريقة الدفع</h3>
            <div className="st-methods">
              {METHODS.filter((m) => settings?.[m.fieldKey]).map((m) => (
                <button type="button" key={m.key} className={`st-method ${method === m.key ? "is-active" : ""}`} onClick={() => setMethod(m.key)}>
                  <span className="st-method__icon">{m.icon}</span>
                  <span className="st-method__label">{m.label}</span>
                  <span className="st-method__acc" dir="ltr">{settings?.[m.fieldKey]}</span>
                </button>
              ))}
              {METHODS.every((m) => !settings?.[m.fieldKey]) && METHODS.map((m) => (
                <button type="button" key={m.key} className={`st-method ${method === m.key ? "is-active" : ""}`} onClick={() => setMethod(m.key)}>
                  <span className="st-method__icon">{m.icon}</span>
                  <span className="st-method__label">{m.label}</span>
                </button>
              ))}
            </div>

            {account && (
              <div className="st-pay-note">
                📋 ابعت <strong>{fmt(subtotal)}</strong> على الرقم/الحساب: <strong dir="ltr">{account}</strong> ثم سجّل رقم العملية.
              </div>
            )}

            <div className="st-form-grid" style={{ marginTop: 14 }}>
              <label className="st-field">
                <span>رقم الهاتف المُرسِل *</span>
                <input dir="ltr" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="01xxxxxxxxx" required />
              </label>
              <label className="st-field">
                <span>رقم العملية (اختياري)</span>
                <input dir="ltr" value={txRef} onChange={(e) => setTxRef(e.target.value)} placeholder="Transaction ID" />
              </label>
            </div>

            <div className="st-receipt" onClick={() => fileRef.current?.click()}>
              {receiptPreview ? (
                <img src={receiptPreview} alt="receipt" />
              ) : (
                <div>
                  <div style={{ fontSize: 30 }}>📎</div>
                  <p>اضغط لرفع صورة الإيصال (اختياري)</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleFile} />
            </div>
          </section>

          {error && <div className="st-error">{error}</div>}

          <button type="submit" className="st-btn st-btn--primary st-btn--block" disabled={submitting}>
            {submitting ? "جاري الإرسال..." : `تأكيد الطلب — ${fmt(subtotal)}`}
          </button>
        </form>

        <aside className="st-summary">
          <h3><ShoppingCart size={18} /> ملخص الطلب</h3>
          <div className="st-summary__items">
            {cart.items.map((i) => (
              <div key={i.productId} className="st-summary__row">
                <span>{i.name} × {i.quantity}</span>
                <strong>{fmt(i.price * i.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="st-summary__total">
            <span>الإجمالي</span>
            <strong>{fmt(subtotal)}</strong>
          </div>
          <div className="st-summary__note"><Truck size={14} /> سيتم التواصل لتأكيد الشحن بعد مراجعة الدفع.</div>
        </aside>
      </div>
    </div>
  );
}

function StoreBar() {
  return (
    <header className="st-header">
      <div className="st-header__inner">
        <button className="st-logo" onClick={() => navigate("/")}>
          <img src="/assets/logo.png" alt="د. كريم الليثي" />
        </button>
        <div style={{ flex: 1 }} />
        <button className="st-cart-btn" onClick={() => navigate("/store")}>
          <ShoppingCart size={20} />
        </button>
      </div>
    </header>
  );
}
