import { useTranslation } from "react-i18next";
import { CheckIcon } from "./Icons";
import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";

export default function WarningSection() {
  const { t } = useTranslation();
  const wrongList = t("warning.list", { returnObjects: true });
  const rightList = t("warning.goodList", { returnObjects: true });

  return (
    <section className="section" id="warning">
      <div className="container">
        <div className="section-head">
          <span className="sec-kicker">{t("warning.tag")}</span>
          <h2 className="sec-title">
            {t("warning.sectionTitle")}
          </h2>
        </div>

        <div className="warning">
          <motion.div
            className="warn-card warn-card--no"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="warn-card__head">
              <span className="warn-card__ico">
                <TriangleAlert size={22} />
              </span>
              {t("warning.title")}
            </div>
            <p className="warn-card__body">{t("warning.body")}</p>
            <ul className="warn-card__list">
              {wrongList.map((li, i) => (
                <li key={i}>{li}</li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="warn-card warn-card--yes"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="warn-card__head">
              <span className="warn-card__ico">
                <CheckIcon />
              </span>
              {t("warning.goodTitle")}
            </div>
            <p className="warn-card__body">{t("warning.goodBody")}</p>
            <ul className="warn-card__list">
              {rightList.map((li, i) => (
                <li key={i}>{li}</li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
