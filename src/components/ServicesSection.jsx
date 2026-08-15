import { useTranslation } from "react-i18next";
import { PulseIcon } from "./Icons";
import { motion } from "framer-motion";
import { navigate } from "../lib/router";

// Placeholder images carefully selected from Unsplash for each topic
const SERVICE_IMAGES = {
  "التغذية العلاجية": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80",
  "علاج السمنة": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
  "علاج النحافة": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80",
  "مقاومة الإنسولين": "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=600&q=80",
  "اضطرابات الغدة الدرقية": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
  "السكري لدى الأطفال": "https://images.unsplash.com/photo-1514066558159-fc8c737ef259?auto=format&fit=crop&w=600&q=80"
};

// Generic fallback image
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80";

export default function ServicesSection() {
  const { t } = useTranslation();
  const groups = t("services.groups", { returnObjects: true });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
  };

  const goAssessment = (e) => {
    e.preventDefault();
    navigate("/assessment");
  };

  return (
    <section className="section" id="services" style={{ paddingBlock: "100px", background: "var(--bg)" }}>
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="services__head"
          style={{ textAlign: "center", marginBottom: "80px" }}
        >
          <span style={{ display: "inline-block", background: "var(--highlight-bg)", color: "var(--primary-deep)", padding: "8px 16px", borderRadius: "100px", fontSize: "15px", fontWeight: "800", marginBottom: "16px" }}>
            مجالات التخصص
          </span>
          <h2 className="sec-title" style={{ fontSize: "clamp(32px, 5vw, 48px)", color: "var(--text)" }}>
            {t("services.title")} <strong style={{ color: "var(--primary)" }}>{t("services.title2")}</strong>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "600px", margin: "20px auto 0", lineHeight: 1.8, fontWeight: 500 }}>
            حلول غذائية شاملة ومخصصة لمساعدتك في الوصول إلى هدفك بأفضل طريقة صحية ومستدامة.
          </p>
        </motion.div>

        {groups.map((group, gi) => (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            key={gi}
            style={{ marginBottom: "60px" }}
          >
            <h3 style={{ fontSize: "28px", color: "var(--primary-deep)", marginBottom: "24px", fontWeight: "800", borderBottom: "2px solid var(--line)", paddingBottom: "12px" }}>
              {group.title}
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
              gap: "30px" 
            }}>
              {group.items.map((item, i) => {
                const imgSrc = SERVICE_IMAGES[item.title] || FALLBACK_IMAGE;
                
                return (
                  <motion.article 
                    variants={cardVariants}
                    whileHover={{ 
                      y: -10, 
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
                    }}
                    key={i} 
                    style={{ 
                      background: "var(--card-bg)",
                      borderRadius: "var(--radius-xl)",
                      overflow: "hidden",
                      border: "1px solid var(--line)",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.3s ease"
                    }}
                  >
                    {/* Image Area */}
                    <div style={{ width: "100%", height: "200px", position: "relative", overflow: "hidden" }}>
                      <motion.img 
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        src={imgSrc} 
                        alt={item.title} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    
                    {/* Content Area */}
                    <div style={{ padding: "30px 24px", flex: 1, display: "flex", flexDirection: "column", background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 15%)" }}>
                      <h4 style={{ fontSize: "22px", fontWeight: "900", color: "var(--text)", marginBottom: "12px" }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: "16px", lineHeight: "1.7", color: "var(--text-muted)", flex: 1, fontWeight: 500 }}>
                        {item.body}
                      </p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>
        ))}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginTop: "60px", textAlign: "center" }}
        >
          <motion.a 
            whileHover={{ scale: 1.05, boxShadow: "0 15px 30px rgba(242, 124, 107, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            href="/assessment" 
            onClick={goAssessment}
            className="btn btn-accent"
            style={{ borderRadius: "16px", padding: "18px 40px", fontSize: "18px" }}
          >
            <PulseIcon />
            {t("services.cta")}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
