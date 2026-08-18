import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { navigate } from "../lib/router";
import { publicApi } from "../api/client";

const FALLBACK_ICON = <Sparkles size={40} />;
const FALLBACK_COVER = "/assets/covers/service-therapeutic-nutrition.svg";

const openService = (e, code) => {
  e.preventDefault();
  navigate(`/services/${code}`);
};

export default function ServicesSection() {
  const { t, i18n } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lang = i18n.language?.startsWith("en") ? "en" : "ar";
    publicApi.services(lang)
      .then((data) => {
        const _groups = data?.groups || [];
        if (_groups.length > 0) setGroups(_groups);
      })
      .catch((e) => console.error("Error fetching services:", e))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  const Arrow = i18n.language === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="section" id="services">
      <div className="container">
        <div className="section-head">
          <span className="sec-kicker">{t("services.kicker")}</span>
          <h2 className="sec-title">
            {t("services.title")} <span className="grad">{t("services.title2")}</span>
          </h2>
          <p className="sec-lead">{t("services.lead")}</p>
        </div>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <div className="spinner" />
          </div>
        )}

        {groups.map((group, gi) => (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            key={gi}
            style={{ marginBottom: gi < groups.length - 1 ? 56 : 0 }}
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
              {group.items.map((item, i) => (
                <motion.article
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  key={i}
                  className="service-card"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => openService(e, item.code)}
                  tabIndex={0}
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
                          <span className="service-card__fallback">{FALLBACK_ICON}</span>
                        )}
                      </div>
                    </div>
                    <div className="service-card__face service-card__face--back">
                      <div className="service-card__body">
                        <span className="service-card__cat">{group.title}</span>
                        <h4 className="service-card__title">{item.title}</h4>
                        <p className="service-card__desc">{item.body}</p>
                        <span className="service-card__foot">
                          {t("services.more")}
                          <Arrow size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginTop: 56 }}
        >
          <a
            href="/assessment"
            onClick={(e) => { e.preventDefault(); navigate("/assessment"); }}
            className="btn btn-primary btn-lg"
          >
            <Sparkles size={20} />
            {t("services.cta")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
