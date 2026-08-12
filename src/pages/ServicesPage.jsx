import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ServicesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a full implementation, this would fetch from /api/v1/content
    // For now, we simulate dynamic fetching using translations structure
    setTimeout(() => {
      setCategories(t("services.groups", { returnObjects: true }));
      setLoading(false);
    }, 500);
  }, [t]);

  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh", padding: "120px 20px 60px", background: "var(--bg)" }}>
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "60px" }}
          >
            <h1 className="sec-title" style={{ fontSize: "44px", color: "var(--text)" }}>
              خدماتنا <strong style={{ color: "var(--primary)" }}>الطبية</strong>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "700px", margin: "16px auto 0" }}>
              نقدم مجموعة متكاملة من الخدمات لضمان وصولك لهدفك الصحي بأمان.
            </p>
          </motion.div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <p>جاري التحميل...</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
              {categories.map((group, gi) => (
                <motion.div 
                  key={gi}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: gi * 0.1 }}
                >
                  <h2 style={{ fontSize: "28px", color: "var(--text)", marginBottom: "24px" }}>{group.title}</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    {group.items.map((item, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(18, 59, 74, 0.12)", borderColor: "var(--primary-soft)" }}
                        style={{ background: "var(--card-bg)", borderRadius: "var(--radius-lg)", padding: "30px", border: "1px solid var(--line)" }}
                      >
                        <h3 style={{ fontSize: "22px", color: "var(--text)", marginBottom: "12px", fontWeight: "800" }}>{item.title}</h3>
                        <p style={{ fontSize: "16px", color: "var(--text-muted)", lineHeight: "1.6" }}>{item.body}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
