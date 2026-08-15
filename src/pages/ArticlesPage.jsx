import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { articleApi } from "../api/client";

function ArticleCard({ article }) {
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      style={{
        background: "var(--card-bg)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--line)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}
      onClick={() => window.location.href = `/tips/${article.slug}`}
    >
      {article.coverImageUrl ? (
        <img src={article.coverImageUrl} alt={article.title} style={{ width: "100%", height: "220px", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "220px", background: "var(--dash-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-primary)", fontSize: "40px", fontWeight: "900", opacity: 0.5 }}>
          د. كريم الليثي
        </div>
      )}
      <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "900", color: "var(--text)", marginBottom: "12px", lineHeight: 1.4 }}>{article.title}</h3>
        <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "20px", flex: 1, lineHeight: 1.6 }}>{article.excerpt || "اقرأ المزيد عن هذا الموضوع لتكتشف أهم النصائح الطبية والغذائية..."}</p>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "var(--text-soft)", fontSize: "13px", fontWeight: "700" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><User size={14} /> {article.authorName}</span>
          {article.readTimeMinutes && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Clock size={14} /> {article.readTimeMinutes} دقائق قراءة</span>}
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
            style={{ textAlign: "center", marginBottom: "60px" }}
          >
            <h1 className="sec-title" style={{ fontSize: "44px", color: "var(--text)" }}>
              نصائح <strong style={{ color: "var(--primary)" }}>طبية وغذائية</strong>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "700px", margin: "16px auto 0" }}>
              مكتبة شاملة لأهم النصائح والمقالات الطبية التي تساعدك في رحلتك نحو صحة أفضل وجسم مثالي
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
