import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Award, BookOpen, HeartPulse, GraduationCap, Sparkles } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { navigate } from "../lib/router";

export default function AboutPage() {
  const { t } = useTranslation();

  const features = [
    { icon: GraduationCap, title: t("about.qual.1.title"), desc: t("about.qual.1.desc") },
    { icon: Award, title: t("about.qual.2.title"), desc: t("about.qual.2.desc") },
    { icon: HeartPulse, title: t("about.qual.3.title"), desc: t("about.qual.3.desc") },
    { icon: BookOpen, title: t("about.qual.4.title"), desc: t("about.qual.4.desc") },
  ];

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="page-hero__mesh" aria-hidden="true" />
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="page-hero__kicker">{t("about.kicker")}</span>
              <h1 className="page-hero__title">
                {t("about.title")} <span className="gold">{t("about.title2")}</span>
              </h1>
              <p className="page-hero__lead">{t("about.lead")}</p>
            </motion.div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 60, alignItems: "center" }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7 }}
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid var(--line)",
                }}
              >
                <img src="/assets/drkarim.png" alt={t("brand.name")} style={{ width: "100%", objectFit: "cover" }} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <span className="sec-kicker">{t("about.kicker")}</span>
                <h2 className="sec-title">
                  {t("about.bio.title")} <span className="grad">{t("about.bio.title2")}</span>
                </h2>
                <p className="sec-lead" style={{ marginBottom: 28 }}>{t("about.bio.body")}</p>

                <div className="mission__points" style={{ marginBottom: 36 }}>
                  {t("about.bio.points", { returnObjects: true }).map((point, i) => (
                    <div className="mission__point" key={i}>
                      <span className="mission__point-ico">
                        <Sparkles size={20} />
                      </span>
                      <div>
                        <b>{point.title}</b>
                        <p>{point.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <a
                    href="/contact"
                    onClick={(e) => { e.preventDefault(); navigate("/contact"); }}
                    className="btn btn-primary"
                  >
                    {t("about.bio.cta")}
                  </a>
                  <a
                    href="/services"
                    onClick={(e) => { e.preventDefault(); navigate("/services"); }}
                    className="btn btn-ghost"
                  >
                    {t("about.bio.ctaSecondary")}
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section section--alt">
          <div className="container">
            <div className="section-head">
              <span className="sec-kicker">{t("about.quals.kicker")}</span>
              <h2 className="sec-title">
                {t("about.quals.title")} <span className="grad">{t("about.quals.title2")}</span>
              </h2>
              <p className="sec-lead">{t("about.quals.lead")}</p>
            </div>

            <div className="about-qual">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  className="qual-card"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <span className="qual-card__ico">
                    <feat.icon size={28} />
                  </span>
                  <h3 className="qual-card__title">{feat.title}</h3>
                  <p className="qual-card__desc">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
