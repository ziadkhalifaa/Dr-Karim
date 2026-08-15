import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, User, Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { articleApi } from "../api/client";
import { navigate } from "../lib/router";
import { useTranslation } from "react-i18next";

export default function ArticleSinglePage({ slug }) {
  const { t, i18n } = useTranslation();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAr = i18n.language === "ar";
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  useEffect(() => {
    articleApi.get(slug)
      .then((res) => setArticle(res))
      .catch((err) => setError(err.message || t("tips.error")))
      .finally(() => setLoading(false));
  }, [slug, t]);

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !article) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 20px", textAlign: "center" }}>
          <h2 className="sec-title" style={{ fontSize: 34 }}>{t("tips.notFound")}</h2>
          <p style={{ color: "var(--text-muted)" }}>{t("tips.notFoundBody")}</p>
          <a
            href="/articles"
            onClick={(e) => { e.preventDefault(); navigate("/articles"); }}
            className="btn btn-primary"
          >
            <BackArrow size={18} />
            {t("tips.back")}
          </a>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ paddingBlock: "64px 96px" }}>
        <section className="page-hero" style={{ padding: "80px 0 56px" }}>
          <div className="page-hero__mesh" aria-hidden="true" />
          <div className="container">
            <span className="page-hero__kicker">{t("tips.kicker")}</span>
            <h1 className="page-hero__title">{article.title}</h1>
            <div
              className="page-hero__crumbs"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <a href="/articles" onClick={(e) => { e.preventDefault(); navigate("/articles"); }}>
                {t("tips.back")}
              </a>
              <span>/</span>
              <span>{article.title}</span>
            </div>
          </div>
        </section>

        <section className="section section--tight" style={{ paddingBlock: "64px 0" }}>
          <div className="container">
            <div className="content-sheet" style={{ maxWidth: 860, marginInline: "auto" }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 18,
                    alignItems: "center",
                    color: "var(--text-muted)",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 28,
                    paddingBottom: 22,
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {article.authorName && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <User size={15} /> {article.authorName}
                    </span>
                  )}
                  {article.publishedAt && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={15} />
                      {new Date(article.publishedAt).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  )}
                  {article.readTimeMinutes && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Clock size={15} /> {article.readTimeMinutes} {t("tips.minutes")}
                    </span>
                  )}
                </div>

                {article.coverImageUrl && (
                  <img
                    src={article.coverImageUrl}
                    alt={article.title}
                    onError={(e) => { e.currentTarget.src = "/assets/covers/article-healthy-habits.svg"; }}
                    style={{ width: "100%", maxHeight: 480, objectFit: "cover", borderRadius: "var(--radius-lg)", marginBottom: 36 }}
                  />
                )}

                <div
                  className="content-sheet__body"
                  style={{ fontSize: 17.5 }}
                  dangerouslySetInnerHTML={{ __html: article.body }}
                />
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
