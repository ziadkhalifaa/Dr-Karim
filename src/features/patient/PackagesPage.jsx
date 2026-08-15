import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { paymentApi } from "../../api/client";
import { navigate } from "../../lib/router";
import Logo from "../../components/Logo";

const containerAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

const DURATION_LABELS = { one_time: "مرة واحدة", month: "شهر" };

const DEFAULT_FEATURES = [
  "متابعة شخصية مع الدكتور كريم",
  "خطة تغذية مخصصة",
  "برنامج تمارين رياضية",
  "تتبع التقدم أسبوعياً",
  "دعم مستمر عبر التطبيق",
];

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.15)", borderTopColor: "#6fd005" }}
    />
  );
}

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [pkgs, cfg] = await Promise.all([
          paymentApi.packages(),
          paymentApi.settings().catch(() => null),
        ]);
        const list = Array.isArray(pkgs) ? pkgs : (pkgs?.packages || []);
        setPackages(list.filter((p) => p.active));
        setSettings(cfg);
      } catch (e) {
        setError(e.message || "فشل تحميل الباقات");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = (pkg) => {
    setSelected(pkg.id);
    setTimeout(() => navigate("/payment?packageId=" + pkg.id), 400);
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "var(--deep)",
    backgroundImage: "radial-gradient(ellipse at 70% 0%, rgba(111,208,5,0.25) 0%, transparent 60%), radial-gradient(ellipse at 30% 100%, rgba(111,208,5,0.15) 0%, transparent 60%)",
    direction: "rtl",
    fontFamily: "var(--font-body)",
  };

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Logo size={44} />
        <button
          onClick={() => navigate("/patient")}
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "10px 18px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "700", fontFamily: "inherit" }}
        >
          ← لوحة التحكم
        </button>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: "center", padding: "56px 20px 40px", color: "#fff" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(111,208,5,0.15)", border: "1px solid rgba(111,208,5,0.35)", color: "#c2f753", padding: "7px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: "800", letterSpacing: "0.06em", marginBottom: "24px" }}
        >
          🎯 الخطوة الأخيرة — اختر باقتك
        </motion.div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: "900", lineHeight: "1.2", marginBottom: "16px" }}>
          ابدأ رحلتك نحو{" "}
          <span style={{ color: "#c2f753" }}>صحة أفضل</span>
        </h1>
        <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.65)", maxWidth: "520px", margin: "0 auto", lineHeight: "1.7" }}>
          اختر الباقة المناسبة وادفع عن طريق فودافون كاش أو إنستاباي. سيتابعك الدكتور كريم شخصياً بعد تأكيد الدفع.
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <div style={{ maxWidth: 480, margin: "0 auto 32px", padding: "0 20px" }}>
          <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: "14px", padding: "14px 18px", fontWeight: "700", fontSize: "15px" }}>
            {error}
          </div>
        </div>
      )}

      {/* Packages Grid */}
      {packages.length === 0 && !error ? (
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", padding: "80px 20px", fontSize: "18px" }}>
          لا توجد باقات متاحة حالياً — تواصل معنا
        </div>
      ) : (
        <motion.div
          variants={containerAnim}
          initial="hidden"
          animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "24px", maxWidth: "1100px", margin: "0 auto", padding: "0 24px 60px" }}
        >
          {packages.map((pkg, i) => {
            const isFeatured = packages.length === 1 || i === Math.floor(packages.length / 2);
            const isSelected = selected === pkg.id;
            return (
              <motion.div
                key={pkg.id}
                variants={cardAnim}
                whileHover={{ y: -10, scale: 1.015 }}
                onClick={() => handleSelect(pkg)}
                style={{
                  borderRadius: "24px",
                  padding: "32px",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  color: "#fff",
                  background: isFeatured
                    ? "linear-gradient(145deg, #3ca503 0%, #6fd005 60%, #c2f753 100%)"
                    : "rgba(255,255,255,0.05)",
                  border: "2px solid " + (isFeatured ? "transparent" : isSelected ? "#6fd005" : "rgba(255,255,255,0.1)"),
                  backdropFilter: "blur(16px)",
                  boxShadow: isFeatured
                    ? "0 24px 60px rgba(111,208,5,0.4)"
                    : isSelected ? "0 0 0 4px rgba(111,208,5,0.25)" : "0 4px 24px rgba(0,0,0,0.2)",
                  transition: "box-shadow 0.3s ease",
                }}
              >
                {/* Featured badge */}
                {isFeatured && (
                  <div style={{ position: "absolute", top: "16px", left: "16px", background: "#fff", color: "#3ca503", fontSize: "11px", fontWeight: "900", padding: "5px 14px", borderRadius: "999px", letterSpacing: "0.04em" }}>
                    ⭐ الأكثر طلباً
                  </div>
                )}

                {/* Duration */}
                <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7, marginBottom: "8px", marginTop: isFeatured ? "28px" : "0" }}>
                  {pkg.duration_value} {DURATION_LABELS[pkg.duration_unit] || pkg.duration_unit}
                </div>

                {/* Name */}
                <h2 style={{ fontSize: "24px", fontWeight: "900", lineHeight: "1.2", marginBottom: "8px" }}>{pkg.name}</h2>
                {pkg.description && <p style={{ fontSize: "14px", opacity: 0.8, lineHeight: "1.6", marginBottom: "20px" }}>{pkg.description}</p>}

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "28px" }}>
                  <span style={{ fontSize: "52px", fontWeight: "900", lineHeight: "1" }}>
                    {Number(pkg.price).toLocaleString("ar-EG")}
                  </span>
                  <span style={{ fontSize: "17px", fontWeight: "700", opacity: 0.8 }}>{pkg.currency || "EGP"}</span>
                </div>

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {DEFAULT_FEATURES.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14.5px", fontWeight: "600" }}>
                      <span style={{ color: isFeatured ? "rgba(255,255,255,0.9)" : "#c2f753", flexShrink: 0 }}><CheckIcon /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%", padding: "16px", borderRadius: "14px",
                    border: "2px solid rgba(255,255,255,0.35)",
                    background: isFeatured ? "rgba(255,255,255,0.25)" : "rgba(111,208,5,0.15)",
                    color: "#fff", fontSize: "16px", fontWeight: "800",
                    cursor: "pointer", fontFamily: "inherit",
                    backdropFilter: "blur(8px)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {isSelected ? "✅ جاري التوجيه للدفع..." : "اختر هذه الباقة →"}
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Payment Methods Info Card */}
      {settings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ maxWidth: "700px", margin: "0 auto 60px", padding: "0 24px" }}
        >
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", padding: "28px", color: "#fff", backdropFilter: "blur(16px)" }}>
            <div style={{ fontSize: "16px", fontWeight: "800", marginBottom: "18px", color: "#c2f753" }}>💳 طرق الدفع المتاحة</div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {settings.vodafone_cash_number && (
                <div style={{ flex: 1, minWidth: "160px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "18px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>📱</div>
                  <div style={{ fontWeight: "800", fontSize: "15px" }}>فودافون كاش</div>
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginTop: "6px", direction: "ltr", fontWeight: "700" }}>{settings.vodafone_cash_number}</div>
                </div>
              )}
              {settings.instapay_username && (
                <div style={{ flex: 1, minWidth: "160px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "18px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>🏦</div>
                  <div style={{ fontWeight: "800", fontSize: "15px" }}>إنستاباي</div>
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginTop: "6px", direction: "ltr", fontWeight: "700" }}>{settings.instapay_username}</div>
                </div>
              )}
            </div>
            {settings.instructions && (
              <p style={{ marginTop: "18px", fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                {settings.instructions}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
