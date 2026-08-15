import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ContentPage({ title, slug }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/content/${slug}?lang=ar`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setContent(data.data.translations?.[0]?.body || data.data.body);
        } else {
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
      <main>
        <section className="page-hero" style={{ padding: "88px 0 64px" }}>
          <div className="page-hero__mesh" aria-hidden="true" />
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="page-hero__title">{title}</h1>
            </motion.div>
          </div>
        </section>

        <section className="section section--tight" style={{ paddingBlock: "64px 96px" }}>
          <div className="container">
            <div className="content-sheet" style={{ maxWidth: 860, marginInline: "auto" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div className="spinner" style={{ marginInline: "auto" }} />
                </div>
              ) : (
                <motion.div
                  className="content-sheet__body"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
