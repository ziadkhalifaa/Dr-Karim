import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ContentPage({ title, slug }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamic fetching simulation for full stack structure
    fetch(`/api/v1/content/${slug}?lang=ar`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setContent(data.data.translations?.[0]?.body || data.data.body);
        } else {
          // Fallback dummy content if DB is empty
          setContent(`هذه الصفحة (${title}) سيتم تحديث محتواها قريباً عبر لوحة التحكم الديناميكية.`);
        }
        setLoading(false);
      })
      .catch(() => {
        setContent(`هذه الصفحة (${title}) سيتم تحديث محتواها قريباً عبر لوحة التحكم الديناميكية.`);
        setLoading(false);
      });
  }, [slug, title]);

  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh", padding: "120px 20px 60px", background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "40px" }}
          >
            <h1 className="sec-title" style={{ fontSize: "40px", color: "var(--text)" }}>
              {title}
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ 
              background: "var(--card-bg)", 
              padding: "40px", 
              borderRadius: "var(--radius-lg)", 
              boxShadow: "var(--shadow)",
              border: "1px solid var(--line)"
            }}
          >
            {loading ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)" }}>جاري التحميل...</div>
            ) : (
              <div style={{ fontSize: "17px", lineHeight: "1.8", color: "var(--text-muted)" }} dangerouslySetInnerHTML={{ __html: content }} />
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
