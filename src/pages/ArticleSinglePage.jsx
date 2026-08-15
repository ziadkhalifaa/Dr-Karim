import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, User, Calendar, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { articleApi } from "../api/client";

export default function ArticleSinglePage({ slug }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    articleApi.get(slug)
      .then(res => setArticle(res.data))
      .catch(err => setError(err.message || "حدث خطأ"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "80vh", padding: "120px 20px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Clock size={40} style={{ animation: "spin 2s linear infinite", color: "var(--text-soft)" }} />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !article) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "80vh", padding: "120px 20px", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
          <h2 style={{ fontSize: "32px", color: "var(--text)", fontWeight: "900" }}>المقالة غير موجودة</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>عذراً، المقالة التي تبحث عنها غير موجودة أو تم حذفها.</p>
          <a href="/articles" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--primary)", color: "#fff", padding: "12px 24px", borderRadius: "12px", textDecoration: "none", fontWeight: "700" }}>
            <ArrowRight size={18} /> العودة للنصائح
          </a>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh", padding: "120px 20px 80px", background: "var(--bg)" }}>
        <article className="container" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <a href="/articles" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "14px", fontWeight: "700", marginBottom: "30px", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "var(--primary)"} onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}>
            <ArrowRight size={16} /> العودة للنصائح
          </a>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "900", color: "var(--text)", lineHeight: 1.3, marginBottom: "24px" }}>
              {article.title}
            </h1>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", color: "var(--text-muted)", fontSize: "14px", fontWeight: "600", marginBottom: "40px", paddingBottom: "20px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><User size={16} /> {article.authorName}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={16} /> {new Date(article.publishedAt).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {article.readTimeMinutes && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Clock size={16} /> {article.readTimeMinutes} دقائق قراءة</span>}
            </div>

            {article.coverImageUrl && (
              <img src={article.coverImageUrl} alt={article.title} style={{ width: "100%", maxHeight: "500px", objectFit: "cover", borderRadius: "24px", marginBottom: "40px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }} />
            )}

            <div 
              className="article-content tiptap-editor"
              style={{ fontSize: "18px", lineHeight: 1.8, color: "var(--text)", fontFamily: "inherit" }}
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          </motion.div>
        </article>
      </main>
      <Footer />
      
      {/* Article Content Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .article-content h1 { font-size: 32px; font-weight: 900; margin: 40px 0 20px; color: var(--text); }
        .article-content h2 { font-size: 26px; font-weight: 800; margin: 36px 0 16px; color: var(--text); }
        .article-content h3 { font-size: 22px; font-weight: 700; margin: 30px 0 12px; color: var(--text); }
        .article-content p { margin: 0 0 20px; }
        .article-content img { max-width: 100%; border-radius: 16px; margin: 24px 0; }
        .article-content a { color: var(--primary); text-decoration: underline; }
        .article-content blockquote { border-right: 4px solid var(--primary); padding-right: 20px; margin: 30px 0; font-size: 20px; font-style: italic; color: var(--text-muted); }
        .article-content ul, .article-content ol { padding-right: 24px; margin: 0 0 20px; }
        .article-content li { margin-bottom: 10px; }
        .article-content mark { background: #fef08a; padding: 0 4px; border-radius: 4px; }
      `}} />
    </>
  );
}
