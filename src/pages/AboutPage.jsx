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
            style={{ textAlign: "center", marginBottom: "80px" }}
          >
            <span style={{ display: "inline-block", background: "var(--highlight-bg)", color: "var(--primary-deep)", padding: "8px 16px", borderRadius: "100px", fontSize: "15px", fontWeight: "800", marginBottom: "16px" }}>
              من نحن
            </span>
            <h1 className="sec-title" style={{ fontSize: "clamp(36px, 5vw, 54px)", color: "var(--text)" }}>
              عن <strong style={{ color: "var(--primary)" }}>الطبيب</strong>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "700px", margin: "20px auto 0", lineHeight: 1.8, fontWeight: 500 }}>
              تعرف على الدكتور كريم الليثي، خبرته، ومؤهلاته العلمية التي تجعله خيارك الأمثل لحياة صحية.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", alignItems: "center" }}>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.4 }}
              style={{
                background: "linear-gradient(135deg, var(--primary-deep) 0%, var(--deep) 100%)",
                borderRadius: "32px",
                padding: "20px",
                display: "flex",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 24px 48px rgba(0,0,0,0.15)"
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)" }} />
              <img 
                src="/assets/drkarim.png" 
                alt="Dr Kareem Eliethy" 
                style={{ width: "100%", maxWidth: "400px", objectFit: "contain", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))", position: "relative", zIndex: 1 }} 
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              <h2 style={{ fontSize: "36px", color: "var(--primary-deep)", fontWeight: "900", letterSpacing: "-0.02em" }}>د. كريم الليثي</h2>
              <p style={{ fontSize: "18px", color: "var(--text-muted)", lineHeight: "1.9", fontWeight: 500 }}>
                استشاري التغذية العلاجية والسمنة والنحافة، ومدرب صحي معتمد (Health Coach). يهدف إلى تغيير مفهوم الدايت ليكون نمط حياة صحي ومستدام وليس مجرد حرمان مؤقت.
              </p>
              
              <ul style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "10px" }}>
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
                    style={{ 
                      display: "flex", alignItems: "center", gap: "16px", 
                      fontSize: "17px", fontWeight: "700", color: "var(--text)",
                      background: "var(--card-bg)", padding: "16px 20px",
                      borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                      border: "1px solid var(--line)"
                    }}
                  >
                    <span style={{ 
                      width: "32px", height: "32px", borderRadius: "10px", 
                      background: "var(--highlight-bg)", color: "var(--primary-deep)", 
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" 
                    }}>✔</span>
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
