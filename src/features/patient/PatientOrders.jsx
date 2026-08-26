import { useEffect, useState } from "react";
import { ShoppingBag, Package } from "lucide-react";
import { storeApi } from "../../api/client";

const STATUS_LABEL = {
  pending_payment: "بانتظار الدفع",
  paid: "مدفوع",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};
const PAY_STATUS_LABEL = { pending: "بانتظار المراجعة", approved: "مقبول", rejected: "مرفوض" };

const fmt = (n) => `${Number(n).toLocaleString("ar-EG")} ج`;

export default function PatientOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await storeApi.patientOrders();
      setOrders(r.orders || []);
    } catch (e) {
      setErr(e.message || "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    try {
      const r = await storeApi.patientOrder(id);
      setDetail(r.order);
    } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <div className="dash-page-head">
        <span className="dash-eyebrow"><ShoppingBag /> طلباتي</span>
        <h2>طلباتي</h2>
        <p>تابع حالة طلباتك والدفع من هنا.</p>
      </div>

      {err && <div className="st-error">{err}</div>}
      {loading ? (
        <div className="dash-empty">...تحميل</div>
      ) : orders.length === 0 ? (
        <div className="st-noresults">لا توجد طلبات بعد.</div>
      ) : (
        <div className="st-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>التاريخ</th>
                <th>الإجمالي</th>
                <th>حالة الطلب</th>
                <th>حالة الدفع</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>#{o.orderNumber}</strong></td>
                  <td>{new Date(o.createdAt).toLocaleDateString("ar-EG")}</td>
                  <td>{fmt(o.subtotal)}</td>
                  <td><span className={`st-chip st-chip--${o.status === "cancelled" ? "off" : "on"}`}>{STATUS_LABEL[o.status]}</span></td>
                  <td>
                    {o.paymentStatus
                      ? <span className={`st-chip st-chip--${o.paymentStatus === "approved" ? "on" : "off"}`}>{PAY_STATUS_LABEL[o.paymentStatus]}</span>
                      : <span className="st-muted">—</span>}
                  </td>
                  <td><button className="dash-btn dash-btn--ghost" onClick={() => openDetail(o.id)}>عرض</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="st-modal-overlay" onClick={() => setDetail(null)}>
          <div className="st-modal st-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="st-modal__head">
              <h3>طلب #{detail.orderNumber}</h3>
              <button onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="st-modal__body">
              <div className="st-od">
                <div><strong>الحالة:</strong> {STATUS_LABEL[detail.status]}</div>
                <div><strong>الاسم:</strong> {detail.customerName}</div>
                <div><strong>الهاتف:</strong> <span dir="ltr">{detail.customerPhone}</span></div>
                {detail.city && <div><strong>المدينة:</strong> {detail.city}</div>}
                {detail.address && <div><strong>العنوان:</strong> {detail.address}</div>}
                {detail.notes && <div><strong>ملاحظات:</strong> {detail.notes}</div>}
              </div>
              <table className="dash-table">
                <thead><tr><th>المنتج</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
                <tbody>
                  {detail.items.map((i) => (
                    <tr key={i.id}><td>{i.name}</td><td>{fmt(i.price)}</td><td>{i.quantity}</td><td>{fmt(i.lineTotal)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="st-od__total">الإجمالي: <strong>{fmt(detail.subtotal)}</strong></div>
              {detail.payments?.length > 0 && (
                <div className="st-od__pay">
                  <strong>المدفوعات:</strong>
                  {detail.payments.map((p) => (
                    <div key={p.id} className="st-pay-line">
                      {p.method === "vodafone_cash" ? "فودافون كاش" : "إنستاباي"} — {fmt(p.amount)} — {PAY_STATUS_LABEL[p.status]}
                      {p.transactionReference && <span dir="ltr"> (#{p.transactionReference})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="st-modal__actions">
              <button className="dash-btn dash-btn--ghost" onClick={() => setDetail(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
