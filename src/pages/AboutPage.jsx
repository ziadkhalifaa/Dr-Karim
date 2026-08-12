import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AboutPage() {
  const { t } = useTranslation();

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
              عن <strong style={{ color: "var(--primary)" }}>الطبيب</strong>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "700px", margin: "16px auto 0" }}>
              تعرف على الدكتور كريم الليثي، خبرته، ومؤهلاته العلمية.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", alignItems: "center" }}>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                background: "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%), var(--surface-brand)",
                borderRadius: "var(--radius-xl)",
                padding: "20px",
                display: "flex",
                justifyContent: "center"
              }}
            >
              <img 
                src="/assets/drkarim.png" 
                alt="Dr Kareem Eliethy" 
                style={{ width: "100%", maxWidth: "400px", objectFit: "contain", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))" }} 
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <h2 style={{ fontSize: "32px", color: "var(--primary)", fontWeight: "800" }}>د. كريم الليثي</h2>
              <p style={{ fontSize: "18px", color: "var(--text-muted)", lineHeight: "1.8" }}>
                استشاري التغذية العلاجية والسمنة والنحافة، ومدرب صحي معتمد (Health Coach). يهدف إلى تغيير مفهوم الدايت ليكون نمط حياة صحي ومستدام.
              </p>
              
              <ul style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                {[
                  "ماجستير في كيمياء حيوية الغذاء",
                  "مدرب محترف معتمد من جامعة إسلسكا",
                  "كوتش تغذية معتمد من Precision Nutrition بكندا",
                  "خبرة واسعة في التغذية العلاجية وبرامج إنقاص الوزن وتغذية الأطفال"
                ].map((item, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "17px", fontWeight: "600", color: "var(--text)" }}
                  >
                    <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--highlight-bg)", color: "var(--highlight-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✔</span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
