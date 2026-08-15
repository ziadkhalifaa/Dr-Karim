import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MessageCircle, Phone, Mail, MapPin, Send, Check, ChevronRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { WhatsAppIcon } from "../components/Icons";
import { publicApi } from "../api/client";
import { usePublicSettings } from "../hooks/usePublicSettings";

export default function ContactPage() {
  const { t } = useTranslation();
  const { settings } = usePublicSettings();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [focused, setFocused] = useState(null);

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

  const inputStyle = (name) => ({
    width: "100%",
    padding: "18px 20px",
    borderRadius: "16px",
    border: `2px solid ${focused === name ? "var(--primary)" : "rgba(0,0,0,0.08)"}`,
    background: focused === name ? "rgba(var(--primary-rgb), 0.02)" : "var(--bg)",
    fontSize: "16px",
    outline: "none",
    color: "var(--text)",
    fontWeight: 500,
    transition: "all 0.3s ease",
    fontFamily: "inherit",
    boxShadow: focused === name ? "0 0 0 4px rgba(var(--primary-rgb), 0.1)" : "none",
  });

  const contactItems = [
    {
      icon: Phone,
      label: "اتصل بنا",
      value: settings?.clinic?.phone || "01064227806",
      href: `tel:${settings?.clinic?.phone || "01064227806"}`,
      color: "#10b981",
    },
    {
      icon: Mail,
      label: "البريد الإلكتروني",
      value: settings?.clinic?.email || "dr.kareem.eliethy@gmail.com",
      href: `mailto:${settings?.clinic?.email || "dr.kareem.eliethy@gmail.com"}`,
      color: "#3b82f6",
    },
    {
      icon: MapPin,
      label: "العنوان",
      value: t("footer.address") || "الإسكندرية، مصر",
      href: settings?.maps || "#",
      color: "#f59e0b",
    },
  ];

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-alt) 100%)", overflowX: "hidden" }}>
        
        {/* Hero */}
        <section style={{ padding: "160px 20px 60px", position: "relative", textAlign: "center" }}>
          {/* Decorative blobs */}
          <div style={{ position: "absolute", top: "5%", right: "5%", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(var(--primary-rgb), 0.08) 0%, transparent 70%)", filter: "blur(50px)", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: "5%", left: "5%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(var(--secondary-rgb), 0.06) 0%, transparent 70%)", filter: "blur(70px)", zIndex: 0 }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(var(--primary-rgb), 0.08)", color: "var(--primary)", padding: "12px 24px", borderRadius: "100px", fontSize: "16px", fontWeight: "800", marginBottom: "24px", border: "1px solid rgba(var(--primary-rgb), 0.15)" }}
            >
              <MessageCircle size={20} /> ابقى على تواصل
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              style={{ fontSize: "clamp(42px, 6vw, 70px)", fontWeight: "900", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px", color: "var(--text)" }}
            >
              تواصل{" "}
              <span style={{ background: "linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                معنا
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{ color: "var(--text-muted)", fontSize: "20px", maxWidth: "600px", margin: "0 auto 60px", lineHeight: 1.7, fontWeight: 500 }}
            >
              نحن هنا للإجابة على استفساراتك ومساعدتك في رحلتك الصحية. لا تتردد في التواصل معنا.
            </motion.p>

            {/* Quick Contact Chips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginBottom: "80px" }}
            >
              {contactItems.map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  target={item.label === "العنوان" ? "_blank" : undefined}
                  rel="noreferrer"
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "12px", background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "100px", padding: "14px 24px", color: "var(--text)", fontWeight: "700", fontSize: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)", textDecoration: "none", transition: "all 0.3s ease" }}
                >
                  <span style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${item.color}15`, color: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <item.icon size={18} />
                  </span>
                  {item.value}
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Main Content: Form + Info */}
        <section style={{ padding: "0 20px 120px" }}>
          <div className="container" style={{ maxWidth: "1100px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "start" }}>

            {/* Contact Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, type: "spring" }}
              style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", borderRadius: "32px", padding: "48px 40px", color: "#fff", boxShadow: "0 30px 60px rgba(var(--primary-rgb), 0.25)", position: "relative", overflow: "hidden" }}
            >
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", border: "50px solid rgba(255,255,255,0.07)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", bottom: "-30px", left: "-30px", width: "150px", height: "150px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />

              <h3 style={{ fontSize: "28px", fontWeight: "900", marginBottom: "12px", position: "relative", zIndex: 1 }}>
                معلومات التواصل
              </h3>
              <p style={{ opacity: 0.8, fontSize: "16px", lineHeight: 1.6, marginBottom: "40px", position: "relative", zIndex: 1 }}>
                تواصل معنا عبر أي من القنوات التالية وسنرد عليك في أقرب وقت ممكن.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "28px", position: "relative", zIndex: 1 }}>
                {contactItems.map((item, i) => (
                  <a key={i} href={item.href} target={item.label === "العنوان" ? "_blank" : undefined} rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "16px", color: "#fff", textDecoration: "none", fontWeight: "700", fontSize: "16px" }}>
                    <span style={{ width: "52px", height: "52px", borderRadius: "16px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backdropFilter: "blur(10px)" }}>
                      <item.icon size={22} />
                    </span>
                    <div>
                      <div style={{ fontSize: "13px", opacity: 0.7, fontWeight: "600", marginBottom: "4px" }}>{item.label}</div>
                      <div>{item.value}</div>
                    </div>
                  </a>
                ))}
              </div>

              <div style={{ display: "flex", gap: "16px", marginTop: "48px", position: "relative", zIndex: 1 }}>
                <a
                  href={settings?.social?.whatsapp ? `https://wa.me/${settings.social.whatsapp.replace(/\D/g, '')}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "16px", padding: "16px", color: "#fff", fontWeight: "800", fontSize: "16px", textDecoration: "none", backdropFilter: "blur(10px)", transition: "all 0.3s ease" }}
                >
                  <WhatsAppIcon /> واتساب
                </a>
                <a
                  href={settings?.maps || "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "16px", padding: "16px", color: "#fff", fontWeight: "800", fontSize: "16px", textDecoration: "none", backdropFilter: "blur(10px)", transition: "all 0.3s ease" }}
                >
                  <MapPin size={20} /> الخريطة
                </a>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, type: "spring", delay: 0.1 }}
              style={{ background: "#fff", borderRadius: "32px", padding: "48px 40px", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", border: "1.5px solid rgba(0,0,0,0.05)" }}
            >
              <h3 style={{ fontSize: "28px", fontWeight: "900", color: "var(--text)", marginBottom: "8px" }}>
                أرسل لنا رسالة
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "36px" }}>
                سنرد عليك خلال 24 ساعة
              </p>

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ textAlign: "center", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                      style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 40px rgba(16,185,129,0.3)" }}
                    >
                      <Check size={40} color="#fff" />
                    </motion.div>
                    <h4 style={{ fontSize: "24px", fontWeight: "900", color: "var(--text)" }}>تم إرسال رسالتك!</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1.7 }}>
                      سنتواصل معك قريباً. شكراً لك على تواصلك مع عيادة د. كريم الليثي.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setStatus("idle")}
                      style={{ padding: "14px 32px", borderRadius: "100px", background: "var(--primary)", color: "#fff", border: "none", fontWeight: "800", fontSize: "16px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      إرسال رسالة أخرى
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>الاسم بالكامل *</label>
                      <input
                        name="name"
                        type="text"
                        placeholder="مثال: أحمد محمد"
                        required
                        value={form.name}
                        onChange={handleChange}
                        style={inputStyle("name")}
                        onFocus={() => setFocused("name")}
                        onBlur={() => setFocused(null)}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>البريد الإلكتروني (اختياري)</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        value={form.email}
                        onChange={handleChange}
                        style={inputStyle("email")}
                        onFocus={() => setFocused("email")}
                        onBlur={() => setFocused(null)}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>رسالتك أو استفسارك *</label>
                      <textarea
                        name="message"
                        placeholder="اكتب رسالتك أو استفسارك هنا..."
                        required
                        value={form.message}
                        onChange={handleChange}
                        style={{ ...inputStyle("message"), minHeight: "160px", resize: "vertical" }}
                        onFocus={() => setFocused("message")}
                        onBlur={() => setFocused(null)}
                      />
                    </div>

                    {status === "error" && errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "14px 20px", color: "#dc2626", fontSize: "14px", fontWeight: "700" }}
                      >
                        ⚠ {errorMsg}
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={status === "loading"}
                      style={{ padding: "20px", borderRadius: "100px", background: status === "loading" ? "#94a3b8" : "linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)", color: "#fff", border: "none", fontWeight: "800", fontSize: "18px", cursor: status === "loading" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontFamily: "inherit", boxShadow: status !== "loading" ? "0 10px 30px rgba(var(--primary-rgb), 0.3)" : "none", transition: "background 0.3s ease" }}
                    >
                      {status === "loading" ? (
                        <>
                          <div style={{ width: "20px", height: "20px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send size={20} /> إرسال الرسالة
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
