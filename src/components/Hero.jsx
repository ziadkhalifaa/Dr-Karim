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
            {/* Kicker removed per user request */}
          </motion.div>
          
          <motion.h1 
            variants={titleVariants} 
            className="hero__title"
            style={{ 
              fontSize: "clamp(2.5rem, 5vw, 4rem)", 
              lineHeight: 1.2, 
              fontWeight: 900, 
              marginBottom: 20 
            }}
          >
            {t("hero.title1")}
            <strong style={{ color: "var(--secondary)", display: "block", marginTop: 8 }}>
              {t("hero.title2")}
            </strong>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hero__subtitle" 
            style={{ 
              fontSize: "clamp(1.1rem, 2vw, 1.3rem)", 
              lineHeight: 1.6, 
              color: "rgba(255,255,255,0.85)", 
              marginBottom: 40, 
              maxWidth: 500 
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
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          style={{ 
            flex: 1, 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "flex-end", 
            position: "relative",
            height: "100%"
          }}
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
              src="/assets/dr_karim_hero.png" 
              alt="Dr Kareem Eliethy" 
              style={{ 
                maxHeight: "110%", 
                objectFit: "contain",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))",
                zIndex: 2
              }} 
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
