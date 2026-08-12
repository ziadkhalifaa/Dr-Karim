import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ArticlesPage() {
  const articles = [
    { title: "أهمية شرب الماء للتخسيس", excerpt: "الماء يلعب دوراً هاماً في زيادة معدل الحرق...", img: "https://images.unsplash.com/photo-1542282811-943ef1a67779?w=500&q=80" },
    { title: "كيف تتغلب على ثبات الوزن؟", excerpt: "ثبات الوزن من أكثر المشاكل التي تواجه متبعي الدايت...", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&q=80" },
    { title: "الصيام المتقطع للمبتدئين", excerpt: "دليلك الشامل لبدء الصيام المتقطع بشكل صحي وآمن.", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80" }
  ];

  return (
    <>
      <Header />
      <main style={{ minHeight: "80vh", padding: "120px 20px 60px", background: "var(--bg)" }}>
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "60px" }}
          >
            <h1 className="sec-title" style={{ fontSize: "44px", color: "var(--text)" }}>
              أحدث <strong style={{ color: "var(--primary)" }}>المقالات</strong>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "700px", margin: "16px auto 0" }}>
              نصائح طبية وغذائية للحفاظ على صحتك ورشاقتك. (ديناميكية من قاعدة البيانات)
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ paddingBottom: "40px" }}
          >
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              breakpoints={{
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 3000 }}
              style={{ padding: "20px 10px 60px" }}
            >
              {articles.map((art, i) => (
                <SwiperSlide key={i}>
                  <motion.div 
                    whileHover={{ y: -10, boxShadow: "0 30px 60px rgba(0,0,0,0.15)" }}
                    style={{
                      background: "var(--card-bg)",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      border: "1px solid var(--line)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%"
                    }}
                  >
                    <img src={art.img} alt={art.title} style={{ width: "100%", height: "220px", objectFit: "cover" }} />
                    <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)", marginBottom: "12px" }}>{art.title}</h3>
                      <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "20px", flex: 1 }}>{art.excerpt}</p>
                      <span style={{ color: "var(--primary)", fontWeight: "700", fontSize: "14px" }}>اقرأ المزيد ←</span>
                    </div>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
