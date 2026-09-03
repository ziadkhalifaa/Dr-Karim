import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, User, BookOpen, Search } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { articleApi } from "../api/client";
import { navigate } from "../lib/router";
import { useTranslation } from "react-i18next";

function ArticleCard({ article }) {
  const { t } = useTranslation();
  return (
    <motion.article
      className="article-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      onClick={() => navigate(`/tips/${article.slug}`)}
    >
      <div className="article-card__media">
        {article.coverImageUrl ? (
          <img
            src={article.coverImageUrl}
            alt={article.title}
            onError={(e) => { e.currentTarget.src = "/assets/covers/article-healthy-habits.svg"; }}
          />
        ) : (
          <span className="article-card__fallback"><BookOpen size={44} /></span>
        )}
        <span className="article-card__badge">{t("tips.new")}</span>
      </div>
      <div className="article-card__body">
        <h3 className="article-card__title">{article.title}</h3>
        <p className="article-card__excerpt">{article.excerpt || t("tips.excerptFallback")}</p>
        <div className="article-card__meta">
          {article.authorName && (
            <span><User size={14} />{article.authorName}</span>
          )}
          {article.readTimeMinutes && (
            <span><Clock size={14} />{article.readTimeMinutes} {t("tips.minutes")}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function ArticlesPage() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    articleApi.list("?limit=50")
      .then((res) => setArticles(res.articles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.excerpt?.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [articles, searchQuery]);

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="page-hero__mesh" aria-hidden="true" />
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="page-hero__kicker">{t("tips.kicker")}</span>
              <h1 className="page-hero__title">
                {t("tips.title")} <span className="gold">{t("tips.title2")}</span>
              </h1>
              <p className="page-hero__lead">{t("tips.lead")}</p>
            </motion.div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div style={{ maxWidth: 540, margin: "0 auto 40px", position: "relative" }}>
              <Search
                size={20}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                className="input"
                placeholder="ابحث في المقالات والنصائح الطبية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingRight: 48,
                  borderRadius: 100,
                  boxShadow: "var(--shadow-sm)",
                  background: "var(--card-bg)",
                }}
              />
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                <div className="spinner" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)", fontWeight: 700 }}>
                {searchQuery ? "لم نجد مقالات تطابق بحثك" : t("tips.empty")}
              </div>
            ) : (
              <div className="articles__grid">
                {filteredArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
