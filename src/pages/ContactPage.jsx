import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { mapsDirectionsUrl, waUrl } from "../config";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PhoneIcon, MailIcon, PinIcon, SendIcon, WhatsAppIcon } from "../components/Icons";
import { publicApi } from "../api/client";
import { usePublicSettings } from "../hooks/usePublicSettings";

export default function ContactPage() {
  const { t } = useTranslation();
  const { settings } = usePublicSettings();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      setErrorMsg("الرجاء ملء الاسم والرسالة على الأقل.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await publicApi.contact({ name: form.name, email: form.email, message: form.message });
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err?.message || "حدث خطأ، حاول مرة أخرى.");
    }
  };

  const inputStyle = {
    width: "100%", padding: "18px 20px", borderRadius: "16px",
    border: "2px solid var(--line)", background: "var(--bg-soft)",
    fontSize: "16px", outline: "none", color: "var(--text)",
    fontWeight: 500, transition: "border-color 0.3s", fontFamily: "inherit",
  };

  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh", padding: "120px 20px 60px", background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: "960px" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "80px" }}
          >
            <span style={{ display: "inline-block", background: "var(--highlight-bg)", color: "var(--primary-deep)", padding: "8px 16px", borderRadius: "100px", fontSize: "15px", fontWeight: "800", marginBottom: "16px" }}>
              ابقى على تواصل
            </span>
            <h1 className="sec-title" style={{ fontSize: "clamp(36px, 5vw, 54px)", color: "var(--text)" }}>
              تواصل <strong style={{ color: "var(--primary)" }}>معنا</strong>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "700px", margin: "20px auto 0", lineHeight: 1.8, fontWeight: 500 }}>
              نحن هنا للإجابة على استفساراتك ومساعدتك في رحلتك الصحية. لا تتردد في الاتصال بنا أو زيارة العيادة.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
            {/* Clinic Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.4 }}
              style={{
                background: "linear-gradient(135deg, var(--primary-deep) 0%, var(--deep) 100%)",
                padding: "48px 40px", borderRadius: "32px", color: "var(--on-brand)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.15)", position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)", borderRadius: "50%" }} />
              <h3 style={{ fontSize: "28px", marginBottom: "36px", fontWeight: "900", position: "relative", zIndex: 1 }}>معلومات العيادة</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "28px", position: "relative", zIndex: 1 }}>
                {(settings?.clinic?.phone ? [settings.clinic.phone] : ["01064227806"]).map((ph, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}><PhoneIcon /></span>
                    <a href={`tel:${ph}`} style={{ fontSize: "17px", fontWeight: "700", color: "inherit" }}>{ph}</a>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}><MailIcon /></span>
                  <a href={`mailto:${settings?.clinic?.email || "dr.kareem.eliethy@gmail.com"}`} style={{ fontSize: "17px", fontWeight: "700", color: "inherit" }}>{settings?.clinic?.email || "dr.kareem.eliethy@gmail.com"}</a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}><PinIcon /></span>
                  <span style={{ fontSize: "16px", fontWeight: "700", lineHeight: "1.7" }}>{t("footer.address")}</span>
                </div>
              </div>
              <div style={{ marginTop: "48px", display: "flex", gap: "16px", position: "relative", zIndex: 1 }}>
                <a href={settings?.maps || "#"} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, padding: "14px", borderRadius: "16px", border: "1.5px solid rgba(255,255,255,0.3)" }}>
                  <PinIcon /> الاتجاهات
                </a>
                <a href={settings?.social?.whatsapp || "#"} target="_blank" rel="noreferrer" className="btn btn-accent" style={{ flex: 1, padding: "14px", borderRadius: "16px" }}>
                  <WhatsAppIcon /> واتساب
                </a>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{ background: "var(--card-bg)", padding: "48px 40px", borderRadius: "32px", border: "1px solid var(--line)", boxShadow: "0 12px 24px rgba(0,0,0,0.03)" }}
            >
              <h3 style={{ fontSize: "28px", marginBottom: "36px", fontWeight: "900", color: "var(--text)" }}>أرسل لنا رسالة</h3>

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ textAlign: "center", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
                  >
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--highlight-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>✅</div>
                    <h4 style={{ fontSize: "22px", fontWeight: "900", color: "var(--primary-deep)" }}>تم إرسال رسالتك!</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1.7 }}>سنتواصل معك قريباً. شكراً لك على تواصلك مع عيادة د. كريم الليثي.</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setStatus("idle")}
                      className="btn btn-primary"
                      style={{ padding: "14px 28px", borderRadius: "14px", marginTop: "8px" }}
                    >
                      إرسال رسالة أخرى
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <input
                      name="name" type="text" placeholder="الاسم بالكامل *" required
                      value={form.name} onChange={handleChange} style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
                    />
                    <input
                      name="email" type="email" placeholder="البريد الإلكتروني (اختياري)"
                      value={form.email} onChange={handleChange} style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
                    />
                    <textarea
                      name="message" placeholder="رسالتك أو استفسارك... *" required
                      value={form.message} onChange={handleChange}
                      style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
                    />
                    {status === "error" && errorMsg && (
                      <p style={{ color: "#ef4444", fontSize: "14px", fontWeight: "700", marginTop: "-8px" }}>⚠ {errorMsg}</p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={status === "loading"}
                      className="btn btn-primary"
                      style={{ padding: "18px", borderRadius: "16px", fontSize: "16px", marginTop: "10px", opacity: status === "loading" ? 0.7 : 1 }}
                    >
                      {status === "loading" ? "جاري الإرسال..." : <><SendIcon /> إرسال الرسالة</>}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
