import { useState, useEffect } from "react";
import { Check, Zap, Star, Lock, Wallet, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { publicApi, patientApi } from "../api/client";
import { navigate } from "../lib/router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthProvider";
import { featureLabel } from "../constants/entitlements";

const DAY_MS = 86400000;

export default function PackagesSection() {
  const { t } = useTranslation();
  const { user, authenticated } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  const isStaff = authenticated && user?.role !== "patient";

  useEffect(() => {
    publicApi.packages()
      .then((data) => {
        if (data?.packages) setPackages(data.packages);
      })
      .catch((err) => console.error("Error fetching packages:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authenticated || user?.role !== "patient" || !user?.patientId) return;
    patientApi.home()
      .then((home) => setSubscription(home?.subscription || null))
      .catch(() => {});
  }, [authenticated, user?.role, user?.patientId]);

  const current = subscription?.package?.slug
    ? packages.find((p) => p.slug === subscription.package.slug) || null
    : null;

  const prorated = (() => {
    if (!current || !subscription?.startsAt) return null;
    const starts = new Date(subscription.startsAt).getTime();
    if (Number.isNaN(starts)) return null;
    const ends = subscription.endsAt ? new Date(subscription.endsAt).getTime() : null;
    const totalDays = ends && !Number.isNaN(ends)
      ? Math.max(1, Math.round((ends - starts) / DAY_MS))
      : (current.durationValue || 1) * (current.durationUnit === "week" ? 7 : 30);
    const usedDays = Math.max(0, Math.round((Date.now() - starts) / DAY_MS));
    const frac = Math.max(0, Math.min(1, (totalDays - usedDays) / totalDays));
    return {
      totalDays,
      usedDays,
      remainingDays: Math.max(0, Math.round(frac * totalDays)),
      remainingValue: Math.round(current.price * frac),
    };
  })();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (packages.length === 0) return null;

  const middle = Math.floor(packages.length / 2);

  const bannerStyle = (bg, border, color) => ({
    maxWidth: 760,
    margin: "0 auto 30px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    background: bg,
    border: `1px solid ${border}`,
    color,
    borderRadius: 16,
    padding: "16px 20px",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.6,
  });

  return (
    <section className="section section--alt" id="packages">
      <div className="container">
        <div className="section-head">
          <span className="sec-kicker">{t("packages.kicker")}</span>
          <h2 className="sec-title">
            {t("packages.title")} <span className="grad">{t("packages.title2")}</span>
          </h2>
          <p className="sec-lead">
            {isStaff
              ? t("packages.leadStaff", { defaultValue: t("packages.lead") })
              : t("packages.lead")}
          </p>
        </div>

        {isStaff && (
          <div style={bannerStyle("rgba(2,79,171,0.12)", "rgba(2,79,171,0.4)", "var(--secondary-soft)")}>
            <Lock size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{t("packages.previewBanner", { defaultValue: "أنت في وضع المعاينة كطبيب — أزرار الاشتراك معطلة." })}</span>
            <button
              onClick={() => navigate("/doctor/packages")}
              style={{
                background: "var(--secondary)",
                border: "none",
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
                padding: "9px 16px",
                borderRadius: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Wallet size={14} />
              {t("packages.managePackages", { defaultValue: "إدارة الباقات" })}
            </button>
          </div>
        )}

        {prorated && (
          <div style={bannerStyle("rgba(111,208,5,0.12)", "rgba(111,208,5,0.45)", "var(--primary-deep)")}>
            <Wallet size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              {t("packages.subscribedBanner", {
                defaultValue: "أنت مشترك في {name} — باقي {days} يوم · قيمة رصيدك المتبقي {value} {currency}",
                name: current?.name || "—",
                days: prorated.remainingDays,
                value: prorated.remainingValue.toLocaleString("ar-EG"),
                currency: current?.currency || "EGP",
              })}
            </span>
            <span style={{ fontSize: 12.5, opacity: 0.85 }}>
              {t("packages.upgradeHint", { defaultValue: "عند الترقية ادفع فرق السعر فقط" })}
            </span>
          </div>
        )}

        <div className="pricing__grid">
          {packages.map((pkg, index) => {
            const isHighlighted = index === middle;
            const isCurrent = current && pkg.slug === current.slug;
            const canUpgrade = prorated && current && pkg.price > current.price;
            const diff = canUpgrade ? Math.max(0, pkg.price - prorated.remainingValue) : 0;

            let cta;
            if (isStaff) {
              cta = (
                <span
                  className="price-card__cta"
                  style={{
                    display: "block",
                    textAlign: "center",
                    width: "100%",
                    padding: "13px 20px",
                    borderRadius: 14,
                    border: "1px dashed var(--line)",
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    fontSize: 14,
                    opacity: 0.85,
                    cursor: "not-allowed",
                  }}
                >
                  {t("packages.previewLocked", { defaultValue: "للمشتركين" })}
                </span>
              );
            } else if (isCurrent) {
              cta = (
                <span
                  className="price-card__cta"
                  style={{
                    display: "block",
                    textAlign: "center",
                    width: "100%",
                    padding: "13px 20px",
                    borderRadius: 14,
                    background: "var(--primary-tint)",
                    border: "1px solid var(--primary)",
                    color: "var(--primary-deep)",
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  {t("packages.currentPlan", { defaultValue: "✓ باقتك الحالية" })}
                </span>
              );
            } else {
              cta = (
                <a
                  href={canUpgrade ? "/payment" : "/assessment"}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(canUpgrade ? `/payment?packageId=${pkg.id}` : "/assessment");
                  }}
                  className={`btn btn-block price-card__cta ${isHighlighted ? "btn-accent" : "btn-ghost"}`}
                >
                  {isHighlighted || canUpgrade ? <Zap size={16} /> : null}
                  {canUpgrade
                    ? t("packages.upgrade", { defaultValue: "ترقية الآن" })
                    : t("packages.subscribe")}
                </a>
              );
            }

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
                {canUpgrade && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "var(--primary-tint)",
                      border: "1px solid rgba(111,208,5,0.4)",
                      color: "var(--primary-deep)",
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 800,
                      marginBottom: 14,
                    }}
                  >
                    <TrendingUp size={13} />
                    {t("packages.upgradeDiff", { defaultValue: "فرق الترقية" })}:{" "}
                    {diff.toLocaleString("ar-EG")} {pkg.currency || "EGP"}
                  </span>
                )}
                <h3 className="price-card__name">{pkg.name}</h3>
                <p className="price-card__desc">{pkg.description}</p>

                <div className="price-card__price-row">
                  <span className="price-card__price">{canUpgrade ? diff : pkg.price}</span>
                  <span className="price-card__per">
                    {pkg.currency} / {pkg.durationValue} {t(`packages.unit.${pkg.durationUnit}`, pkg.durationUnit === "week" ? "أسبوع" : pkg.durationUnit === "month" ? "شهر" : "مرة واحدة")}
                  </span>
                </div>
                {canUpgrade && (
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)" }}>
                    {t("packages.fullPrice", {
                      defaultValue: "السعر الأصلي {price} {currency}",
                      price: pkg.price.toLocaleString("ar-EG"),
                      currency: pkg.currency || "EGP",
                    })}
                  </p>
                )}

                <hr className="price-card__divider" />

                <ul className="price-card__features">
                  {pkg.features?.map((feature, i) => (
                    <li className="price-card__feature" key={i}>
                      <span className="price-card__feature-ico">
                        <Check size={14} />
                      </span>
                      {featureLabel(feature)}
                    </li>
                  ))}
                  {(!pkg.features || pkg.features.length === 0) && (
                    <li className="price-card__feature">{t("packages.details")}</li>
                  )}
                </ul>

                {cta}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}