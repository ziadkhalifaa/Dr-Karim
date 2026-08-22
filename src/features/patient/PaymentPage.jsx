import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { paymentApi, patientApi } from "../../api/client";
import { useAuth } from "../../context/AuthProvider";
import { navigate } from "../../lib/router";

function usePackageId(path) {
  const params = new URLSearchParams((path || "").split("?")[1] || "");
  return params.get("packageId");
}

const METHODS = [
  { key: "vodafone_cash", label: "فودافون كاش", icon: "📱", fieldKey: "vodafone_cash_number" },
  { key: "instapay", label: "إنستاباي", icon: "🏦", fieldKey: "instapay_username" },
];

const STEPS = ["اختيار طريقة الدفع", "تأكيد وإرسال الإيصال", "انتظار الموافقة"];

export default function PaymentPage({ path }) {
  const packageId = usePackageId(path);
  const [pkg, setPkg] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [txRef, setTxRef] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const fileRef = useRef();
  const { user } = useAuth();

  useEffect(() => {
    if (!packageId) { setLoading(false); return; }
    (async () => {
      try {
        const [p, cfg] = await Promise.all([
          paymentApi.package(packageId),
          paymentApi.settings().catch(() => null),
        ]);
        setPkg(p);
        setSettings(cfg);
        // Auto-select first available method
        const available = METHODS.filter((m) => cfg?.[m.fieldKey]);
        if (available.length > 0) setMethod(available[0].key);

        // Compute prorated upgrade amount (server-authoritative on submit)
        if (user?.patientId && p?.slug) {
          try {
            const home = await patientApi.home();
            const sub = home?.subscription;
            if (sub?.package?.slug && sub.startsAt && sub.package.slug !== p.slug) {
              const all = (await paymentApi.packages()) || [];
              const current = all.find((x) => x.slug === sub.package.slug);
              if (current && Number(p.price) > Number(current.price)) {
                const starts = new Date(sub.startsAt).getTime();
                const ends = sub.endsAt ? new Date(sub.endsAt).getTime() : null;
                if (!Number.isNaN(starts)) {
                  const totalDays = ends && !Number.isNaN(ends)
                    ? Math.max(1, Math.round((ends - starts) / 86400000))
                    : (current.durationValue || 1) * (current.durationUnit === "week" ? 7 : 30);
                  const usedDays = Math.max(0, Math.round((Date.now() - starts) / 86400000));
                  const frac = Math.max(0, Math.min(1, (totalDays - usedDays) / totalDays));
                  const remainingValue = Math.round(Number(current.price) * frac);
                  const upgraded = Math.max(0, Math.round(Number(p.price) - remainingValue));
                  setUpgradeInfo({ currentName: current.name, remainingValue, upgraded, originalAmount: Number(p.price) });
                }
              }
            }
          } catch { /* e.g. no active subscription */ }
        }
      } catch (e) {
        setError(e.message || "فشل تحميل تفاصيل الباقة");
      } finally {
        setLoading(false);
      }
    })();
  }, [packageId, user?.patientId]);

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
    if (!method) { setError("اختر طريقة الدفع"); return; }
    if (!senderPhone.trim()) { setError("أدخل رقم الهاتف المُرسِل"); return; }
    if (upgradeInfo?.upgraded <= 0) { setError("قيمة رصيد باقتك الحالية تغطي هذه الباقة بالكامل — لا تحتاج للدفع."); return; }
    setError("");
    setSubmitting(true);
    try {
      const payment = await paymentApi.create({
        packageId: Number(packageId),
        method,
        senderPhone: senderPhone.trim(),
        transactionReference: txRef.trim() || undefined,
      });
      if (receiptFile) {
        // The API expects JSON { mimeType, data } with a base64 data URL —
        // not multipart FormData.
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("تعذر قراءة ملف الإيصال"));
          reader.readAsDataURL(receiptFile);
        });
        await paymentApi.receipt(payment.id, {
          mimeType: receiptFile.type,
          originalName: receiptFile.name,
          data: dataUrl,
        });
      }
      setSuccess(true);
    } catch (e) {
      setError(e.message || "فشل إرسال الدفع");
    } finally {
      setSubmitting(false);
    }
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "var(--bg)",
    backgroundImage: "radial-gradient(ellipse at 80% 0%, rgba(111,208,5,0.08) 0%, transparent 50%)",
    fontFamily: "var(--font-body)",
    direction: "rtl",
  };

  const topbarStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 32px", borderBottom: "1px solid var(--line)",
    background: "var(--card-bg)", backdropFilter: "blur(12px)",
    position: "sticky", top: 0, zIndex: 30,
  };

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid var(--line)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={topbarStyle}><img src="/assets/logo.png" alt="د. كريم الليثي" style={{ height: 44, width: "auto", objectFit: "contain" }} /></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "20px" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            style={{ background: "var(--card-bg)", border: "1px solid var(--line)", borderRadius: "28px", padding: "48px", textAlign: "center", maxWidth: "480px", boxShadow: "var(--shadow-lg)" }}
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
              style={{ width: 80, height: 80, borderRadius: "50%", background: "#e6fbc2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "36px" }}
            >
              ✅
            </motion.div>
            <h2 style={{ fontSize: "28px", fontWeight: "900", color: "var(--text)", marginBottom: "12px" }}>تم إرسال الدفع!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: "1.7", marginBottom: "32px" }}>
              شكراً لك! سيقوم الدكتور كريم بمراجعة الدفع وتفعيل برنامجك في أقرب وقت. ستصلك رسالة تأكيد عند الموافقة.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/patient")}
                style={{ padding: "16px 24px", borderRadius: "14px", border: "none", background: "var(--primary)", color: "#fff", fontSize: "16px", fontWeight: "800", cursor: "pointer", fontFamily: "inherit" }}>
                الذهاب للوحة التحكم
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentMethod = METHODS.find((m) => m.key === method);
  const currentMethodAccount = settings?.[currentMethod?.fieldKey] || "";

  return (
    <div style={pageStyle}>
      <div style={topbarStyle}>
        <img src="/assets/logo.png" alt="د. كريم الليثي" style={{ height: 44, width: "auto", objectFit: "contain" }} />
        <button onClick={() => navigate("/packages")}
          style={{ background: "var(--bg-soft)", border: "1px solid var(--line)", color: "var(--text)", padding: "10px 18px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit" }}>
          ← تغيير الباقة
        </button>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Progress Steps */}
        <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "40px" }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "13px", background: i === 0 ? "var(--primary)" : "var(--bg-soft)", color: i === 0 ? "#fff" : "var(--text-muted)", border: "2px solid " + (i === 0 ? "var(--primary)" : "var(--line)") }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: i === 0 ? "var(--primary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: "2px", background: "var(--line)", margin: "0 8px", marginBottom: "20px" }} />}
            </div>
          ))}
        </div>

        {/* Package Summary */}
        {pkg && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, #3ca503 100%)", borderRadius: "20px", padding: "24px", color: "#fff", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.1em", opacity: 0.8, textTransform: "uppercase", marginBottom: "6px" }}>{upgradeInfo ? "ترقية الباقة" : "الباقة المختارة"}</div>
              <div style={{ fontSize: "22px", fontWeight: "900" }}>{pkg.name}</div>
              {upgradeInfo && (
                <div style={{ fontSize: "13px", fontWeight: "700", opacity: 0.9, marginTop: "4px" }}>ترقية من: {upgradeInfo.currentName}</div>
              )}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "36px", fontWeight: "900", lineHeight: "1" }}>{(upgradeInfo ? upgradeInfo.upgraded : Number(pkg.price)).toLocaleString("ar-EG")}</div>
              <div style={{ fontSize: "14px", opacity: 0.8, fontWeight: "700" }}>{pkg.currency || "EGP"}</div>
              {upgradeInfo && (
                <div style={{ fontSize: "12px", opacity: 0.85, textDecoration: "line-through", marginTop: "4px" }}>السعر الأصلي: {upgradeInfo.originalAmount.toLocaleString("ar-EG")}</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Prorated upgrade note */}
        {upgradeInfo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "#e6fbc2", border: "1.5px solid #c2f753", color: "#2e7d00", borderRadius: "14px", padding: "14px 18px", marginBottom: "28px", fontSize: "13.5px", fontWeight: "700", lineHeight: "1.8" }}>
            ✓ هذا المبلغ هو <strong>فرق الترقية فقط</strong> — خُصمت قيمة رصيدك المتبقي من باقتك الحالية (<strong>{upgradeInfo.remainingValue.toLocaleString("ar-EG")} {pkg?.currency || "EGP"}</strong>).
          </motion.div>
        )}

        {/* Payment Form */}
        <motion.form initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onSubmit={handleSubmit}
          style={{ background: "var(--card-bg)", border: "1px solid var(--line)", borderRadius: "24px", padding: "32px", boxShadow: "var(--shadow)" }}>

          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "var(--text)", marginBottom: "24px" }}>تفاصيل الدفع</h2>

          {/* Method Selection */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--text)", marginBottom: "12px" }}>طريقة الدفع</label>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {METHODS.filter((m) => settings?.[m.fieldKey]).map((m) => (
                <motion.div key={m.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setMethod(m.key)}
                  style={{ flex: 1, minWidth: "140px", padding: "16px", borderRadius: "16px", border: "2px solid " + (method === m.key ? "var(--primary)" : "var(--line)"), background: method === m.key ? "var(--bg-soft)" : "var(--card-bg)", cursor: "pointer", textAlign: "center", transition: "all 0.2s ease", boxShadow: method === m.key ? "0 0 0 4px rgba(111,208,5,0.1)" : "none" }}>
                  <div style={{ fontSize: "28px", marginBottom: "6px" }}>{m.icon}</div>
                  <div style={{ fontWeight: "800", fontSize: "14px", color: method === m.key ? "var(--primary)" : "var(--text)" }}>{m.label}</div>
                  {settings?.[m.fieldKey] && (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", direction: "ltr", fontWeight: "700" }}>{settings[m.fieldKey]}</div>
                  )}
                </motion.div>
              ))}
              {/* Fallback if no methods configured */}
              {METHODS.every((m) => !settings?.[m.fieldKey]) && METHODS.map((m) => (
                <motion.div key={m.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setMethod(m.key)}
                  style={{ flex: 1, minWidth: "140px", padding: "16px", borderRadius: "16px", border: "2px solid " + (method === m.key ? "var(--primary)" : "var(--line)"), background: method === m.key ? "var(--bg-soft)" : "var(--card-bg)", cursor: "pointer", textAlign: "center", transition: "all 0.2s ease" }}>
                  <div style={{ fontSize: "28px", marginBottom: "6px" }}>{m.icon}</div>
                  <div style={{ fontWeight: "800", fontSize: "14px", color: method === m.key ? "var(--primary)" : "var(--text)" }}>{m.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Instructions box */}
          <AnimatePresence>
            {currentMethodAccount && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ background: "#e6fbc2", border: "1px solid #c2f753", borderRadius: "14px", padding: "16px 18px", marginBottom: "20px" }}>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "#2e7d00", lineHeight: "1.7" }}>
                  📋 <strong>خطوات الدفع:</strong><br />
                  1. افتح تطبيق {currentMethod?.label} وابعت {pkg ? (upgradeInfo ? upgradeInfo.upgraded : Number(pkg.price)).toLocaleString("ar-EG") + " " + (pkg.currency || "EGP") : ""} على الرقم/الحساب:<br />
                  <strong style={{ direction: "ltr", display: "inline-block", fontSize: "16px", marginTop: "4px" }}>{currentMethodAccount}</strong><br />
                  2. صوّر الإيصال وارفعه في الخانة أدناه<br />
                  3. اضغط "إرسال الدفع"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sender Phone */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>
              رقم الهاتف المُرسِل <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <motion.input whileFocus={{ borderColor: "var(--primary)", boxShadow: "0 0 0 3px rgba(111,208,5,0.1)" }}
              type="tel" required dir="ltr" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              style={{ width: "100%", padding: "13px 16px", borderRadius: "12px", border: "1.5px solid var(--line)", background: "var(--bg-soft)", color: "var(--text)", fontSize: "15px", fontFamily: "inherit", outline: "none" }}
            />
          </div>

          {/* Transaction Reference */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>
              رقم العملية (اختياري)
            </label>
            <motion.input whileFocus={{ borderColor: "var(--primary)", boxShadow: "0 0 0 3px rgba(111,208,5,0.1)" }}
              type="text" dir="ltr" value={txRef} onChange={(e) => setTxRef(e.target.value)}
              placeholder="Transaction reference..."
              style={{ width: "100%", padding: "13px 16px", borderRadius: "12px", border: "1.5px solid var(--line)", background: "var(--bg-soft)", color: "var(--text)", fontSize: "15px", fontFamily: "inherit", outline: "none" }}
            />
          </div>

          {/* Receipt Upload */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>
              صورة الإيصال (اختياري لكن مستحسن)
            </label>
            <motion.div
              whileHover={{ borderColor: "var(--primary)" }}
              onClick={() => fileRef.current?.click()}
              style={{ border: "2px dashed var(--line)", borderRadius: "16px", padding: "28px", textAlign: "center", cursor: "pointer", transition: "all 0.2s ease", background: receiptPreview ? "var(--bg-soft)" : "transparent" }}
            >
              {receiptPreview ? (
                <img src={receiptPreview} alt="receipt" style={{ maxHeight: "160px", maxWidth: "100%", objectFit: "contain", borderRadius: "8px" }} />
              ) : (
                <div>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📎</div>
                  <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-muted)" }}>اضغط لرفع صورة الإيصال</p>
                  <p style={{ fontSize: "12px", color: "var(--text-soft)", marginTop: "4px" }}>PNG, JPG, أو PDF — حتى 10MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleFile} />
            </motion.div>
            {receiptFile && (
              <p style={{ fontSize: "13px", color: "var(--primary)", fontWeight: "700", marginTop: "8px" }}>✅ تم اختيار: {receiptFile.name}</p>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", color: "#ef4444", fontWeight: "700", fontSize: "14px" }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button type="submit" disabled={submitting || (upgradeInfo?.upgraded ?? 1) <= 0}
            whileHover={submitting || (upgradeInfo?.upgraded ?? 1) <= 0 ? {} : { scale: 1.02 }}
            whileTap={submitting || (upgradeInfo?.upgraded ?? 1) <= 0 ? {} : { scale: 0.98 }}
            style={{ width: "100%", padding: "18px", borderRadius: "16px", border: "none", background: submitting || (upgradeInfo?.upgraded ?? 1) <= 0 ? "#94a3b8" : "var(--primary)", color: "#fff", fontSize: "17px", fontWeight: "800", cursor: submitting || (upgradeInfo?.upgraded ?? 1) <= 0 ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            {submitting ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ display: "inline-block", width: 20, height: 20, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                جاري الإرسال...
              </>
            ) : "📤 إرسال الدفع والانتظار للموافقة"}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
