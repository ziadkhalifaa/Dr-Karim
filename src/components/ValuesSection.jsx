import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartArt } from "./Artwork";
import { AccordionIcon } from "./Icons";

function renderHighlighted(text) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="bg-chip">
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
    <section className="section">
      <div className="container">
        <div className="values">
          <div>
            <div className="values__head">
              <h2 className="sec-title">
                {t("values.title")} <strong>{t("values.title2")}</strong>
              </h2>
            </div>

            <div className="acc">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`acc__item ${open === i ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="acc__head"
                    aria-expanded={open === i}
                    onClick={() => setOpen(open === i ? -1 : i)}
                  >
                    <span>{item.title}</span>
                    <span className="acc__icon">
                      <AccordionIcon />
                    </span>
                  </button>
                  {open === i && (
                    <div className="acc__body">
                      <p>{renderHighlighted(item.body)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="values__media anim-slideR">
            <ChartArt className="values__media--art" />
            <div className="values__stat">
              <b>{t("values.stat")}</b>
              <span>{t("values.statText")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}