import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { navigate } from "../lib/router";

const SLIDES = [
  "/assets/dr_karim_hero.png",
  "/assets/slider_1.png",
  "/assets/slider_2.png",
  "/assets/slider_3.png",
  "/assets/drkarim.png",
];

export default function Hero() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  const prev = () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setIndex((i) => (i + 1) % SLIDES.length);

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

            <div className="hero__photo hero-slider">
              <AnimatePresence mode="wait">
                <motion.img
                  key={index}
                  src={SLIDES[index]}
                  alt={t("brand.name")}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </AnimatePresence>

              <button
                type="button"
                className="hero-slider__btn hero-slider__btn--prev"
                onClick={prev}
                aria-label="Previous"
              >
                {isAr ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
              </button>
              <button
                type="button"
                className="hero-slider__btn hero-slider__btn--next"
                onClick={next}
                aria-label="Next"
              >
                {isAr ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
              </button>

              <div className="hero-slider__dots">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`hero-slider__dot ${i === index ? "is-active" : ""}`}
                    onClick={() => setIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
