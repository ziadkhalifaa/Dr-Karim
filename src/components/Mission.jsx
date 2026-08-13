import { useTranslation } from "react-i18next";
import { waUrl } from "../config";
import { WhatsAppIcon } from "./Icons";
import { motion } from "framer-motion";

export default function Mission() {
  const { t } = useTranslation();

  return (
    <section className="section" id="about">
      <div className="container">
        <div className="mission">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
            whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <div className="stat-card__badge" style={{ padding: "0" }}>
              <img src="/assets/logo.png" alt="Dr Kareem Logo" style={{ width: "120px", height: "120px", objectFit: "contain" }} />
            </div>
            <p className="stat-card__meta">
              {t("mission.years")}
              <br />
            </p>
            <div className="stat-card__num">
              {t("mission.yearsNum")}
              <span className="unit"> {t("mission.yearsUnit")}</span>
            </div>
            <p className="stat-card__text">{t("mission.yearsText")}</p>
          </motion.div>

          <motion.div 
            className="mission__body"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="mission__title">
              <div className="sec-title">
                {t("mission.title")} <strong>{t("mission.title2")}</strong>
              </div>
            </h2>
            <p className="mission__text">{t("mission.body")}</p>
            <motion.a 
              href={waUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <WhatsAppIcon />
              {t("mission.cta")}
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}