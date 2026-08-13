import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, CheckCircle2, X, Upload } from "lucide-react";
import { paymentApi } from "../../api/client";
import StatusBadge from "../shared/StatusBadge";

function fileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PaymentCenter() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const [p, s, h] = await Promise.all([paymentApi.packages(), paymentApi.settings(), paymentApi.list()]);
    setPackages(p || []);
    setSettings(s);
    setPayments(h || []);
  };

  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const payment = await paymentApi.create({
        packageId: selected.id,
        method: form.get("method"),
        senderPhone: form.get("senderPhone"),
        transactionReference: form.get("transactionReference") || undefined,
      });
      const file = form.get("receipt");
      if (file?.size)
        await paymentApi.receipt(payment.id, {
          mimeType: file.type,
          originalName: file.name,
          data: await fileData(file),
        });
      setMessage(t("dashboard.patient.submittedAwaitingReview"));
      setSelected(null);
      await load();
      event.currentTarget.reset();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <Wallet />
          {t("dashboard.patient.packagesTitle")}
        </span>
        <h2>{t("dashboard.patient.packagesTitle")}</h2>
        <p>{t("dashboard.patient.packagesSubtitle")}</p>
      </div>

      {message && <p className="dash-form-msg">{message}</p>}

      <div className="dash-stat-grid">
        {packages.map((pkg) => (
          <section className="dash-panel" key={pkg.id}>
            <div className="dash-panel__body">
              <span className="dash-label">{pkg.name}</span>
              <div className="dash-stat__value" style={{ marginBlock: "10px" }}>
                {pkg.price} {pkg.currency}
              </div>
              {pkg.description && <p className="dash-muted">{pkg.description}</p>}
              <button type="button" className="dash-btn dash-btn--primary" onClick={() => setSelected(pkg)}>
                {t("dashboard.patient.choosePackage")}
              </button>
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <section className="dash-panel dash-panel--accent">
          <div className="dash-panel__head">
            <h3 className="dash-panel__title">
              <CheckCircle2 />
              {t("dashboard.patient.manualPayment")}: {selected.name} — {selected.price} {selected.currency}
            </h3>
            <button type="button" className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => setSelected(null)}>
              <X />
              {t("dashboard.patient.cancel")}
            </button>
          </div>
          <div className="dash-panel__body">
            <p className="dash-muted">
              Vodafone Cash:{" "}
              {settings?.vodafone_cash?.enabled
                ? settings.vodafone_cash.destination || t("dashboard.patient.destinationNotConfigured")
                : t("dashboard.patient.unavailable")}
            </p>
            <p className="dash-muted">
              InstaPay:{" "}
              {settings?.instapay?.enabled
                ? settings.instapay.destination || t("dashboard.patient.destinationNotConfigured")
                : t("dashboard.patient.unavailable")}
            </p>
            {settings?.instructions?.en && <p className="dash-hint">{settings.instructions.en}</p>}

            <form className="dash-form" onSubmit={submit}>
              <label className="dash-field">
                <span>{t("dashboard.patient.paymentMethod")}</span>
                <select className="dash-select" name="method" required>
                  <option value="vodafone_cash" disabled={!settings?.vodafone_cash?.enabled}>
                    Vodafone Cash
                  </option>
                  <option value="instapay" disabled={!settings?.instapay?.enabled}>
                    InstaPay
                  </option>
                </select>
              </label>
              <label className="dash-field">
                <span>{t("dashboard.patient.senderPhone")}</span>
                <input className="dash-input" name="senderPhone" required inputMode="tel" />
              </label>
              <label className="dash-field">
                <span>{t("dashboard.patient.transactionReference")}</span>
                <input className="dash-input" name="transactionReference" />
              </label>
              <label className="dash-field">
                <span>{t("dashboard.patient.receipt")}</span>
                <input
                  className="dash-input"
                  name="receipt"
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  required
                />
              </label>
              <button type="submit" className="dash-btn dash-btn--primary" disabled={busy}>
                <Upload />
                {busy ? t("dashboard.patient.submitting") : t("dashboard.patient.submitPayment")}
              </button>
            </form>
          </div>
        </section>
      )}

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <Wallet />
            {t("dashboard.patient.paymentHistory")}
          </h3>
          <span className="dash-badge dash-badge--neutral">
            {payments.length} {t("dashboard.patient.submissions")}
          </span>
        </div>
        {payments.length ? (
          <div className="dash-table-wrap dash-panel__body--flush">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t("dashboard.payments.package")}</th>
                  <th>{t("dashboard.payments.method")}</th>
                  <th>{t("dashboard.payments.amount")}</th>
                  <th>{t("dashboard.payments.status")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="dash-cell-main">{p.package?.name || `Payment #${p.id}`}</span>
                    </td>
                    <td className="dash-cell-muted">{p.method}</td>
                    <td className="dash-cell-main">
                      {p.amount} {p.currency}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dash-empty">
            <Wallet />
            <p>{t("dashboard.patient.noPayments")}</p>
          </div>
        )}
      </section>
    </>
  );
}
