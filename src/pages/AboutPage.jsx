import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Award, BookOpen, HeartPulse, GraduationCap, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AboutPage() {
  const { t } = useTranslation();

  const features = [
    { icon: GraduationCap, title: "مؤهلات علمية عالية", desc: "ماجستير في كيمياء حيوية الغذاء، وكوتش تغذية معتمد من Precision Nutrition بكندا." },
    { icon: Award, title: "مدرب محترف معتمد", desc: "مدرب محترف معتمد من جامعة إسلسكا لتقديم استشارات مبنية على أسس علمية." },
    { icon: HeartPulse, title: "نهج صحي مستدام", desc: "الهدف هو تغيير مفهوم الدايت ليكون نمط حياة وليس مجرد حرمان مؤقت." },
    { icon: BookOpen, title: "خبرة واسعة", desc: "خبرة في التغذية العلاجية وبرامج إنقاص الوزن وتغذية الأطفال." }
  ];

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-alt) 100%)", overflowX: "hidden" }}>
        {/* Hero Section */}
        <section style={{ padding: "160px 20px 80px", position: "relative" }}>
          {/* Decorative Elements */}
          <div style={{ position: "absolute", top: "10%", right: "-5%", width: "400px", height: "400px", background: "radial-gradient(circle, var(--dash-primary-soft) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0, opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: "10%", left: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(var(--secondary-rgb), 0.1) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 0 }} />

          <div className="container" style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px", alignItems: "center" }}>
              
              {/* Text Content */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--bg-glass)", color: "var(--primary)", padding: "10px 24px", borderRadius: "100px", fontSize: "16px", fontWeight: "800", marginBottom: "24px", border: "1px solid rgba(var(--primary-rgb), 0.2)", backdropFilter: "blur(10px)" }}>
                  <Award size={18} /> عن الطبيب
                </span>
                
                <h1 style={{ fontSize: "clamp(42px, 6vw, 64px)", color: "var(--text)", fontWeight: "900", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: "24px" }}>
                  الدكتور <br/>
                  <span style={{ background: "linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>كريم الليثي</span>
                </h1>
                
                <p style={{ color: "var(--text-muted)", fontSize: "20px", lineHeight: 1.8, fontWeight: 500, marginBottom: "40px" }}>
                  استشاري التغذية العلاجية والسمنة والنحافة، ومدرب صحي معتمد (Health Coach). 
                  رسالتنا هي تمكينك من عيش حياة أكثر صحة وسعادة من خلال التغذية السليمة.
                </p>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <a href="/contact" className="btn" style={{ background: "var(--primary)", color: "#fff", padding: "16px 32px", borderRadius: "100px", fontSize: "18px", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 30px rgba(var(--primary-rgb), 0.3)", transition: "all 0.3s ease" }}>
                    احجز استشارتك <ArrowRight size={20} />
                  </a>
                  <a href="/services" className="btn" style={{ background: "var(--bg-glass)", color: "var(--text)", border: "2px solid var(--border)", padding: "14px 32px", borderRadius: "100px", fontSize: "18px", fontWeight: "800", display: "inline-flex", alignItems: "center", transition: "all 0.3s ease" }}>
                    خدماتنا
                  </a>
                </div>
              </motion.div>

              {/* Image Content */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                style={{ position: "relative" }}
              >
                <div style={{ position: "absolute", inset: "-20px", background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", borderRadius: "40px", transform: "rotate(-6deg)", zIndex: 0, opacity: 0.1 }} />
                <div style={{ position: "absolute", inset: "0", background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", borderRadius: "40px", zIndex: 1, boxShadow: "0 30px 60px rgba(var(--primary-rgb), 0.2)" }} />
                
                <img 
                  src="/assets/drkarim.png" 
                  alt="Dr Kareem Eliethy" 
                  style={{ width: "100%", maxWidth: "480px", objectFit: "contain", position: "relative", zIndex: 2, display: "block", margin: "0 auto", transform: "translateY(-40px)", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))" }} 
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features/Qualifications Section */}
        <section style={{ padding: "80px 20px 120px", position: "relative", zIndex: 2 }}>
          <div className="container">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginBottom: "60px" }}
            >
              <h2 style={{ fontSize: "clamp(32px, 4vw, 42px)", fontWeight: "900", color: "var(--text)", marginBottom: "16px" }}>
                المؤهلات <span style={{ color: "var(--primary)" }}>والخبرات</span>
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
                نبني ثقتنا معك من خلال أساس علمي متين وخبرة عملية واسعة في مجال التغذية العلاجية
              </p>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "30px" }}>
              {features.map((feat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                  style={{
                    background: "var(--bg-glass)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: "24px",
                    padding: "32px 24px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
                    backdropFilter: "blur(12px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    cursor: "pointer"
                  }}
                  whileHover={{ y: -10, boxShadow: "0 20px 40px rgba(var(--primary-rgb), 0.1)" }}
                >
                  <div style={{ width: "70px", height: "70px", borderRadius: "20px", background: "linear-gradient(135deg, var(--dash-primary-soft) 0%, rgba(var(--primary-rgb), 0.05) 100%)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                    <feat.icon size={32} />
                  </div>
                  <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)", marginBottom: "16px" }}>{feat.title}</h3>
                  <p style={{ fontSize: "16px", color: "var(--text-muted)", lineHeight: 1.6 }}>{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
