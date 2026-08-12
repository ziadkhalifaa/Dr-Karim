import { useTranslation } from "react-i18next";
import { waUrl } from "../config";
import { WhatsAppIcon } from "./Icons";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function CareSection() {
  const { t } = useTranslation();
  const ref = useRef(null);
  
  // Create rotation based on scroll for the salad plate
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const spin = useTransform(scrollYProgress, [0, 1], [0, 180]);

  return (
    <section className="section" ref={ref}>
      <div className="container">
        <div className="care">
          <div className="care-card care-card--brand anim-slideR">
            <h3 className="card-title">{t("care.title")}</h3>
            <p className="card-body">{t("care.body")}</p>
            <div>
              <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-accent">
                <WhatsAppIcon />
                {t("care.cta")}
              </a>
            </div>
          </div>

          <div className="care__img anim-pop" style={{ perspective: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <motion.div
              style={{ rotate: spin }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 50 }}
            >
              <img 
                src="/assets/salad_plate.png" 
                alt="Healthy Salad" 
                style={{ 
                  width: "100%", 
                  maxWidth: "350px", 
                  height: "auto", 
                  filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.2))",
                  objectFit: "contain"
                }} 
              />
            </motion.div>
          </div>

          <div className="care-card care-card--tint anim-slideL">
            <h3 className="card-title">{t("care.guideTitle")}</h3>
            <p className="card-body">{t("care.guideBody")}</p>
          </div>
        </div>

        <div className="spacer" />

        <div className="programs">
          <div className="programs__card anim-slideL">
            <h3 className="card-title">{t("care.programsTitle")}</h3>
            <p className="card-body">{t("care.programsBody")}</p>
          </div>
          <div className="care__img anim-pop" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <motion.img 
              src="/assets/special_programs.png" 
              alt="Specialized Programs" 
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ type: "spring", stiffness: 100 }}
              style={{ 
                width: "100%", 
                maxWidth: "400px", 
                height: "auto", 
                filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.15))",
                objectFit: "contain"
              }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
}