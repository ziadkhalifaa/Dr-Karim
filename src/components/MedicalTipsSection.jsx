import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, BookOpen, ChevronRight, ChevronLeft } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectCards } from "swiper/modules";
import { articleApi } from "../api/client";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-cards";

function FlipCard({ article }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      style={{ height: "420px", perspective: "1000px", cursor: "pointer", width: "100%" }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => window.location.href = `/tips/${article.slug}`}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Front */}
        <div style={{
          position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden",
          borderRadius: "24px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          background: "var(--bg-glass)", border: "1px solid rgba(255,255,255,0.2)",
          backdropFilter: "blur(12px)"
        }}>
          {article.coverImageUrl ? (
            <img src={article.coverImageUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--dash-primary-soft) 0%, #fff 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-primary)", fontSize: "40px", fontWeight: "900", opacity: 0.8 }}>
              <BookOpen size={64} opacity={0.5} />
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)", padding: "60px 24px 24px", color: "#fff" }}>
            <span style={{ background: "var(--primary)", color: "#fff", fontSize: "12px", fontWeight: "800", padding: "4px 10px", borderRadius: "100px", marginBottom: "12px", display: "inline-block" }}>
              مقال جديد
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: "900", lineHeight: 1.4, margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>{article.title}</h3>
            {article.readTimeMinutes && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "600", marginTop: "12px", opacity: 0.9 }}>
                <Clock size={16} /> {article.readTimeMinutes} دقائق قراءة
              </div>
            )}
          </div>
        </div>

        {/* Back */}
        <div style={{
          position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden",
          background: "var(--primary)", color: "#fff", borderRadius: "24px",
          transform: "rotateY(180deg)", padding: "40px 32px", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 40px rgba(var(--primary-rgb), 0.3)"
        }}>
          <BookOpen size={32} style={{ marginBottom: "20px", opacity: 0.8 }} />
          <h3 style={{ fontSize: "22px", fontWeight: "900", lineHeight: 1.4, marginBottom: "16px" }}>{article.title}</h3>
          <p style={{ fontSize: "16px", lineHeight: 1.7, opacity: 0.9, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical" }}>
            {article.excerpt || "اقرأ المزيد عن هذا الموضوع لتكتشف أهم النصائح الطبية والغذائية واستمتع بحياة صحية متوازنة..."}
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "16px", marginTop: "24px", background: "rgba(255,255,255,0.2)", padding: "14px 24px", borderRadius: "100px", width: "fit-content", transition: "all 0.3s ease" }}>
            اقرأ المقالة <ArrowRight size={20} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function MedicalTipsSection() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    articleApi.list("?limit=6")
      .then(res => setArticles(res.articles || []))
      .catch(console.error);
  }, []);

  if (articles.length === 0) return null;

  return (
    <section style={{ padding: "120px 20px", background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-alt) 100%)", position: "relative", overflow: "hidden" }}>
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ textAlign: "center", marginBottom: "80px" }}
        >
          <span style={{ color: "var(--primary)", fontWeight: "800", fontSize: "16px", letterSpacing: "1px", textTransform: "uppercase", background: "var(--primary-light)", padding: "10px 20px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <BookOpen size={18} /> ثقف نفسك
          </span>
          <h2 className="sec-title" style={{ fontSize: "clamp(36px, 5vw, 48px)" }}>
            أحدث <strong style={{ color: "var(--primary)", background: "linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>النصائح الطبية</strong>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "20px", maxWidth: "600px", margin: "20px auto 0", lineHeight: 1.6 }}>
            اكتشف أهم المعلومات والنصائح الطبية والغذائية الموثوقة التي تساعدك في الحفاظ على صحتك
          </p>
        </motion.div>

        <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto 60px" }}>
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              nextEl: '.swiper-btn-next',
              prevEl: '.swiper-btn-prev',
            }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            spaceBetween={30}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            style={{ padding: "20px 10px" }}
          >
            {articles.map((art, i) => (
              <SwiperSlide key={art.id}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <FlipCard article={art} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "40px" }}>
            <button className="swiper-btn-prev" style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", color: "var(--primary)", transition: "all 0.3s ease" }}>
              <ChevronRight size={24} />
            </button>
            <button className="swiper-btn-next" style={{ width: "50px", height: "50px", borderRadius: "50%", background: "var(--primary)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 20px rgba(var(--primary-rgb), 0.3)", color: "#fff", transition: "all 0.3s ease" }}>
              <ChevronLeft size={24} />
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center" }}
        >
          <a href="/articles" className="btn" style={{ background: "linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)", color: "#fff", padding: "16px 40px", borderRadius: "100px", fontSize: "18px", fontWeight: "800", display: "inline-flex", gap: "12px", alignItems: "center", boxShadow: "0 10px 30px rgba(var(--primary-rgb), 0.3)" }}>
            تصفح كل النصائح <ArrowRight size={22} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
