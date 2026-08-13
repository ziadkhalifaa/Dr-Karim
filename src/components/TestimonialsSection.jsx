import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { motion } from "framer-motion";
import { AppleIcon, GrowthIcon, HeartIcon } from "./Icons";

export default function TestimonialsSection() {
  const { t } = useTranslation();

  // 19 images
  const ratings = Array.from({ length: 19 }, (_, i) => `/assets/ratings/rating_${i + 1}.jpg`);

  return (
    <section className="section" id="testimonials" style={{ paddingBlock: "100px 60px", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      {/* Floating Background Elements for Creative Vibe */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        style={{ position: "absolute", top: "10%", left: "5%", color: "var(--primary-soft)", opacity: 0.3, zIndex: 0, width: "80px", height: "80px" }}
      >
        <AppleIcon />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -15, 15, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
        style={{ position: "absolute", bottom: "15%", right: "5%", color: "var(--gold)", opacity: 0.3, zIndex: 0, width: "100px", height: "100px" }}
      >
        <GrowthIcon />
      </motion.div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
        style={{ position: "absolute", top: "50%", left: "80%", color: "var(--secondary)", opacity: 0.2, zIndex: 0, width: "60px", height: "60px" }}
      >
        <HeartIcon />
      </motion.div>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: "50px" }}
        >
          <h2 className="sec-title" style={{ fontSize: "40px", color: "var(--primary-deep)", fontWeight: "900", marginBottom: "16px" }}>
            نجاحنا بفضل الله <strong style={{ color: "var(--primary)" }}>ثم ثقتكم</strong>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "18px" }}>
            آراء وتجارب بعض عملائنا الذين حققوا أهدافهم الصحية معنا
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <style>{`
            .swiper-button-next, .swiper-button-prev {
              color: var(--primary) !important;
              background: white;
              width: 50px;
              height: 50px;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .swiper-button-next:after, .swiper-button-prev:after {
              font-size: 20px;
              font-weight: bold;
            }
            .swiper-pagination-bullet-active {
              background: var(--primary) !important;
            }
          `}</style>
          <Swiper
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            loop={true}
            slidesPerView={'auto'}
            coverflowEffect={{
              rotate: 15,
              stretch: 0,
              depth: 300,
              modifier: 1,
              slideShadows: true,
            }}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            navigation={true}
            pagination={{ clickable: true, dynamicBullets: true }}
            modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
            style={{ padding: "40px 0", paddingBottom: "60px" }}
          >
            {ratings.map((src, index) => (
              <SwiperSlide key={index} style={{ width: "340px", height: "auto" }}>
                <div style={{
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
                  border: "4px solid white",
                  background: "white"
                }}>
                  <img src={src} alt={`Rating ${index + 1}`} style={{ width: "100%", display: "block", objectFit: "contain", maxHeight: "600px" }} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  );
}
