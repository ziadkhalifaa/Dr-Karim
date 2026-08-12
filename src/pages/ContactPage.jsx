import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CLINIC, mapsDirectionsUrl, waUrl } from "../config";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PhoneIcon, MailIcon, PinIcon, SendIcon, WhatsAppIcon } from "../components/Icons";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh", padding: "120px 20px 60px", background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "60px" }}
          >
            <h1 className="sec-title" style={{ fontSize: "44px", color: "var(--text)" }}>
              تواصل <strong style={{ color: "var(--primary)" }}>معنا</strong>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "700px", margin: "16px auto 0" }}>
              نحن هنا للإجابة على استفساراتك ومساعدتك في رحلتك الصحية.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ background: "var(--surface-brand)", padding: "40px", borderRadius: "var(--radius-xl)", color: "var(--on-brand)", boxShadow: "var(--shadow-lg)" }}
            >
              <h3 style={{ fontSize: "24px", marginBottom: "30px", fontWeight: "800" }}>معلومات العيادة</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}><PhoneIcon /></span>
                  <span style={{ fontSize: "17px", fontWeight: "600" }}>{CLINIC.phones.join("  •  ")}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}><MailIcon /></span>
                  <span style={{ fontSize: "17px", fontWeight: "600" }}>{CLINIC.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}><PinIcon /></span>
                  <span style={{ fontSize: "16px", fontWeight: "600", lineHeight: "1.6" }}>{t("footer.address")}</span>
                </div>
              </div>

              <div style={{ marginTop: "40px", display: "flex", gap: "12px" }}>
                <a href={mapsDirectionsUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.3)" }}>
                  <PinIcon /> الاتجاهات
                </a>
                <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-accent" style={{ flex: 1, padding: "14px", borderRadius: "14px" }}>
                  <WhatsAppIcon /> واتساب
                </a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{ background: "var(--card-bg)", padding: "40px", borderRadius: "var(--radius-xl)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}
            >
              <h3 style={{ fontSize: "24px", marginBottom: "30px", fontWeight: "800", color: "var(--text)" }}>أرسل لنا رسالة</h3>
              <form style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <input type="text" placeholder="الاسم بالكامل" style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "2px solid var(--line)", background: "var(--bg-soft)", fontSize: "16px", outline: "none", color: "var(--text)" }} />
                <input type="email" placeholder="البريد الإلكتروني" style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "2px solid var(--line)", background: "var(--bg-soft)", fontSize: "16px", outline: "none", color: "var(--text)" }} />
                <textarea placeholder="رسالتك أو استفسارك..." style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "2px solid var(--line)", background: "var(--bg-soft)", fontSize: "16px", outline: "none", color: "var(--text)", minHeight: "140px", resize: "vertical" }}></textarea>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" className="btn btn-primary" style={{ padding: "18px", borderRadius: "12px", fontSize: "16px" }}>
                  <SendIcon /> إرسال الرسالة
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
