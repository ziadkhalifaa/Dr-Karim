import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, User, BookOpen } from "lucide-react";
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
          <img src={article.coverImageUrl} alt={article.title} />
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

  useEffect(() => {
    articleApi.list("?limit=20")
      .then((res) => setArticles(res.articles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                <div className="spinner" />
              </div>
            ) : articles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)", fontWeight: 700 }}>
                {t("tips.empty")}
              </div>
            ) : (
              <div className="articles__grid">
                {articles.map((art) => (
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
