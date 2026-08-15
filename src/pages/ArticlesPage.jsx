import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { articleApi } from "../api/client";

function ArticleCard({ article }) {
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(0,0,0,0.08)", borderColor: "rgba(5, 150, 105, 0.3)" }}
      style={{
        background: "var(--card-bg)",
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid var(--line)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
      onClick={() => window.location.href = `/tips/${article.slug}`}
    >
      <div style={{ position: "relative", width: "100%", height: "240px", overflow: "hidden" }}>
        {article.coverImageUrl ? (
          <img src={article.coverImageUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }} className="article-img-hover" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--highlight-bg) 0%, var(--bg) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-soft)", fontSize: "40px", fontWeight: "900", opacity: 0.8 }}>
            د. كريم الليثي
          </div>
        )}
      </div>
      <div style={{ padding: "30px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: "22px", fontWeight: "900", color: "var(--text)", marginBottom: "12px", lineHeight: 1.5, letterSpacing: "-0.01em" }}>{article.title}</h3>
        <p style={{ fontSize: "16px", color: "var(--text-muted)", marginBottom: "24px", flex: 1, lineHeight: 1.7, fontWeight: 500 }}>{article.excerpt || "اقرأ المزيد عن هذا الموضوع لتكتشف أهم النصائح الطبية والغذائية..."}</p>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "var(--text-muted)", fontSize: "14px", fontWeight: "700", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><User size={16} color="var(--primary)" /> {article.authorName}</span>
          {article.readTimeMinutes && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Clock size={16} color="var(--primary)" /> {article.readTimeMinutes} دقائق قراءة</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articleApi.list("?limit=20")
      .then(res => setArticles(res.articles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh", padding: "120px 20px 80px", background: "var(--bg)" }}>
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "80px" }}
          >
            <span style={{ display: "inline-block", background: "var(--highlight-bg)", color: "var(--primary-deep)", padding: "8px 16px", borderRadius: "100px", fontSize: "15px", fontWeight: "800", marginBottom: "16px" }}>
              المدونة
            </span>
            <h1 className="sec-title" style={{ fontSize: "clamp(36px, 5vw, 54px)", color: "var(--text)" }}>
              نصائح <strong style={{ color: "var(--primary)" }}>طبية وغذائية</strong>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "700px", margin: "20px auto 0", lineHeight: 1.8, fontWeight: 500 }}>
              مكتبة شاملة لأهم النصائح والمقالات الطبية التي تساعدك في رحلتك نحو صحة أفضل وجسم مثالي بطرق علمية مدروسة.
            </p>
          </motion.div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "100px", color: "var(--text-soft)" }}>
              <Clock size={40} style={{ animation: "spin 2s linear infinite", opacity: 0.5 }} />
            </div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px", color: "var(--text-soft)", fontSize: "18px", fontWeight: "700" }}>
              لا توجد مقالات منشورة حالياً. يرجى العودة لاحقاً.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px" }}>
              {articles.map(art => (
                <ArticleCard key={art.id} article={art} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
