import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  "/assets/slider_1.png",
  "/assets/slider_2.png",
  "/assets/slider_3.png",
  "/assets/special_programs.png",
  "/assets/salad_plate.png"
];

function renderHighlighted(text) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="bg-chip" style={{ display: "inline-block", padding: "2px 8px", background: "var(--highlight-bg)", color: "var(--highlight-text)", borderRadius: "8px", fontWeight: "800", margin: "0 4px" }}>
        {part}
      </span>
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
    <section className="section values-section" style={{ paddingBlock: "80px", background: "var(--bg-soft)", overflow: "hidden" }}>
      <div className="container">
        <div className="values__head" style={{ marginBottom: "60px", textAlign: "center" }}>
          <span style={{ display: "inline-block", background: "var(--highlight-bg)", color: "var(--primary-deep)", padding: "8px 16px", borderRadius: "100px", fontSize: "15px", fontWeight: "800", marginBottom: "16px" }}>
            لماذا نحن؟
          </span>
          <h2 className="sec-title" style={{ fontSize: "clamp(32px, 5vw, 46px)", color: "var(--text)" }}>
            {t("values.title")} <strong style={{ color: "var(--primary)" }}>{t("values.title2")}</strong>
          </h2>
        </div>

        <div className="values-slider" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px", alignItems: "center" }}>
          <style>
            {`
              @media (min-width: 992px) {
                .values-slider { grid-template-columns: 1fr 1fr !important; gap: 60px !important; }
              }
              .slider-nav-btn {
                background: rgba(255,255,255,0.5);
                border: 1.5px solid transparent;
                color: var(--text);
                padding: 16px 24px;
                border-radius: 16px;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                text-align: start;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 16px;
              }
              .slider-nav-btn:hover {
                background: rgba(255,255,255,0.8);
                border-color: rgba(5, 150, 105, 0.2);
              }
              .slider-nav-btn.is-active {
                background: linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%);
                border-color: transparent;
                color: var(--on-brand);
                transform: scale(1.02);
                box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);
              }
            `}
          </style>

          {/* Left Side: Images */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              position: "relative",
              aspectRatio: "1/1",
              borderRadius: "var(--radius-xl)",
              background: "var(--tint-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--line)",
              overflow: "hidden"
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={active}
                src={images[active]}
                alt={items[active].title}
                initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.2, rotateY: -90 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                style={{ width: "80%", height: "80%", objectFit: "contain", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.2))" }}
              />
            </AnimatePresence>
          </motion.div>

          {/* Right Side: Text & Navigation */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {/* Active Content Display */}
            <div style={{ minHeight: "160px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 style={{ fontSize: "36px", color: "var(--primary-deep)", marginBottom: "16px", fontWeight: "900" }}>
                    {items[active].title}
                  </h3>
                  <p style={{ fontSize: "18px", color: "var(--text-muted)", lineHeight: "1.9", fontWeight: 500 }}>
                    {renderHighlighted(items[active].body)}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slider Navigation */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {items.map((item, i) => (
                <button
                  key={i}
                  className={`slider-nav-btn ${active === i ? "is-active" : ""}`}
                  onClick={() => setActive(i)}
                >
                  <span>{item.title}</span>
                  {active === i && (
                    <motion.div layoutId="indicator" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)" }} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}