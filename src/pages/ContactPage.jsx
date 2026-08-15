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
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.4 }}
              style={{ 
                background: "linear-gradient(135deg, var(--primary-deep) 0%, var(--deep) 100%)", 
                padding: "48px 40px", 
                borderRadius: "32px", 
                color: "var(--on-brand)", 
                boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)", borderRadius: "50%" }} />
              
              <h3 style={{ fontSize: "28px", marginBottom: "36px", fontWeight: "900", position: "relative", zIndex: 1 }}>معلومات العيادة</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "28px", position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}><PhoneIcon /></span>
                  <span style={{ fontSize: "17px", fontWeight: "700" }}>{CLINIC.phones.join("  •  ")}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}><MailIcon /></span>
                  <span style={{ fontSize: "17px", fontWeight: "700" }}>{CLINIC.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}><PinIcon /></span>
                  <span style={{ fontSize: "16px", fontWeight: "700", lineHeight: "1.7" }}>{t("footer.address")}</span>
                </div>
              </div>

              <div style={{ marginTop: "48px", display: "flex", gap: "16px", position: "relative", zIndex: 1 }}>
                <a href={mapsDirectionsUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, padding: "14px", borderRadius: "16px", border: "1.5px solid rgba(255,255,255,0.3)" }}>
                  <PinIcon /> الاتجاهات
                </a>
                <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-accent" style={{ flex: 1, padding: "14px", borderRadius: "16px" }}>
                  <WhatsAppIcon /> واتساب
                </a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{ background: "var(--card-bg)", padding: "48px 40px", borderRadius: "32px", border: "1px solid var(--line)", boxShadow: "0 12px 24px rgba(0,0,0,0.03)" }}
            >
              <h3 style={{ fontSize: "28px", marginBottom: "36px", fontWeight: "900", color: "var(--text)" }}>أرسل لنا رسالة</h3>
              <form style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <input type="text" placeholder="الاسم بالكامل" style={{ width: "100%", padding: "18px 20px", borderRadius: "16px", border: "2px solid var(--line)", background: "var(--bg-soft)", fontSize: "16px", outline: "none", color: "var(--text)", fontWeight: 500, transition: "border 0.3s" }} />
                <input type="email" placeholder="البريد الإلكتروني" style={{ width: "100%", padding: "18px 20px", borderRadius: "16px", border: "2px solid var(--line)", background: "var(--bg-soft)", fontSize: "16px", outline: "none", color: "var(--text)", fontWeight: 500, transition: "border 0.3s" }} />
                <textarea placeholder="رسالتك أو استفسارك..." style={{ width: "100%", padding: "18px 20px", borderRadius: "16px", border: "2px solid var(--line)", background: "var(--bg-soft)", fontSize: "16px", outline: "none", color: "var(--text)", fontWeight: 500, minHeight: "160px", resize: "vertical", transition: "border 0.3s" }}></textarea>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" className="btn btn-primary" style={{ padding: "18px", borderRadius: "16px", fontSize: "16px", marginTop: "10px" }}>
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
