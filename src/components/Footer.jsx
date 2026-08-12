import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CLINIC, mapsDirectionsUrl, waUrl } from "../config";
import {
  FacebookIcon,
  YoutubeIcon,
  TikTokIcon,
  PhoneIcon,
  MailIcon,
  PinIcon,
  SendIcon,
  WhatsAppIcon,
} from "./Icons";

const LINKS = ["home", "about", "services", "articles", "contact"];

function SocialButtons() {
  return (
    <div className="social-row">
      <a
        className="social-btn"
        href={CLINIC.social.facebook}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
      >
        <FacebookIcon />
      </a>
      <a
        className="social-btn"
        href={CLINIC.social.youtube}
        target="_blank"
        rel="noreferrer"
        aria-label="YouTube"
      >
        <YoutubeIcon />
      </a>
      <a
        className="social-btn"
        href={CLINIC.social.tiktok}
        target="_blank"
        rel="noreferrer"
        aria-label="TikTok"
      >
        <TikTokIcon />
      </a>
    </div>
  );
}

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  };

  return (
    <footer className="site-footer" id="contact">
      <div className="container">
        <div className="footer-top">
          <div className="footer-cta">
            <h2>
              {t("footer.cta1")} <span className="bg-chip">{t("footer.ctaHighlight")}</span>
              <br />
              {t("footer.cta2")}
            </h2>
          </div>

          <div className="footer-col">
            <h3>{t("footer.linksTitle")}</h3>
            <ul className="footer-links">
              {LINKS.map((key) => (
                <li key={key}>
                  <a href={`#${key === "home" ? "home" : key}`}>
                    {t(`nav.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3>{t("footer.keepTitle")}</h3>
            <p className="newsletter__sub">{t("footer.keepBody")}</p>
            {done ? (
              <p className="newsletter__thanks">{t("footer.thanks")}</p>
            ) : (
              <form onSubmit={submit}>
                <input
                  className="newsletter__input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("footer.emailPlaceholder")}
                />
                <button type="submit" className="btn btn-accent" style={{ width: "100%" }}>
                  <SendIcon />
                  {t("footer.subscribe")}
                </button>
              </form>
            )}

            <div className="contact-block">
              <div className="contact-line">
                <PhoneIcon />
                <span>{CLINIC.phones.join("  •  ")}</span>
              </div>
              <div className="contact-line">
                <MailIcon />
                <span>{CLINIC.email}</span>
              </div>
              <div className="contact-line">
                <PinIcon />
                <span>{t("footer.address")}</span>
              </div>
              <div className="contact-actions">
                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                >
                  <PinIcon />
                  {t("footer.directions")}
                </a>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-accent"
                >
                  <WhatsAppIcon />
                  {t("footer.whatsapp")}
                </a>
              </div>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <div className="footer-copy">{t("footer.copyright")}</div>
          <SocialButtons />
        </div>
      </div>
    </footer>
  );
}