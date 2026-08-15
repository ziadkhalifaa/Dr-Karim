import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function Banner() {
  const { t } = useTranslation();

  const text = t("banner.text");
  const parts = text.split(" • ");
  const title = parts[0]?.replace(/\*\*/g, "") || "الاعتماد على وجبات متوازنة";
  const items = parts.slice(1).map((p) => p.replace(/\*\*/g, ""));

  const displayItems = items.length > 0 ? items : [
    "البروتين",
    "الكربوهيدرات",
    "الدهون الصحية",
    "الألياف",
    "تقليل السكريات المكررة",
    "نشاط بدني مناسب",
  ];

  return (
    <section className="section" style={{ paddingBlock: "72px" }}>
      <div className="container">
        <motion.div
          className="banner"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="banner__title">{title}</h3>
          <div className="banner__chips">
            {displayItems.map((item, i) => (
              <motion.span
                key={i}
                className="banner__chip"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 size={16} />
                {item}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
