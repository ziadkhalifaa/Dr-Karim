import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Package, CreditCard, Save } from "lucide-react";
import { adminApi } from "../../api/client";

export default function AdminConfiguration() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState({ vodafone_cash: {}, instapay: {}, instructions: {} });
  const [message, setMessage] = useState("");

  const load = async () => {
    const [p, s] = await Promise.all([adminApi.packages(), adminApi.settings()]);
    setPackages(p || []);
    setSettings(s || {});
  };

  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);

  const savePackage = async (pkg, event) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    try {
      await adminApi.updatePackage(pkg.id, {
        price: f.get("price"),
        active: f.get("active") === "on",
      });
      setMessage(t("dashboard.config.saved"));
      await load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await adminApi.updateSettings({
        vodafoneCash: { enabled: f.get("vfEnabled") === "on", destination: f.get("vfDestination") },
        instapay: { enabled: f.get("ipEnabled") === "on", destination: f.get("ipDestination") },
        instructions: { en: f.get("en"), ar: f.get("ar") },
      });
      setMessage(t("dashboard.config.saved"));
      await load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <Settings />
          {t("dashboard.config.title")}
        </span>
        <h2>{t("dashboard.config.title")}</h2>
        <p>{t("dashboard.config.subtitle")}</p>
      </div>

      {message && <p className="dash-form-msg">{message}</p>}

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <Package />
            {t("dashboard.config.packages")}
          </h3>
        </div>
        <div className="dash-panel__body">
          {packages.map((pkg) => (
            <form
              className="dash-form dash-form--grid dash-form--bordered"
              key={pkg.id}
              onSubmit={(e) => savePackage(pkg, e)}
            >
              <div className="dash-field">
                <span className="dash-label">{pkg.name}</span>
                {pkg.description && <small className="dash-muted">{pkg.description}</small>}
              </div>
              <label className="dash-field">
                <span>{t("dashboard.config.price")}</span>
                <input
                  className="dash-input"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={pkg.price}
                  required
                />
              </label>
              <label className="dash-check">
                <input name="active" type="checkbox" defaultChecked={Boolean(pkg.active)} />
                {t("dashboard.config.active")}
              </label>
              <button type="submit" className="dash-btn dash-btn--primary">
                <Save />
                {t("dashboard.config.save")}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <CreditCard />
            {t("dashboard.config.paymentSettings")}
          </h3>
        </div>
        <form className="dash-form dash-panel__body" onSubmit={saveSettings}>
          <div className="dash-form--grid">
            <label className="dash-field">
              <span>{t("dashboard.config.vodafone")}</span>
              <input
                className="dash-input"
                name="vfDestination"
                defaultValue={settings.vodafone_cash?.destination || ""}
              />
            </label>
            <label className="dash-check">
              <input name="vfEnabled" type="checkbox" defaultChecked={Boolean(settings.vodafone_cash?.enabled)} />
              {t("dashboard.config.active")}
            </label>
            <label className="dash-field">
              <span>{t("dashboard.config.instapay")}</span>
              <input
                className="dash-input"
                name="ipDestination"
                defaultValue={settings.instapay?.destination || ""}
              />
            </label>
            <label className="dash-check">
              <input name="ipEnabled" type="checkbox" defaultChecked={Boolean(settings.instapay?.enabled)} />
              {t("dashboard.config.active")}
            </label>
          </div>
          <label className="dash-field">
            <span>{t("dashboard.config.instructionsEn")}</span>
            <textarea className="dash-textarea" name="en" rows="3" defaultValue={settings.instructions?.en || ""} />
          </label>
          <label className="dash-field">
            <span>{t("dashboard.config.instructionsAr")}</span>
            <textarea className="dash-textarea" name="ar" rows="3" defaultValue={settings.instructions?.ar || ""} />
          </label>
          <button type="submit" className="dash-btn dash-btn--primary">
            <Save />
            {t("dashboard.config.save")}
          </button>
        </form>
      </section>
    </>
  );
}
