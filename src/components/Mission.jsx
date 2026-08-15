import { useTranslation } from "react-i18next";
import { waUrl } from "../config";
import { WhatsAppIcon } from "./Icons";
import { motion } from "framer-motion";
import { HeartPulse, UserCheck, Sparkles } from "lucide-react";

const POINTS = [
  { key: "points.1", icon: HeartPulse },
  { key: "points.2", icon: UserCheck },
  { key: "points.3", icon: Sparkles },
];

export default function Mission() {
  const { t } = useTranslation();

  return (
    <section className="section" id="about">
      <div className="container">
        <div className="mission">
          <motion.div
            className="mission__media"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.35 }}
          >
            <img src="/assets/drkarim.png" alt={t("brand.name")} />
            <div className="mission__media-badge">
              <b>
                {t("mission.years")} {t("mission.yearsNum")} {t("mission.yearsUnit")}
              </b>
              <span>{t("mission.yearsText")}</span>
            </div>
          </motion.div>

          <motion.div
            className="mission__content"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <span className="sec-kicker">{t("brand.coach")}</span>
            <h2 className="sec-title">
              {t("mission.title")} <span className="grad">{t("mission.title2")}</span>
            </h2>
            <p className="sec-lead">{t("mission.body")}</p>

            <div className="mission__points">
              {POINTS.map(({ key, icon: Icon }) => (
                <div className="mission__point" key={key}>
                  <span className="mission__point-ico">
                    <Icon size={20} />
                  </span>
                  <div>
                    <b>{t(`mission.${key}`)}</b>
                    <p>{t(`mission.${key}Body`)}</p>
                  </div>
                </div>
              ))}
            </div>

            <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              <WhatsAppIcon />
              {t("mission.cta")}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
