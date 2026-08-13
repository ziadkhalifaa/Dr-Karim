import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { patientApi } from "../../api/client";
import { navigate } from "../../lib/router";

const statusTone = (s) =>
  ({ active: "dash-badge--primary", pending_payment: "dash-badge--warning", inactive: "dash-badge--neutral", archived: "dash-badge--neutral" }[s] || "dash-badge--neutral");

export default function PatientsList() {
  const { t } = useTranslation();
  const [data, setData] = useState({ items: [], pagination: { total: 0, page: 1, limit: 25, pages: 1 } });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setBusy(true);
    setError("");
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("limit", "25");
    params.set("page", String(page));
    params.set("sort", sort);
    if (status) params.set("status", status);
    try {
      setData(await patientApi.list(`?${params.toString()}`));
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort, page]);

  const search = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const { items, pagination } = data;
  const last = pagination.pages || 1;

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <Users />
          {t("doctorPatients.title")}
        </span>
        <h2>{t("doctorPatients.title")}</h2>
        <p>{t("doctorPatients.subtitle")}</p>
      </div>

      {error && <p className="dash-form-error">{error}</p>}

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <Users />
            {t("doctorPatients.directory")}
          </h3>
          <span className="dash-badge dash-badge--primary">{pagination.total}</span>
        </div>

        <div className="dash-form--grid dash-patients-filters" style={{ padding: "16px" }}>
          <form className="dash-field" onSubmit={search}>
            <span>{t("doctorPatients.search")}</span>
            <div className="dash-patient-selector__control">
              <Search size={16} className="dash-muted-icon" />
              <input className="dash-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("doctorPatients.searchPlaceholder")} autoComplete="off" />
            </div>
          </form>
          <label className="dash-field">
            <span>{t("doctorPatients.status")}</span>
            <select className="dash-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">{t("doctorPatients.allStatuses")}</option>
              <option value="active">{t("dashboard.status.active")}</option>
              <option value="pending_payment">{t("doctorPatients.pendingPayment")}</option>
              <option value="inactive">{t("doctorPatients.inactive")}</option>
              <option value="archived">{t("doctorPatients.archived")}</option>
            </select>
          </label>
          <label className="dash-field">
            <span>{t("doctorPatients.sort")}</span>
            <select className="dash-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
              <option value="recent">{t("doctorPatients.sortRecent")}</option>
              <option value="name">{t("doctorPatients.sortName")}</option>
              <option value="oldest">{t("doctorPatients.sortOldest")}</option>
            </select>
          </label>
        </div>

        {items.length ? (
          <div className="dash-table-wrap dash-panel__body--flush">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t("doctorPatients.patient")}</th>
                  <th>{t("doctorPatients.status")}</th>
                  <th>{t("doctorPatients.subscription")}</th>
                  <th>{t("doctorPatients.created")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="dash-cell-main">{p.fullName}</span>
                      {p.phoneDisplay && <span className="dash-cell-sub" dir="ltr">{p.phoneDisplay}</span>}
                      {p.hasPendingPayment && (
                        <span className="dash-badge dash-badge--warning" style={{ marginInlineStart: "8px" }}>
                          {t("doctorPatients.pendingPayment")}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`dash-badge ${statusTone(p.status)}`}>
                        {p.status === "pending_payment" ? t("doctorPatients.pendingPayment") : t(`dashboard.status.${p.status}`, p.status)}
                      </span>
                    </td>
                    <td className="dash-cell-muted">
                      {p.subscriptionStatus === "active"
                        ? t("doctorPatients.subscriptionActive")
                        : t("doctorPatients.noSubscription")}
                    </td>
                    <td className="dash-cell-muted">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <div className="dash-row-actions">
                        <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => navigate(`/doctor/patients/${p.id}`)}>
                          {t("doctorPatients.openProfile")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dash-empty">
            <Inbox />
            <p>{busy ? t("dashboard.common.loading") : t("doctorPatients.empty")}</p>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="dash-pagination">
            <button className="dash-btn dash-btn--ghost dash-btn--sm" disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); }}>
              <ChevronLeft />{t("doctorPatients.prev")}
            </button>
            <span className="dash-muted">{t("doctorPatients.pageOf", { page, total: last })}</span>
            <button className="dash-btn dash-btn--ghost dash-btn--sm" disabled={page >= last} onClick={() => { setPage((p) => Math.min(last, p + 1)); }}>
              {t("doctorPatients.next")}<ChevronRight />
            </button>
          </div>
        )}
      </section>
    </>
  );
}