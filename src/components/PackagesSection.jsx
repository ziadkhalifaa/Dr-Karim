import { useState, useEffect } from "react";
import { Check, Zap, Star } from "lucide-react";
import { motion } from "framer-motion";
import { publicApi } from "../api/client";
import { navigate } from "../lib/router";
import { useTranslation } from "react-i18next";

export default function PackagesSection() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.packages()
      .then((data) => {
        if (data?.packages) setPackages(data.packages);
      })
      .catch((err) => console.error("Error fetching packages:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (packages.length === 0) return null;

  const middle = Math.floor(packages.length / 2);

  return (
    <section className="section section--alt" id="packages">
      <div className="container">
        <div className="section-head">
          <span className="sec-kicker">{t("packages.kicker")}</span>
          <h2 className="sec-title">
            {t("packages.title")} <span className="grad">{t("packages.title2")}</span>
          </h2>
          <p className="sec-lead">{t("packages.lead")}</p>
        </div>

        <div className="pricing__grid">
          {packages.map((pkg, index) => {
            const isHighlighted = index === middle;
            return (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={pkg.id}
                className={`price-card ${isHighlighted ? "price-card--featured" : ""}`}
              >
                {isHighlighted && (
                  <span className="price-card__flag">
                    <Star size={12} fill="currentColor" style={{ marginInlineEnd: 6, verticalAlign: -1 }} />
                    {t("packages.popular")}
                  </span>
                )}
                <h3 className="price-card__name">{pkg.name}</h3>
                <p className="price-card__desc">{pkg.description}</p>

                <div className="price-card__price-row">
                  <span className="price-card__price">{pkg.price}</span>
                  <span className="price-card__per">
                    {pkg.currency} / {pkg.durationValue} {t(`packages.unit.${pkg.durationUnit}`, pkg.durationUnit === "month" ? "شهر" : "مرة واحدة")}
                  </span>
                </div>

                <hr className="price-card__divider" />

                <ul className="price-card__features">
                  {pkg.features?.map((feature, i) => (
                    <li className="price-card__feature" key={i}>
                      <span className="price-card__feature-ico">
                        <Check size={14} />
                      </span>
                      {feature}
                    </li>
                  ))}
                  {(!pkg.features || pkg.features.length === 0) && (
                    <li className="price-card__feature">{t("packages.details")}</li>
                  )}
                </ul>

                <a
                  href="/assessment"
                  onClick={(e) => { e.preventDefault(); navigate("/assessment"); }}
                  className={`btn btn-block price-card__cta ${isHighlighted ? "btn-accent" : "btn-ghost"}`}
                >
                  {isHighlighted && <Zap size={16} />}
                  {t("packages.subscribe")}
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
