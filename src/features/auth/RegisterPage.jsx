import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthProvider";
import { navigate } from "../../lib/router";
import Logo from "../../components/Logo";

function readPrefill(key) {
  try { return sessionStorage.getItem(key) || ""; } catch { return ""; }
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, authError } = useAuth();
  const [form, setForm] = useState({
    fullName: readPrefill("drke-register-name"),
    phone: readPrefill("drke-register-phone"),
    password: "",
    confirm: "",
    email: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      try { sessionStorage.removeItem("drke-register-name"); sessionStorage.removeItem("drke-register-phone"); sessionStorage.removeItem("drke-register-assessment"); } catch { /* noop */ }
    };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError(t("register.passwordTooShort"));
      return;
    }
    if (form.password !== form.confirm) {
      setError(t("register.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      const session = await register({
        fullName: form.fullName,
        phone: form.phone,
        password: form.password,
        email: form.email || undefined,
      });
      // Route patient to assessment immediately after registration
      navigate(session.user.role === "patient" ? "/assessment" : "/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const fieldStyle = {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid var(--line)",
    background: "var(--bg-soft)",
    color: "var(--text)",
    outline: "none",
    fontSize: "16px",
    width: "100%",
    boxSizing: "border-box",
    transition: "border 0.2s ease, box-shadow 0.2s ease",
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
          maxWidth: "460px", 
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)"
        }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <Logo size={70} />
        </motion.div>

        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text)", marginBottom: "8px" }}>{t("register.title")}</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "28px", fontSize: "15px" }}>{t("register.subtitle")}</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "18px", textAlign: "start" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>
            {t("register.fullName")}
            <motion.input whileFocus={{ scale: 1.01, borderColor: "var(--primary)" }} required value={form.fullName} onChange={set("fullName")} autoComplete="name" style={fieldStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>
            {t("register.phone")}
            <motion.input whileFocus={{ scale: 1.01, borderColor: "var(--primary)" }} required value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="01xxxxxxxxx" dir="ltr" style={fieldStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>
            {t("register.email")}
            <motion.input whileFocus={{ scale: 1.01, borderColor: "var(--primary)" }} type="email" value={form.email} onChange={set("email")} autoComplete="email" style={fieldStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>
            {t("register.password")}
            <motion.input whileFocus={{ scale: 1.01, borderColor: "var(--primary)" }} required type="password" value={form.password} onChange={set("password")} autoComplete="new-password" style={fieldStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>
            {t("register.confirmPassword")}
            <motion.input whileFocus={{ scale: 1.01, borderColor: "var(--primary)" }} required type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" style={fieldStyle} />
          </label>

          {(error || authError) && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} role="alert" style={{ color: "#ef4444", background: "#fee2e2", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", margin: 0 }}>
              {error || authError.message}
            </motion.p>
          )}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary" disabled={busy} style={{ width: "100%", padding: "16px", borderRadius: "12px", fontSize: "16px", marginTop: "10px" }}>
            {busy ? t("register.creating") : t("register.createAccount")}
          </motion.button>
        </form>

        <p style={{ color: "var(--text-muted)", marginTop: "20px", fontSize: "14px" }}>
          {t("register.haveAccount")}{" "}
          <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
            {t("register.login")}
          </button>
        </p>

        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "var(--text-muted)", marginTop: "12px", fontSize: "14px", cursor: "pointer", fontWeight: "600" }}>
          ← {t("register.backHome")}
        </button>
      </motion.div>
    </main>
  );
}