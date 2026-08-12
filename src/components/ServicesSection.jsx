import { useTranslation } from "react-i18next";
import {
  LeafIcon,
  ScaleIcon,
  GrowthIcon,
  DropletIcon,
  ShieldIcon,
  HeartIcon,
  PulseIcon,
} from "./Icons";
import { motion } from "framer-motion";
import { navigate } from "../lib/router";

const ICONS = [
  LeafIcon,
  ScaleIcon,
  GrowthIcon,
  DropletIcon,
  ShieldIcon,
  HeartIcon,
];

export default function ServicesSection() {
  const { t } = useTranslation();
  const groups = t("services.groups", { returnObjects: true });
  let iconIndex = 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } }
  };

  const goAssessment = (e) => {
    e.preventDefault();
    navigate("/assessment");
  };

  return (
    <section className="section" id="services" style={{ paddingBlock: "80px 40px" }}>
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="services__head"
          style={{ textAlign: "center", marginBottom: "60px" }}
        >
          <h2 className="sec-title" style={{ fontSize: "44px", color: "var(--text)" }}>
            {t("services.title")} <strong style={{ color: "var(--primary)" }}>{t("services.title2")}</strong>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "18px", maxWidth: "600px", margin: "16px auto 0" }}>
            حلول غذائية شاملة ومخصصة لمساعدتك في الوصول إلى هدفك بأفضل طريقة صحية ومستدامة.
          </p>
        </motion.div>

        {groups.map((group, gi) => {
          const isHero = gi === 0;

          if (isHero) {
            const Icon = ICONS[iconIndex++ % ICONS.length];
            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="services__group" 
                key={gi}
                style={{ marginBottom: "60px" }}
              >
                <article className="service-hero" style={{ 
                  background: "linear-gradient(135deg, var(--surface-brand) 0%, var(--deep) 100%)",
                  boxShadow: "var(--shadow-lg)",
                  borderRadius: "var(--radius-xl)"
                }}>
                  <span className="service-hero__badge">{group.title}</span>
                  <motion.span 
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="service-hero__icon"
                  >
                    <Icon />
                  </motion.span>
                  <div className="service-hero__content">
                    <h4 className="service-hero__title">{group.items[0].title}</h4>
                    <p className="service-hero__body">{group.items[0].body}</p>
                  </div>
                </article>
              </motion.div>
            );
          }

          return (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="services__group" 
              key={gi}
            >
              <h3 className="services__group-title">{group.title}</h3>
              <div className="services__grid">
                {group.items.map((item, i) => {
                  const Icon = ICONS[iconIndex++ % ICONS.length];
                  return (
                    <motion.article 
                      variants={cardVariants}
                      whileHover={{ 
                        y: -8, 
                        boxShadow: "0 20px 40px rgba(18, 59, 74, 0.12)",
                        borderColor: "var(--primary-soft)"
                      }}
                      key={i} 
                      className="service-card"
                      style={{ 
                        background: "var(--card-bg)",
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--line)",
                        transition: "border-color 0.3s ease"
                      }}
                    >
                      <motion.span 
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.4 }}
                        className="service-card__icon"
                        style={{ background: "var(--highlight-bg)", color: "var(--highlight-text)" }}
                      >
                        <Icon />
                      </motion.span>
                      <h4 className="service-card__title" style={{ fontSize: "22px" }}>{item.title}</h4>
                      <p className="service-card__body" style={{ fontSize: "16px", lineHeight: "1.6" }}>{item.body}</p>
                    </motion.article>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="services__cta"
          style={{ marginTop: "60px", textAlign: "center" }}
        >
          <motion.a 
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(18,59,74,0.3)" }}
            whileTap={{ scale: 0.95 }}
            href="/assessment" 
            onClick={goAssessment}
            className="btn btn-primary"
            style={{ borderRadius: "16px", padding: "18px 36px", fontSize: "18px" }}
          >
            <PulseIcon />
            {t("services.cta")}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
