import { useTranslation } from "react-i18next";
import { CheckIcon } from "./Icons";

export default function ProofSection() {
  const { t } = useTranslation();
  const items = t("proof.items", { returnObjects: true });

  return (
    <section className="section proof">
      <div className="container">
        <div className="proof__card anim-rise">
          <h2 className="sec-title">{t("proof.title")}</h2>
          <ul className="proof__list">
            {items.map((item, i) => (
              <li key={i} className="proof__item">
                <span className="proof__check">
                  <CheckIcon />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
