import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicApi } from "../api/client";
import { navigate } from "../lib/router";
import { useTranslation } from "react-i18next";

const FALLBACK_COVER = "/assets/covers/service-therapeutic-nutrition.svg";

export default function ServiceSinglePage({ code }) {
  const { t, i18n } = useTranslation();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAr = i18n.language === "ar";
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  useEffect(() => {
    const lang = i18n.language?.startsWith("en") ? "en" : "ar";
    publicApi.service(code, lang)
      .then((res) => setService(res))
      .catch((err) => setError(err.message || t("services.single.error")))
      .finally(() => setLoading(false));
  }, [code, i18n.language, t]);

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

  if (error || !service) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 20px", textAlign: "center" }}>
          <h2 className="sec-title" style={{ fontSize: 34 }}>{t("services.single.notFound")}</h2>
          <p style={{ color: "var(--text-muted)" }}>{t("services.single.notFoundBody")}</p>
          <a
            href="/services"
            onClick={(e) => { e.preventDefault(); navigate("/services"); }}
            className="btn btn-primary"
          >
            <BackArrow size={18} />
            {t("services.single.back")}
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
            <span className="page-hero__kicker">
              {service.category?.title || t("services.kicker")}
            </span>
            <h1 className="page-hero__title">{service.title}</h1>
            <div
              className="page-hero__crumbs"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <a href="/services" onClick={(e) => { e.preventDefault(); navigate("/services"); }}>
                {t("services.single.back")}
              </a>
              <span>/</span>
              <span>{service.title}</span>
            </div>
          </div>
        </section>

        <section className="section section--tight" style={{ paddingBlock: "64px 0" }}>
          <div className="container">
            <div className="content-sheet" style={{ maxWidth: 860, marginInline: "auto" }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="service-card__media" style={{ height: 380, borderRadius: "var(--radius-lg)", marginBottom: 36 }}>
                  <img
                    src={service.coverImageUrl || FALLBACK_COVER}
                    alt={service.title}
                    onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
                  />
                </div>

                <div
                  className="content-sheet__body"
                  style={{ fontSize: 17.5 }}
                  dangerouslySetInnerHTML={{ __html: service.body }}
                />

                <div style={{ marginTop: 40, textAlign: "center" }}>
                  <a
                    href="/assessment"
                    onClick={(e) => { e.preventDefault(); navigate("/assessment"); }}
                    className="btn btn-primary btn-lg"
                  >
                    <Sparkles size={20} />
                    {t("services.cta")}
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
