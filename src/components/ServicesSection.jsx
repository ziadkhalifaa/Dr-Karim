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

  return (
    <section className="section" id="services">
      <div className="container">
        <div className="services__head anim-rise">
          <h2 className="sec-title">
            {t("services.title")} <strong>{t("services.title2")}</strong>
          </h2>
        </div>

        {groups.map((group, gi) => {
          const isHero = gi === 0;

          if (isHero) {
            const Icon = ICONS[iconIndex++ % ICONS.length];
            return (
              <div className="services__group" key={gi}>
                <article className="service-hero anim-rise">
                  <span className="service-hero__badge">{group.title}</span>
                  <span className="service-hero__icon">
                    <Icon />
                  </span>
                  <div className="service-hero__content">
                    <h4 className="service-hero__title">{group.items[0].title}</h4>
                    <p className="service-hero__body">{group.items[0].body}</p>
                  </div>
                </article>
              </div>
            );
          }

          return (
            <div className="services__group" key={gi}>
              <h3 className="services__group-title anim-rise">{group.title}</h3>
              <div className="services__grid">
                {group.items.map((item, i) => {
                  const Icon = ICONS[iconIndex++ % ICONS.length];
                  return (
                    <article key={i} className="service-card anim-rise">
                      <span className="service-card__icon">
                        <Icon />
                      </span>
                      <h4 className="service-card__title">{item.title}</h4>
                      <p className="service-card__body">{item.body}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="services__cta">
          <a href="#assessment" className="btn btn-primary">
            <PulseIcon />
            {t("services.cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
