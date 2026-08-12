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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  return (
    <section className="hero" id="home" ref={ref} style={{ position: "relative", overflow: "hidden" }}>
      {/* Background Parallax Layer */}
      <motion.div 
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, var(--surface-brand) 0%, var(--deep) 100%)",
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
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="hero__kicker"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, background: "rgba(255, 255, 255, 0.1)", color: "var(--gold)", borderRadius: 40, padding: "8px 18px", marginBottom: 22 }}
            >
              <PulseIcon />
              {t("brand.title")}
            </motion.span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="hero__title">
            {t("hero.title1")}
            <strong style={{ color: "var(--secondary)", display: "block", marginTop: 8 }}>
              {t("hero.title2")}
            </strong>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="hero__subtitle">
            {t("hero.subtitle")}
          </motion.p>
          
          <motion.div variants={itemVariants} className="hero__cta-row">
            <motion.a 
              whileHover={{ scale: 1.05, boxShadow: "0 15px 30px rgba(242, 124, 107, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              href="/assessment" 
              onClick={goAssessment} 
              className="btn btn-accent"
              style={{ borderRadius: 16 }}
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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
          className="hero__wrap"
          style={{ perspective: 1000 }}
        >
          <motion.div
            whileHover={{ rotateY: 5, rotateX: 5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 100 }}
            style={{
              position: "relative",
              width: "100%",
              height: "min(560px, 88vw)",
              borderRadius: "50%",
              background: "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              overflow: "visible"
            }}
          >
            <img 
              src="/assets/drkarim.png" 
              alt="Dr Kareem Eliethy" 
              style={{ 
                maxHeight: "110%", 
                objectFit: "contain",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))",
                zIndex: 2
              }} 
            />
          </motion.div>

          <motion.div 
            className="hero__chip hero__chip--1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
            transition={{ 
              opacity: { delay: 0.8, duration: 0.5 },
              x: { delay: 0.8, duration: 0.5 },
              y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }
            }}
          >
            <span className="chip-ico" style={{ background: "var(--secondary)" }}>
              <AppleIcon />
            </span>
            <span>{t("hero.chip1")}</span>
          </motion.div>

          <motion.div 
            className="hero__chip hero__chip--2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
            transition={{ 
              opacity: { delay: 1, duration: 0.5 },
              x: { delay: 1, duration: 0.5 },
              y: { repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1.5 }
            }}
          >
            <span className="chip-ico" style={{ background: "var(--primary)" }}>
              <PlanIcon />
            </span>
            <span>{t("hero.chip2")}</span>
          </motion.div>

          <motion.div 
            className="hero__chip hero__chip--3"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{ 
              opacity: { delay: 1.2, duration: 0.5 },
              y: { repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }
            }}
          >
            <span className="chip-ico" style={{ background: "var(--gold)" }}>
              <SupportIcon />
            </span>
            <span>{t("hero.chip3")}</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
