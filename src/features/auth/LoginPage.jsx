import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import { navigate } from "../../lib/router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, authError, user, loading } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === "patient" ? "/patient" : "/doctor");
    }
  }, [user, loading]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await login(form);
      navigate(session.user.role === "patient" ? "/patient" : "/doctor");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--deep) 0%, var(--surface-brand) 100%)", padding: "20px" }}>
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        style={{
          background: "var(--card-bg)",
          padding: "40px",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          width: "100%",
          maxWidth: "440px",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)"
        }}
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}
        >
          <img src="/assets/logo.png" alt={t("brand.name")} style={{ height: 84, width: "auto", objectFit: "contain" }} />
        </motion.div>
        
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text)", marginBottom: "8px" }}>
          {t("nav.login", "تسجيل الدخول")}
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "15px" }}>
          مرحباً بك مجدداً في عيادة دكتور كريم الليثي
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "start" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>
            البريد الإلكتروني أو رقم الهاتف
            <motion.input 
              whileFocus={{ scale: 1.01, borderColor: "var(--primary)" }}
              required 
              value={form.identifier} 
              onChange={(e) => setForm({ ...form, identifier: e.target.value })} 
              autoComplete="username" 
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid var(--line)",
                background: "var(--bg-soft)",
                color: "var(--text)",
                outline: "none",
                fontSize: "16px",
                transition: "border 0.2s ease, box-shadow 0.2s ease"
              }}
            />
          </label>
          
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>
            كلمة المرور
            <motion.input 
              whileFocus={{ scale: 1.01, borderColor: "var(--primary)" }}
              required 
              type="password" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              autoComplete="current-password" 
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid var(--line)",
                background: "var(--bg-soft)",
                color: "var(--text)",
                outline: "none",
                fontSize: "16px",
                transition: "border 0.2s ease, box-shadow 0.2s ease"
              }}
            />
          </label>

          {(error || authError) && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              role="alert" 
              style={{ color: "#ef4444", background: "#fee2e2", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", margin: 0 }}
            >
              {error || authError.message}
            </motion.p>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary" 
            disabled={busy}
            style={{ width: "100%", padding: "16px", borderRadius: "12px", fontSize: "16px", marginTop: "10px" }}
          >
            {busy ? "جاري الدخول..." : "تسجيل الدخول"}
          </motion.button>
        </form>

        <p style={{ color: "var(--text-muted)", marginTop: "20px", fontSize: "14px" }}>
          ليس لديك حساب؟{" "}
          <button onClick={() => navigate("/register")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
            إنشاء حساب
          </button>
        </p>

        <button 
          onClick={() => navigate("/")} 
          style={{ 
            background: "none", 
            border: "none", 
            color: "var(--text-muted)", 
            marginTop: "12px", 
            fontSize: "14px", 
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600"
          }}
          onMouseEnter={(e) => e.target.style.color = "var(--primary)"}
          onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}
        >
          ← العودة للصفحة الرئيسية
        </button>
      </motion.div>
    </main>
  );
}
