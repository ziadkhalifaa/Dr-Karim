import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { AppleIcon, PlanIcon, SupportIcon } from "./Icons"; // using generic icons for the chips

export default function Banner() {
  const { t } = useTranslation();
  
  // Custom parsing since the old banner was just a string with bullets
  const text = t("banner.text");
  const parts = text.split(" • ");
  const title = parts[0]?.replace(/\*\*/g, '') || "الاعتماد على وجبات متوازنة";
  const items = parts.slice(1).map(p => p.replace(/\*\*/g, ''));

  // fallback if translation format changes
  const displayItems = items.length > 0 ? items : [
    "البروتين", "الكربوهيدرات", "الدهون الصحية", "الألياف", "تقليل السكريات المكررة", "نشاط بدني مناسب"
  ];

  return (
    <section className="section" style={{ paddingBlock: "40px" }}>
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            background: "linear-gradient(135deg, var(--surface-brand) 0%, var(--primary-deep) 100%)",
            borderRadius: "var(--radius-xl)",
            padding: "40px",
            color: "var(--on-brand)",
            boxShadow: "var(--shadow-lg)",
            textAlign: "center"
          }}
        >
          <h3 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "30px" }}>
            ✨ {title}
          </h3>
          
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
            {displayItems.map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  padding: "12px 24px",
                  borderRadius: "40px",
                  fontWeight: "700",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
                }}
              >
                <span style={{ color: "var(--gold)" }}>✓</span>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}