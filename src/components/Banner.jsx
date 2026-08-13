import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function Banner() {
  const { t } = useTranslation();
  
  const text = t("banner.text");
  const parts = text.split(" • ");
  const title = parts[0]?.replace(/\*\*/g, '') || "الاعتماد على وجبات متوازنة";
  const items = parts.slice(1).map(p => p.replace(/\*\*/g, ''));

  const displayItems = items.length > 0 ? items : [
    "البروتين", "الكربوهيدرات", "الدهون الصحية", "الألياف", "تقليل السكريات المكررة", "نشاط بدني مناسب"
  ];

  return (
    <section className="section" style={{ paddingBlock: "60px", background: "var(--bg)" }}>
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            position: "relative",
            background: "var(--card-bg)",
            borderRadius: "var(--radius-xl)",
            padding: "50px",
            border: "1px solid var(--line)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}
        >
          {/* Decorative background shapes */}
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", background: "var(--primary-soft)", borderRadius: "50%", opacity: 0.5, filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "300px", height: "300px", background: "var(--highlight-bg)", borderRadius: "50%", opacity: 0.4, filter: "blur(50px)" }} />

          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <h3 style={{ fontSize: "36px", fontWeight: "900", color: "var(--primary-deep)", marginBottom: "40px" }}>
              {title}
            </h3>
            
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
              {displayItems.map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -5 }}
                  style={{
                    background: "var(--bg)",
                    padding: "16px 28px",
                    borderRadius: "16px",
                    fontWeight: "800",
                    fontSize: "17px",
                    color: "var(--text)",
                    border: "2px solid var(--line)",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "border-color 0.3s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--line)"}
                >
                  <span style={{ color: "var(--primary)", fontSize: "20px" }}>•</span>
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}