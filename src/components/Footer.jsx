import { useTranslation } from "react-i18next";
import { mapsDirectionsUrl, waUrl, CLINIC } from "../config";
import { usePublicSettings } from "../hooks/usePublicSettings";
import {
  FacebookIcon,
  YoutubeIcon,
  TikTokIcon,
  PhoneIcon,
  MailIcon,
  PinIcon,
  WhatsAppIcon,
} from "./Icons";
import { motion } from "framer-motion";
import { navigate } from "../lib/router";

const LINKS = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "articles", href: "/articles" },
  { key: "contact", href: "/contact" },
];

const LEGAL = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "faq", href: "/faq" },
];

function SocialButtons({ social }) {
  const items = [
    { key: "facebook", href: social?.facebook, Icon: FacebookIcon, label: "Facebook" },
    { key: "youtube", href: social?.youtube, Icon: YoutubeIcon, label: "YouTube" },
    { key: "tiktok", href: social?.tiktok, Icon: TikTokIcon, label: "TikTok" },
  ].filter((i) => i.href);

  return (
    <div className="footer-social">
      {items.map(({ href, Icon, label }) => (
        <motion.a
          key={label}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.95 }}
          className="footer-social__btn"
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
        >
          <Icon />
        </motion.a>
      ))}
    </div>
  );
}

export default function Footer() {
  const { t } = useTranslation();
  const { settings } = usePublicSettings();

  const clinic = settings?.clinic || {};

  return (
    <footer className="site-footer" id="contact">
      <div className="container">
        <div className="footer-top">
          <motion.div
            className="footer-brand"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="footer-brand__logo">
              <img src="/assets/logo.png" alt={t("brand.name")} />
              <div>
                <b>{t("brand.name")}</b>
                <span>{t("brand.title")}</span>
              </div>
            </div>
            <p className="footer-brand__text">{t("footer.about")}</p>
            <SocialButtons social={settings?.social} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="footer-col__title">{t("footer.linksTitle")}</h3>
            <div className="footer-links">
              {LINKS.map(({ key, href }) => (
                <a
                  key={key}
                  href={href}
                  onClick={(e) => { e.preventDefault(); navigate(href); }}
                >
                  {t(`nav.${key}`)}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="footer-col__title">{t("footer.contactTitle")}</h3>
            <div className="footer-contact">
              <div className="footer-contact__item">
                <PhoneIcon />
                <span>{clinic?.phone || CLINIC.phones[0]}</span>
              </div>
              <div className="footer-contact__item">
                <MailIcon />
                <span>{clinic?.email || CLINIC.email}</span>
              </div>
              <div className="footer-contact__item">
                <PinIcon />
                <span>{t("footer.address")}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                <motion.a
                  whileHover={{ y: -2 }}
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-contact__btn"
                >
                  <PinIcon />
                  {t("footer.directions")}
                </motion.a>
                <motion.a
                  whileHover={{ y: -2 }}
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-contact__btn footer-contact__btn--gold"
                >
                  <WhatsAppIcon />
                  {t("footer.whatsapp")}
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copy">{t("footer.copyright")}</p>
          <div className="footer-legal">
            {LEGAL.map(({ key, href }) => (
              <a
                key={key}
                href={href}
                onClick={(e) => { e.preventDefault(); navigate(href); }}
              >
                {t(`footer.${key}`)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
