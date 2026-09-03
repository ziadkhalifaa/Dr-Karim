import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { publicApi } from "../api/client";

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState([]);
  const ratings = Array.from({ length: 19 }, (_, i) => `/assets/ratings/rating_${i + 1}.jpg`);

  useEffect(() => {
    publicApi.testimonials()
      .then((res) => {
        if (res.data?.data) {
          setTestimonials(res.data.data);
        }
      })
      .catch((err) => console.error("Failed to load testimonials:", err));
  }, []);

  return (
    <section className="section" id="testimonials" style={{ paddingBlock: "96px 72px" }}>
      <div className="container">
        <div className="section-head">
          <span className="sec-kicker">{t("testimonials.kicker")}</span>
          <h2 className="sec-title">
            {t("testimonials.title")} <span className="grad">{t("testimonials.title2")}</span>
          </h2>
          <p className="sec-lead">{t("testimonials.lead")}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="testi"
        >
          <Swiper
            effect="coverflow"
            grabCursor
            centeredSlides
            loop
            slidesPerView="auto"
            coverflowEffect={{ rotate: 15, stretch: 0, depth: 300, modifier: 1, slideShadows: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            navigation
            pagination={{ clickable: true, dynamicBullets: true }}
            modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
            style={{ padding: "40px 0 60px" }}
          >
            {testimonials.length > 0 ? (
              testimonials.map((t) => (
                <SwiperSlide key={t.id} style={{ width: 340 }}>
                  <div className="testi-card">
                    {t.image_url ? (
                      <div className="testi-card__img">
                        <img src={t.image_url} alt={t.patient_name} />
                      </div>
                    ) : null}
                    <div className="testi-card__content">
                      <div className="testi-card__rating">
                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                          <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                        ))}
                      </div>
                      <p className="testi-card__text">"{t.content}"</p>
                      <div className="testi-card__author">
                        <strong>{t.patient_name}</strong>
                        {t.patient_subtitle && <span>{t.patient_subtitle}</span>}
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))
            ) : (
              ratings.map((src, index) => (
                <SwiperSlide key={index} style={{ width: 340 }}>
                  <div className="testi__slide">
                    <img src={src} alt={`Rating ${index + 1}`} />
                  </div>
                </SwiperSlide>
              ))
            )}
          </Swiper>
        </motion.div>
      </div>
    </section>
  );
}
