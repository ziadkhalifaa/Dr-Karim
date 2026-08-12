import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CLINIC, mapsDirectionsUrl, waUrl } from "../config";
import {
  FacebookIcon,
  YoutubeIcon,
  TikTokIcon,
  PhoneIcon,
  MailIcon,
  PinIcon,
  SendIcon,
  WhatsAppIcon,
} from "./Icons";
import { motion } from "framer-motion";

const LINKS = ["home", "about", "services", "articles", "contact"];

function SocialButtons() {
  return (
    <div className="social-row" style={{ display: "flex", gap: "12px" }}>
      <motion.a
        whileHover={{ scale: 1.1, backgroundColor: "var(--primary)" }}
        whileTap={{ scale: 0.95 }}
        className="social-btn"
        href={CLINIC.social.facebook}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
        style={{ width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", color: "#fff", transition: "background 0.3s ease" }}
      >
        <FacebookIcon />
      </motion.a>
      <motion.a
        whileHover={{ scale: 1.1, backgroundColor: "var(--primary)" }}
        whileTap={{ scale: 0.95 }}
        className="social-btn"
        href={CLINIC.social.youtube}
        target="_blank"
        rel="noreferrer"
        aria-label="YouTube"
        style={{ width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", color: "#fff", transition: "background 0.3s ease" }}
      >
        <YoutubeIcon />
      </motion.a>
      <motion.a
        whileHover={{ scale: 1.1, backgroundColor: "var(--primary)" }}
        whileTap={{ scale: 0.95 }}
        className="social-btn"
        href={CLINIC.social.tiktok}
        target="_blank"
        rel="noreferrer"
        aria-label="TikTok"
        style={{ width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", color: "#fff", transition: "background 0.3s ease" }}
      >
        <TikTokIcon />
      </motion.a>
    </div>
  );
}

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  };

  return (
    <footer className="site-footer" id="contact" style={{ background: "var(--surface-brand)", color: "var(--on-brand)", padding: "80px 0 30px", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
      <div className="container">
        <div className="footer-top" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "60px", marginBottom: "60px" }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="footer-cta"
          >
            <h2 style={{ fontSize: "32px", fontWeight: "800", lineHeight: "1.4", marginBottom: "20px" }}>
              {t("footer.cta1")} <span className="bg-chip" style={{ background: "rgba(255,255,255,0.15)", color: "var(--gold)", padding: "4px 12px", borderRadius: "12px", display: "inline-block" }}>{t("footer.ctaHighlight")}</span>
              <br />
              {t("footer.cta2")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.8", maxWidth: "400px" }}>
              ابدأ رحلتك نحو حياة صحية الآن. تواصل معنا لمعرفة كيف يمكننا مساعدتك في تحقيق أهدافك.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="footer-col"
          >
            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px", color: "var(--gold)" }}>{t("footer.linksTitle")}</h3>
            <ul className="footer-links" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {LINKS.map((key) => (
                <li key={key}>
                  <motion.a 
                    whileHover={{ x: -10, color: "var(--gold)" }}
                    href={`#${key === "home" ? "home" : key}`}
                    style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", fontWeight: "600", transition: "color 0.2s" }}
                  >
                    {t(`nav.${key}`)}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2 }}
            className="footer-col"
          >
            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px", color: "var(--gold)" }}>{t("footer.keepTitle")}</h3>
            
            <div className="contact-block" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="contact-line" style={{ display: "flex", alignItems: "center", gap: "16px", color: "rgba(255,255,255,0.85)" }}>
                <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}>
                  <PhoneIcon />
                </span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{CLINIC.phones.join("  •  ")}</span>
              </div>
              <div className="contact-line" style={{ display: "flex", alignItems: "center", gap: "16px", color: "rgba(255,255,255,0.85)" }}>
                <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}>
                  <MailIcon />
                </span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{CLINIC.email}</span>
              </div>
              <div className="contact-line" style={{ display: "flex", alignItems: "center", gap: "16px", color: "rgba(255,255,255,0.85)" }}>
                <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}>
                  <PinIcon />
                </span>
                <span style={{ fontSize: "15px", fontWeight: "600", lineHeight: "1.6" }}>{t("footer.address")}</span>
              </div>
              
              <div className="contact-actions" style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "12px", fontSize: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  <PinIcon />
                  {t("footer.directions")}
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-accent"
                  style={{ flex: 1, padding: "12px", fontSize: "14px", borderRadius: "12px" }}
                >
                  <WhatsAppIcon />
                  {t("footer.whatsapp")}
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.hr 
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="footer-divider" 
          style={{ border: "none", height: "1px", background: "rgba(255,255,255,0.1)", margin: "40px 0" }} 
        />

        <div className="footer-bottom" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div className="footer-copy" style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: "600" }}>{t("footer.copyright")}</div>
          <SocialButtons />
        </div>
      </div>
    </footer>
  );
}