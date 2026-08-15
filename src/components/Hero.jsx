import { useTranslation } from "react-i18next";
import { Star, ShieldCheck, HeartPulse, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { navigate } from "../lib/router";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="hero">
      <div className="hero__mesh" aria-hidden="true" />
      <div className="hero__glow-1" aria-hidden="true" />
      <div className="hero__glow-2" aria-hidden="true" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="hero__kicker">
            <span className="dot" />
            {t("brand.coach")}
          </span>

          <h1 className="hero__title">
            {t("hero.title1")} <span className="gold">{t("hero.title2")}</span>
          </h1>

          <p className="hero__subtitle">{t("hero.subtitle")}</p>

          <div className="hero__actions">
            <a
              href="/assessment"
              onClick={(e) => { e.preventDefault(); navigate("/assessment"); }}
              className="btn btn-accent btn-lg"
            >
              {t("hero.cta")}
            </a>
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); navigate("/about"); }}
              className="btn btn-outline btn-lg"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>

          <div className="hero__trust">
            <div className="hero__avatars">
              <span>+2k</span>
              <span>5.0</span>
              <span style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-deep))" }}>
                <Star size={18} fill="currentColor" />
              </span>
            </div>
            <div>
              <div className="hero__stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="hero__trust-text">{t("hero.trust")}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hero__media"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          <div className="hero__photo-wrap">
            <div className="hero__ring" aria-hidden="true" />
            <div className="hero__ring-2" aria-hidden="true" />
            <div className="hero__photo">
              <img src="/assets/dr_karim_hero.png" alt={t("brand.name")} />
            </div>

            <div className="hero__float hero__float--1">
              <span
                className="hero__float-ico"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-deep))" }}
              >
                <ShieldCheck size={20} />
              </span>
              <span>
                <b>{t("hero.chip1")}</b>
                <span>{t("brand.title")}</span>
              </span>
            </div>

            <div className="hero__float hero__float--2">
              <span
                className="hero__float-ico"
                style={{ background: "linear-gradient(135deg, var(--secondary), var(--secondary-deep))" }}
              >
                <HeartPulse size={20} />
              </span>
              <span>
                <b>{t("hero.chip2")}</b>
                <span>{t("hero.chip3")}</span>
              </span>
            </div>

            <div className="hero__float hero__float--3">
              <span
                className="hero__float-ico"
                style={{ background: "linear-gradient(135deg, var(--primary-deep), #065f46)" }}
              >
                <BadgeCheck size={20} />
              </span>
              <span>
                <b>{t("brand.coach")}</b>
                <span>{t("brand.city")}</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
