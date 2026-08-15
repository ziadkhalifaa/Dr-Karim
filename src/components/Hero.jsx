import { useTranslation } from "react-i18next";
import { navigate } from "../lib/router";
import PlateArt from "./Artwork";
import { PulseIcon, AppleIcon, PlanIcon, SupportIcon } from "./Icons";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const { t } = useTranslation();
  const ref = useRef(null);
  
  // Parallax effect for the hero section
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const yContent = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacityContent = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const goAssessment = (e) => {
    e.preventDefault();
    navigate("/assessment");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 50, damping: 20 }
    }
  };

  const ctaVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { delay: 0.4, type: "spring", stiffness: 100 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  return (
    <section className="hero" id="home" ref={ref} style={{ position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", alignItems: "center" }}>
      {/* Background Parallax Layer */}
      <motion.div 
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at top right, var(--primary-deep) 0%, var(--deep) 100%)",
          y: yBg,
          zIndex: -1
        }}
      />
      
      {/* 3D Decorative particles */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: "10%", left: "5%", opacity: 0.1, fontSize: "40px" }}
      >
        ✦
      </motion.div>
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ position: "absolute", top: "30%", right: "8%", opacity: 0.05, fontSize: "60px" }}
      >
        ●
      </motion.div>
      
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <motion.div 
          className="hero__inner"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ y: yContent, opacity: opacityContent }}
        >
          <motion.div variants={itemVariants}>
            {/* Kicker removed per user request */}
          </motion.div>
          
          <motion.h1 
            variants={titleVariants} 
            className="hero__title"
            style={{ 
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)", 
              lineHeight: 1.15, 
              fontWeight: 900, 
              marginBottom: 24,
              letterSpacing: "-0.02em",
              textShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          >
            {t("hero.title1")}
            <strong style={{ 
              background: "linear-gradient(135deg, var(--primary-soft) 0%, var(--primary) 100%)", 
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "block", 
              marginTop: 12,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
            }}>
              {t("hero.title2")}
            </strong>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hero__subtitle" 
            style={{ 
              fontSize: "clamp(1.1rem, 2vw, 1.3rem)", 
              lineHeight: 1.7, 
              color: "rgba(255,255,255,0.8)", 
              marginBottom: 40, 
              maxWidth: 540,
              fontWeight: 500
            }}
          >
            {t("hero.subtitle")}
          </motion.p>
          
          <motion.div variants={ctaVariants} className="hero__actions" style={{ display: "flex", gap: 16 }}>
            <motion.a 
              href="/assessment" 
              onClick={goAssessment} 
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                boxShadow: ["0px 0px 0px rgba(242,124,107,0)", "0px 0px 20px rgba(242,124,107,0.6)", "0px 0px 0px rgba(242,124,107,0)"] 
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: 16, padding: "14px 28px", borderRadius: 16 }}
            >
              <PulseIcon />
              {t("hero.cta", "احجز استشارة فيديو أونلاين")}
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.95 }}
              href="/about" 
              className="btn btn-outline"
              style={{ borderRadius: 16 }}
              onClick={(e) => { e.preventDefault(); navigate("/about"); }}
            >
              {t("hero.ctaSecondary", "من نحن")}
            </motion.a>
          </motion.div>
          
          <motion.p variants={itemVariants} className="hero__trust" style={{ marginTop: 24, opacity: 0.9, fontSize: "16px", color: "var(--gold)" }}>
            ✨ متابعة فيديو لايف سيشن مرة أسبوعياً مع د.كريم الليثي شخصياً
          </motion.p>
        </motion.div>

        <motion.div 
          className="hero__img-container"
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.3 }}
          style={{ 
            flex: 1, 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            position: "relative",
            height: "100%"
          }}
        >
          {/* Glass floating card 1 */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: "10%",
              right: "10%",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              padding: "16px 24px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.2)",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
            }}
          >
            <div style={{ background: "var(--primary)", width: 40, height: 40, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <AppleIcon />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "18px", color: "#fff", lineHeight: 1.2 }}>+5,000</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>قصة نجاح</div>
            </div>
          </motion.div>

          {/* Glass floating card 2 */}
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            style={{
              position: "absolute",
              bottom: "15%",
              left: "5%",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              padding: "16px 24px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.2)",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
            }}
          >
            <div style={{ background: "var(--gold)", width: 40, height: 40, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <PlanIcon />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "18px", color: "#fff", lineHeight: 1.2 }}>100%</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>متابعة شخصية</div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 100 }}
            style={{
              position: "relative",
              width: "100%",
              height: "min(600px, 90vw)",
              borderRadius: "50%",
              background: "radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, transparent 60%)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              overflow: "visible"
            }}
          >
            <img 
              src="/assets/dr_karim_hero.png" 
              alt="Dr Kareem Eliethy" 
              style={{ 
                maxHeight: "115%", 
                objectFit: "contain",
                filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.4))",
                zIndex: 2
              }} 
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
