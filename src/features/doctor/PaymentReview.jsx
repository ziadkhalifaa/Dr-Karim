import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { paymentApi } from "../../api/client";
import StatusBadge from "../shared/StatusBadge";

export default function PaymentReview() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    setRows((await paymentApi.doctorList()) || []);
  };

  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);

  const review = async (row, decision) => {
    let reason = "";
    if (decision === "reject") {
      reason = window.prompt(t("dashboard.payments.rejectReason")) || "";
      if (!reason.trim()) return;
    }
    try {
      await (decision === "approve" ? paymentApi.approve(row.id) : paymentApi.reject(row.id, reason));
      await load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <Wallet />
          {t("dashboard.payments.title")}
        </span>
        <h2>{t("dashboard.payments.title")}</h2>
        <p>{t("dashboard.payments.subtitle")}</p>
      </div>

      {message && <p className="dash-form-error">{message}</p>}

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <Wallet />
            {t("dashboard.payments.title")}
          </h3>
          <span className="dash-badge dash-badge--info">{rows.length}</span>
        </div>

        {rows.length ? (
          <div className="dash-table-wrap dash-panel__body--flush">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t("dashboard.payments.patient")}</th>
                  <th>{t("dashboard.payments.package")}</th>
                  <th>{t("dashboard.payments.amount")}</th>
                  <th>{t("dashboard.payments.method")}</th>
                  <th>{t("dashboard.payments.reference")}</th>
                  <th>{t("dashboard.payments.submitted")}</th>
                  <th>{t("dashboard.payments.status")}</th>
                  <th>{t("dashboard.payments.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="dash-cell-main">
                        {p.patient?.full_name || p.patientName || p.patient_id}
                      </span>
                    </td>
                    <td className="dash-cell-muted">{p.package?.name || p.package_id}</td>
                    <td className="dash-cell-main">
                      {p.amount} {p.currency}
                    </td>
                    <td className="dash-cell-muted">{p.method}</td>
                    <td className="dash-cell-muted">{p.transaction_reference || "—"}</td>
                    <td className="dash-cell-muted">
                      {p.submitted_at ? new Date(p.submitted_at).toLocaleString() : "—"}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      {p.status === "pending" && (
                        <div className="dash-row-actions">
                          <button
                            type="button"
                            className="dash-btn dash-btn--primary dash-btn--sm"
                            onClick={() => review(p, "approve")}
                          >
                            <CheckCircle2 />
                            {t("dashboard.payments.approve")}
                          </button>
                          <button
                            type="button"
                            className="dash-btn dash-btn--danger dash-btn--sm"
                            onClick={() => review(p, "reject")}
                          >
                            <XCircle />
                            {t("dashboard.payments.reject")}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dash-empty">
            <Inbox />
            <p>{t("dashboard.payments.empty")}</p>
          </div>
        )}
      </section>
    </>
  );
}
