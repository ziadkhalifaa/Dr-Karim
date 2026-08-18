import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicApi } from "../api/client";
import { navigate } from "../lib/router";

const FALLBACK_COVER = "/assets/covers/service-therapeutic-nutrition.svg";

const openService = (e, code) => {
  e.preventDefault();
  navigate(`/services/${code}`);
};

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
          const fallback = t("services.groups", { returnObjects: true });
          setCategories(Array.isArray(fallback) ? fallback : []);
        }
      })
      .catch(() => {
        const fallback = t("services.groups", { returnObjects: true });
        setCategories(Array.isArray(fallback) ? fallback : []);
      })
      .finally(() => setLoading(false));
  }, [i18n.language, t]);

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="page-hero__mesh" aria-hidden="true" />
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="page-hero__kicker">{t("services.kicker")}</span>
              <h1 className="page-hero__title">
                {t("services.title")} <span className="gold">{t("services.title2")}</span>
              </h1>
              <p className="page-hero__lead">{t("services.lead")}</p>
            </motion.div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                <div className="spinner" />
              </div>
            ) : categories.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)", fontWeight: 700 }}>
                {t("services.empty")}
              </div>
            ) : (
              categories.map((group, gi) => (
                <motion.div
                  key={group.id || gi}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: gi * 0.08 }}
                  style={{ marginBottom: gi < categories.length - 1 ? 56 : 0 }}
                >
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: "var(--secondary-deep)",
                      marginBottom: 22,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: "var(--secondary-tint)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles size={16} />
                    </span>
                    {group.title}
                  </h3>
                  <div className="services__grid">
                    {(group.items || []).map((item, i) => (
                      <motion.article
                        key={item.id || i}
                        className="service-card"
                        style={{ cursor: "pointer" }}
                        onClick={(e) => openService(e, item.code)}
                        tabIndex={0}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ delay: i * 0.06, duration: 0.5 }}
                      >
                        <div className="service-card__inner">
                          <div className="service-card__face service-card__face--front">
                            <div className="service-card__media">
                              {item.coverImageUrl ? (
                                <img
                                  src={item.coverImageUrl}
                                  alt={item.title}
                                  onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
                                />
                              ) : (
                                <span className="service-card__fallback"><Sparkles size={40} /></span>
                              )}
                            </div>
                          </div>
                          <div className="service-card__face service-card__face--back">
                            <div className="service-card__body">
                              <span className="service-card__cat">{group.title}</span>
                              <h4 className="service-card__title">{item.title}</h4>
                              <p className="service-card__desc">{item.body}</p>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
