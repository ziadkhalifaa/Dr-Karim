import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicApi } from "../api/client";

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lang = i18n.language?.startsWith("en") ? "en" : "ar";
    publicApi.services(lang)
      .then((data) => {
        const groups = data?.groups || [];
        if (groups.length > 0) {
          setCategories(groups);
        } else {
          // Fallback to translation file if DB has no services yet
          const fallback = t("services.groups", { returnObjects: true });
          setCategories(Array.isArray(fallback) ? fallback : []);
        }
      })
      .catch(() => {
        // Graceful fallback to static translations
        const fallback = t("services.groups", { returnObjects: true });
        setCategories(Array.isArray(fallback) ? fallback : []);
      })
      .finally(() => setLoading(false));
  }, [i18n.language, t]);

  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh", padding: "120px 20px 60px", background: "var(--bg)" }}>
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "80px" }}
          >
            <span style={{ display: "inline-block", background: "var(--highlight-bg)", color: "var(--primary-deep)", padding: "8px 16px", borderRadius: "100px", fontSize: "15px", fontWeight: "800", marginBottom: "16px" }}>
              مجالات التخصص
            </span>
            <h1 className="sec-title" style={{ fontSize: "clamp(36px, 5vw, 54px)", color: "var(--text)" }}>
              خدماتنا <strong style={{ color: "var(--primary)" }}>الطبية</strong>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "700px", margin: "20px auto 0", lineHeight: 1.8, fontWeight: 500 }}>
              نقدم مجموعة متكاملة من الخدمات لضمان وصولك لهدفك الصحي بأمان، مصممة خصيصاً لتناسب احتياجاتك وحالتك الصحية.
            </p>
          </motion.div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--line)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px", color: "var(--text-muted)", fontSize: "18px", fontWeight: "700" }}>
              لا توجد خدمات منشورة حالياً.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
              {categories.map((group, gi) => (
                <motion.div 
                  key={group.id || gi}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: gi * 0.1 }}
                >
                  <h2 style={{ fontSize: "32px", color: "var(--primary-deep)", marginBottom: "32px", fontWeight: "900", borderBottom: "2px solid var(--line)", paddingBottom: "16px" }}>{group.title}</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" }}>
                    {(group.items || []).map((item, i) => (
                      <motion.div 
                        key={item.id || i}
                        whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(0,0,0,0.08)", borderColor: "rgba(5, 150, 105, 0.3)" }}
                        style={{ 
                          background: "var(--card-bg)", 
                          borderRadius: "24px", 
                          padding: "36px 30px", 
                          border: "1px solid var(--line)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "flex", flexDirection: "column", gap: "16px",
                          position: "relative", overflow: "hidden"
                        }}
                      >
                        <div style={{ position: "absolute", top: 0, insetInline: 0, height: "4px", background: "linear-gradient(90deg, var(--primary), var(--primary-soft))" }} />
                        <h3 style={{ fontSize: "24px", color: "var(--text)", fontWeight: "900", letterSpacing: "-0.01em" }}>{item.title}</h3>
                        <p style={{ fontSize: "16px", color: "var(--text-muted)", lineHeight: "1.9", fontWeight: 500 }}>{item.body}</p>
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
