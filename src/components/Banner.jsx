import { useTranslation } from "react-i18next";

export default function Banner() {
  const { t } = useTranslation();

  const parts = t("banner.text").split("**");
  return (
    <section className="section">
      <div className="container">
        <div className="banner anim-rise">
          <p className="banner__text">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i}>{part}</strong>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        </div>
      </div>
    </section>
  );
}