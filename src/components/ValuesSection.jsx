import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartArt } from "./Artwork";
import { AccordionIcon } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";

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
  const [open, setOpen] = useState(0);
  const items = t("values.items", { returnObjects: true });

  return (
    <section className="section" style={{ paddingBlock: "60px" }}>
      <div className="container">
        <div className="values" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="values__head" style={{ marginBottom: "40px" }}>
              <h2 className="sec-title" style={{ fontSize: "40px", color: "var(--text)" }}>
                {t("values.title")} <strong style={{ color: "var(--primary)" }}>{t("values.title2")}</strong>
              </h2>
            </div>

            <div className="acc" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {items.map((item, i) => {
                const isOpen = open === i;
                return (
                  <motion.div
                    layout
                    key={i}
                    className={`acc__item ${isOpen ? "is-open" : ""}`}
                    style={{
                      background: isOpen ? "var(--tint)" : "var(--bg-soft)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid",
                      borderColor: isOpen ? "var(--primary-soft)" : "var(--line)",
                      overflow: "hidden",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <button
                      type="button"
                      className="acc__head"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "20px 24px",
                        background: "none",
                        border: "none",
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "var(--text)",
                        cursor: "pointer",
                        textAlign: "start"
                      }}
                    >
                      <span>{item.title}</span>
                      <motion.span 
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="acc__icon"
                        style={{
                          width: "44px", height: "44px", borderRadius: "50%", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          background: isOpen ? "var(--primary)" : "var(--highlight-bg)",
                          color: isOpen ? "var(--on-brand)" : "var(--highlight-text)",
                        }}
                      >
                        <AccordionIcon />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial="collapsed"
                          animate="open"
                          exit="collapsed"
                          variants={{
                            open: { opacity: 1, height: "auto", paddingBottom: "24px" },
                            collapsed: { opacity: 0, height: 0, paddingBottom: 0 }
                          }}
                          transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        >
                          <div className="acc__body" style={{ padding: "0 24px", fontSize: "17px", color: "var(--text-muted)", lineHeight: "1.8" }}>
                            <p>{renderHighlighted(item.body)}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: -50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, type: "spring" }}
            className="values__media"
            style={{
              position: "relative",
              background: "radial-gradient(circle at 20% 18%, rgba(242, 112, 89, 0.15), transparent 50%), var(--tint-2)",
              borderRadius: "var(--radius-xl)",
              padding: "40px",
              minHeight: "480px",
              display: "flex",
              alignItems: "flex-end",
              boxShadow: "var(--shadow)",
              border: "1px solid var(--line)",
              overflow: "hidden"
            }}
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              style={{ position: "absolute", top: "10%", right: "10%", zIndex: 1, width: "65%" }}
            >
              <ChartArt className="values__media--art" />
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ type: "spring" }}
              className="values__stat"
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                gap: "20px",
                background: "var(--bg)",
                borderRadius: "var(--radius-lg)",
                padding: "24px 32px",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--line)"
              }}
            >
              <b style={{ fontSize: "52px", fontWeight: "900", color: "var(--primary)", lineHeight: 1 }}>{t("values.stat")}</b>
              <span style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-muted)" }}>{t("values.statText")}</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}