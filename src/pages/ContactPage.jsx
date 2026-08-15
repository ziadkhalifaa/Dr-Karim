import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin, Send, Check } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { WhatsAppIcon } from "../components/Icons";
import { publicApi } from "../api/client";
import { usePublicSettings } from "../hooks/usePublicSettings";
import { mapsDirectionsUrl, waUrl } from "../config";

export default function ContactPage() {
  const { t } = useTranslation();
  const { settings } = usePublicSettings();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      setErrorMsg(t("contact.errors.required"));
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await publicApi.contact({ name: form.name, email: form.email, message: form.message });
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err?.message || t("contact.errors.generic"));
    }
  };

  const clinic = settings?.clinic || {};

  const contactItems = [
    { icon: Phone, label: t("contact.items.phone"), value: clinic?.phone || t("contact.placeholder.phone"), href: `tel:${clinic?.phone || ""}` },
    { icon: Mail, label: t("contact.items.email"), value: clinic?.email || t("contact.placeholder.email"), href: `mailto:${clinic?.email || ""}` },
    { icon: MapPin, label: t("contact.items.address"), value: t("footer.address"), href: mapsDirectionsUrl },
  ];

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="page-hero__mesh" aria-hidden="true" />
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="page-hero__kicker">{t("contact.kicker")}</span>
              <h1 className="page-hero__title">
                {t("contact.title")} <span className="gold">{t("contact.title2")}</span>
              </h1>
              <p className="page-hero__lead">{t("contact.lead")}</p>
            </motion.div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="contact-grid">
              <motion.div
                className="contact-info"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="contact-info__title">{t("contact.infoTitle")}</h3>
                <p className="contact-info__lead">{t("contact.infoLead")}</p>

                <div className="contact-info__list">
                  {contactItems.map((item, i) => (
                    <a
                      key={i}
                      href={item.href}
                      target={item.label === t("contact.items.address") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="contact-info__item"
                    >
                      <span className="contact-info__ico">
                        <item.icon size={20} />
                      </span>
                      <span>
                        <small>{item.label}</small>
                        {item.value}
                      </span>
                    </a>
                  ))}
                </div>

                <div className="contact-info__actions">
                  <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-accent">
                    <WhatsAppIcon />
                    {t("contact.whatsapp")}
                  </a>
                  <a href={mapsDirectionsUrl} target="_blank" rel="noreferrer" className="btn btn-outline">
                    <MapPin size={18} />
                    {t("contact.map")}
                  </a>
                </div>
              </motion.div>

              <motion.div
                className="contact-form"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h3 className="contact-form__title">{t("contact.formTitle")}</h3>
                <p className="contact-form__lead">{t("contact.formLead")}</p>

                <AnimatePresence mode="wait">
                  {status === "success" ? (
                    <motion.div
                      key="success"
                      className="contact-form__success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <span className="contact-form__success-ico">
                        <Check size={38} />
                      </span>
                      <h4>{t("contact.successTitle")}</h4>
                      <p>{t("contact.successBody")}</p>
                      <button type="button" className="btn btn-primary" onClick={() => setStatus("idle")}>
                        {t("contact.sendAnother")}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={handleSubmit}>
                      {status === "error" && errorMsg && (
                        <div className="contact-form__error">{errorMsg}</div>
                      )}

                      <div className="contact-form__field">
                        <label className="contact-form__label" htmlFor="c-name">
                          {t("contact.name")} *
                        </label>
                        <input
                          id="c-name"
                          name="name"
                          type="text"
                          className="contact-form__input"
                          placeholder={t("contact.namePlaceholder")}
                          value={form.name}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="contact-form__field">
                        <label className="contact-form__label" htmlFor="c-email">
                          {t("contact.email")}
                        </label>
                        <input
                          id="c-email"
                          name="email"
                          type="email"
                          className="contact-form__input"
                          placeholder="example@email.com"
                          value={form.email}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="contact-form__field">
                        <label className="contact-form__label" htmlFor="c-message">
                          {t("contact.message")} *
                        </label>
                        <textarea
                          id="c-message"
                          name="message"
                          className="contact-form__textarea"
                          placeholder={t("contact.messagePlaceholder")}
                          value={form.message}
                          onChange={handleChange}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="btn btn-primary btn-block"
                        style={{ padding: "18px 30px" }}
                      >
                        {status === "loading" ? (
                          <>
                            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 3 }} />
                            {t("contact.sending")}
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            {t("contact.send")}
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
