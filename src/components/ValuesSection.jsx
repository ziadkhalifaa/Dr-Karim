import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpLeft } from "lucide-react";

const images = [
  "/assets/slider_1.png",
  "/assets/slider_2.png",
  "/assets/slider_3.png",
  "/assets/special_programs.png",
  "/assets/salad_plate.png",
];

function renderHighlighted(text) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ color: "var(--secondary-deep)", fontWeight: 900 }}>
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ValuesSection() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const items = t("values.items", { returnObjects: true });

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <section className="section section--tint" style={{ overflow: "hidden" }}>
      <div className="container">
        <div className="section-head">
          <span className="sec-kicker">{t("values.kicker")}</span>
          <h2 className="sec-title">
            {t("values.title")} <span className="grad">{t("values.title2")}</span>
          </h2>
          <p className="sec-lead">{t("values.lead")}</p>
        </div>

        <div className="values">
          <motion.div
            className="values__visual"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={active}
                src={images[active]}
                alt={items[active].title}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            </AnimatePresence>
          </motion.div>

          <div>
            {items.map((item, i) => (
              <motion.button
                key={item.title}
                className={`values__tab ${active === i ? "is-active" : ""}`}
                onClick={() => setActive(i)}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
              >
                <span className="values__tab-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="values__tab-body">
                  <b>{item.title}</b>
                  <p>{renderHighlighted(item.body)}</p>
                </span>
                <ArrowUpLeft className="values__tab-arrow" size={18} />
              </motion.button>
            ))}

            <div
              style={{
                marginTop: 26,
                padding: "22px 24px",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, var(--surface-brand), var(--surface-brand-2))",
                color: "var(--on-brand)",
                display: "flex",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <b style={{ fontSize: 40, fontWeight: 900, color: "var(--secondary-soft)", fontFamily: "var(--font-latin)" }}>
                {t("values.stat")}
              </b>
              <p style={{ fontWeight: 800, flex: 1, fontSize: 15 }}>{t("values.statText")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
