import { useTranslation } from "react-i18next";
import { waUrl } from "../config";
import { WhatsAppIcon } from "./Icons";
import { motion } from "framer-motion";
import { Stethoscope, CalendarCheck2, Salad } from "lucide-react";

export default function CareSection() {
  const { t } = useTranslation();

  const cards = [
    { num: "01", icon: Stethoscope, title: t("care.guideTitle"), body: t("care.guideBody"), brand: false },
    { num: "02", icon: Salad, title: t("care.programsTitle"), body: t("care.programsBody"), brand: true },
    { num: "03", icon: CalendarCheck2, title: t("care.title"), body: t("care.body"), brand: false },
  ];

  return (
    <section className="section" style={{ background: "var(--bg-soft)" }}>
      <div className="container">
        <div className="section-head">
          <span className="sec-kicker">{t("care.kicker")}</span>
          <h2 className="sec-title">
            {t("care.title")} <span className="grad">{t("care.title2")}</span>
          </h2>
          <p className="sec-lead">{t("care.lead")}</p>
        </div>

        <div className="care">
          {cards.map(({ num, icon: Icon, title, body, brand }, i) => (
            <motion.div
              key={num}
              className={`care__card ${brand ? "care__card--brand" : ""}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <span className="care__card-num">{num}</span>
              <span className="care__card-ico">
                <Icon size={26} />
              </span>
              <h3 className="care__card-title">{title}</h3>
              <p className="care__card-body">{body}</p>
              {brand && (
                <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-accent">
                  <WhatsAppIcon />
                  {t("care.cta")}
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
