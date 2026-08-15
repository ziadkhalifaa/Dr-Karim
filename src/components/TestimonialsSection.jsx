import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { motion } from "framer-motion";

export default function TestimonialsSection() {
  const { t } = useTranslation();

  const ratings = Array.from({ length: 19 }, (_, i) => `/assets/ratings/rating_${i + 1}.jpg`);

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
            {ratings.map((src, index) => (
              <SwiperSlide key={index} style={{ width: 340 }}>
                <div className="testi__slide">
                  <img src={src} alt={`Rating ${index + 1}`} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  );
}
