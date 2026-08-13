import { useTranslation } from "react-i18next";
import { PulseIcon, CrossIcon, CheckIcon } from "./Icons";
import { motion } from "framer-motion";

export default function WarningSection() {
  const { t } = useTranslation();
  const wrongList = t("warning.list", { returnObjects: true });
  const rightList = t("warning.goodList", { returnObjects: true });

  return (
    <section className="section" id="articles">
      <div className="container">
        <motion.div 
          className="services__head"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <h2 className="sec-title">{t("warning.sectionTitle")}</h2>
        </motion.div>

        <motion.div 
          className="warning"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="warn-card warn-card--no anim-slideR">
            <div className="warn-card__head">
              <motion.span
                className="warn-card__badge"
                style={{ background: "var(--secondary)", display: "inline-block" }}
                animate={{ opacity: [1, 0, 1], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                <CrossIcon />
              </motion.span>
              {t("warning.title")}
            </div>
            <p className="warn-card__body">{t("warning.body")}</p>
            <ul className="warn-card__list">
              {wrongList.map((li, i) => (
                <li key={i}>{li}</li>
              ))}
            </ul>
          </div>

          <div className="warn-card warn-card--yes anim-slideL">
            <div className="warn-card__head">
              <motion.span
                className="warn-card__badge"
                style={{ background: "var(--primary)", display: "inline-block" }}
                animate={{ scale: [1, 1.15, 1], boxShadow: ["0 0 0 rgba(28,113,128,0)", "0 0 20px rgba(28,113,128,0.6)", "0 0 0 rgba(28,113,128,0)"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <CheckIcon />
              </motion.span>
              {t("warning.goodTitle")}
            </div>
            <p className="warn-card__body">{t("warning.goodBody")}</p>
            <ul className="warn-card__list">
              {rightList.map((li, i) => (
                <li key={i}>{li}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}