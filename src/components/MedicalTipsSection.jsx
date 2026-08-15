import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Clock, BookOpen, ArrowLeft, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { articleApi } from "../api/client";
import { navigate } from "../lib/router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export default function MedicalTipsSection() {
  const { t, i18n } = useTranslation();
  const [articles, setArticles] = useState([]);
  const isAr = i18n.language === "ar";

  useEffect(() => {
    articleApi.list("?limit=6")
      .then((res) => setArticles(res.articles || []))
      .catch(console.error);
  }, []);

  if (articles.length === 0) return null;

  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="section" style={{ background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-soft) 100%)" }}>
      <div className="container">
        <div className="section-head">
          <span className="sec-kicker">{t("tips.kicker")}</span>
          <h2 className="sec-title">
            {t("tips.title")} <span className="grad">{t("tips.title2")}</span>
          </h2>
          <p className="sec-lead">{t("tips.lead")}</p>
        </div>

        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: ".articles-slider__btn--next",
            prevEl: ".articles-slider__btn--prev",
          }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          spaceBetween={26}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {articles.map((art, i) => (
            <SwiperSlide key={art.id}>
              <motion.article
                className="article-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                onClick={() => navigate(`/tips/${art.slug}`)}
              >
                <div className="article-card__media">
                  {art.coverImageUrl ? (
                    <img src={art.coverImageUrl} alt={art.title} />
                  ) : (
                    <span className="article-card__fallback">
                      <BookOpen size={44} />
                    </span>
                  )}
                  <span className="article-card__badge">{t("tips.new")}</span>
                </div>
                <div className="article-card__body">
                  <h3 className="article-card__title">{art.title}</h3>
                  <p className="article-card__excerpt">{art.excerpt || t("tips.excerptFallback")}</p>
                  <div className="article-card__meta">
                    <span>
                      <Clock size={14} />
                      {art.readTimeMinutes ? `${art.readTimeMinutes} ${t("tips.minutes")}` : t("tips.read")}
                    </span>
                    <span>
                      <BookOpen size={14} />
                      {t("tips.open")}
                    </span>
                  </div>
                </div>
              </motion.article>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="articles-slider__nav">
          <button className="articles-slider__btn articles-slider__btn--prev" aria-label="prev">
            <ChevronRight size={22} />
          </button>
          <button className="articles-slider__btn articles-slider__btn--next" aria-label="next">
            <ChevronLeft size={22} />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginTop: 44 }}
        >
          <a
            href="/articles"
            onClick={(e) => { e.preventDefault(); navigate("/articles"); }}
            className="btn btn-primary btn-lg"
          >
            {t("tips.browseAll")}
            <Arrow size={20} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
