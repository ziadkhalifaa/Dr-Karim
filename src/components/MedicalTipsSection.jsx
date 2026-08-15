import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { articleApi } from "../api/client";

function FlipCard({ article }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      style={{ height: "360px", perspective: "1000px", cursor: "pointer" }}
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
          borderRadius: "24px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
        }}>
          {article.coverImageUrl ? (
            <img src={article.coverImageUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--dash-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-primary)", fontSize: "40px", fontWeight: "900", opacity: 0.5 }}>
              د. كريم
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)", padding: "40px 24px 24px", color: "#fff" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "900", lineHeight: 1.4, margin: 0 }}>{article.title}</h3>
            {article.readTimeMinutes && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", marginTop: "12px", opacity: 0.8 }}>
                <Clock size={14} /> {article.readTimeMinutes} دقائق قراءة
              </div>
            )}
          </div>
        </div>

        {/* Back */}
        <div style={{
          position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden",
          background: "var(--primary)", color: "#fff", borderRadius: "24px",
          transform: "rotateY(180deg)", padding: "32px 24px", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 40px rgba(var(--primary-rgb), 0.3)"
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: "900", lineHeight: 1.4, marginBottom: "16px" }}>{article.title}</h3>
          <p style={{ fontSize: "15px", lineHeight: 1.6, opacity: 0.9, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical" }}>
            {article.excerpt || "اقرأ المزيد عن هذا الموضوع لتكتشف أهم النصائح الطبية والغذائية..."}
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "15px", marginTop: "16px", background: "rgba(255,255,255,0.2)", padding: "12px 20px", borderRadius: "12px", width: "fit-content" }}>
            اقرأ المقالة <ArrowRight size={18} />
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
    <section style={{ padding: "100px 20px", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ textAlign: "center", marginBottom: "60px" }}
        >
          <span style={{ color: "var(--primary)", fontWeight: "800", fontSize: "16px", letterSpacing: "1px", textTransform: "uppercase", background: "var(--primary-light)", padding: "8px 16px", borderRadius: "100px", display: "inline-block", marginBottom: "16px" }}>
            ثقف نفسك
          </span>
          <h2 className="sec-title" style={{ fontSize: "clamp(32px, 5vw, 44px)" }}>
            أحدث <strong style={{ color: "var(--primary)" }}>النصائح الطبية</strong>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "600px", margin: "16px auto 0" }}>
            اكتشف أهم المعلومات والنصائح الطبية والغذائية الموثوقة التي تساعدك في الحفاظ على صحتك
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px", marginBottom: "50px" }}>
          {articles.map((art, i) => (
            <motion.div 
              key={art.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <FlipCard article={art} />
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <a href="/articles" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: "16px", fontWeight: "800", display: "inline-flex", gap: "8px" }}>
            تصفح كل النصائح <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
