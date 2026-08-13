import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, UserRound, CreditCard, ClipboardList, Scale, Wallet, Inbox } from "lucide-react";
import { patientApi } from "../../api/client";
import { navigate } from "../../lib/router";
import StatusBadge from "../shared/StatusBadge";
import CarePrograms from "./CarePrograms";
import DoctorProgress from "./ProgressManager";

const patientStatusTone = (s) =>
  ({ active: "dash-badge--primary", pending_payment: "dash-badge--warning", inactive: "dash-badge--neutral", archived: "dash-badge--neutral" }[s] || "dash-badge--neutral");

// Phase 6D patient-context workspace: the doctor opens one patient and every
// clinical tool (care program, progress) is scoped to that person by patientId.
export default function PatientProfile({ patientId }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const load = async () => {
    setError("");
    try {
      setData(await patientApi.get(patientId));
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const back = () => navigate("/doctor/patients");

  if (error && !data) return (
    <section className="dash-panel">
      <div className="dash-page-head">
        <span className="dash-eyebrow"><UserRound />{t("patientProfile.title")}</span>
      </div>
      <p className="dash-form-error">{error}</p>
    </section>
  );
  if (!data) return <p className="dash-muted">{t("dashboard.common.loading")}</p>;

  const { patient, subscription, careProgram, plans, upcomingAppointments, progress, review, payments } = data;

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <UserRound />
          {t("patientProfile.title")}
        </span>
        <h2>{patient.fullName}</h2>
        <div className="dash-row-actions">
          <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={back}>
            <ArrowLeft />{t("patientProfile.back")}
          </button>
          <span className={`dash-badge ${patientStatusTone(patient.status)}`}>
            {patient.status === "pending_payment"
              ? t("doctorPatients.pendingPayment")
              : t(`dashboard.status.${patient.status}`, patient.status)}
          </span>
        </div>
      </div>

      <div className="dash-tabs" style={{ marginBlockEnd: "16px" }}>
        <button className={`dash-tab ${activeTab === "overview" ? "dash-tab--active" : ""}`} onClick={() => setActiveTab("overview")}>
          <UserRound />{t("patientProfile.tabOverview")}
        </button>
        <button className={`dash-tab ${activeTab === "care" ? "dash-tab--active" : ""}`} onClick={() => setActiveTab("care")}>
          <ClipboardList />{t("patientProfile.tabCare")}
        </button>
        <button className={`dash-tab ${activeTab === "progress" ? "dash-tab--active" : ""}`} onClick={() => setActiveTab("progress")}>
          <Scale />{t("patientProfile.tabProgress")}
        </button>
        <button className={`dash-tab ${activeTab === "payments" ? "dash-tab--active" : ""}`} onClick={() => setActiveTab("payments")}>
          <Wallet />{t("patientProfile.tabPayments")}
        </button>
      </div>

      {error && <p className="dash-form-error">{error}</p>}

      {activeTab === "overview" && (
        <>
          <div className="dash-split">
            <section className="dash-panel">
              <div className="dash-panel__head">
                <h3 className="dash-panel__title"><UserRound />{t("patientProfile.identity")}</h3>
              </div>
              <div className="dash-panel__body">
                <dl className="dash-def-list">
                  <div><dt>{t("patientProfile.name")}</dt><dd>{patient.fullName}</dd></div>
                  <div><dt>{t("patientProfile.age")}</dt><dd>{patient.ageYears != null ? `${patient.ageYears} ${t("patientProfile.yearUnit")}` : "—"}</dd></div>
                  <div><dt>{t("patientProfile.sex")}</dt><dd>{patient.sex ? t(`patientProfile.sexOptions.${patient.sex}`) : "—"}</dd></div>
                  <div><dt>{t("patientProfile.phone")}</dt><dd dir="ltr">{patient.phoneDisplay || "—"}</dd></div>
                  <div><dt>{t("patientProfile.email")}</dt><dd>{patient.email || "—"}</dd></div>
                  <div><dt>{t("patientProfile.review")}</dt><dd>{review ? <StatusBadge status={review.status} /> : <span className="dash-muted">{t("patientProfile.noReview")}</span>}</dd></div>
                </dl>
              </div>
            </section>

            <section className="dash-panel">
              <div className="dash-panel__head">
                <h3 className="dash-panel__title"><CreditCard />{t("patientProfile.subscription")}</h3>
              </div>
              <div className="dash-panel__body">
                {subscription ? (
                  <>
                    <div className="dash-stat__value" style={{ marginBlockEnd: "6px" }}>
                      {subscription.package?.name || "—"}
                    </div>
                    <p className="dash-muted">
                      {t("patientProfile.endsAt")}:{" "}
                      {subscription.endsAt ? new Date(subscription.endsAt).toLocaleDateString() : "∞"}
                    </p>
                    {subscription.entitlements.length ? (
                      <ul className="dash-list">
                        {subscription.entitlements.map((e, i) => (
                          <li key={i}>
                            <strong>{e.code}</strong>
                            <span className="dash-muted"> · {t("patientProfile.entitlementUsed", { used: e.used, limit: e.limit ?? "∞" })}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="dash-muted">{t("patientProfile.noEntitlements")}</p>
                    )}
                  </>
                ) : (
                  <p className="dash-muted">{t("patientProfile.noSubscription")}</p>
                )}
                {careProgram && (
                  <p className="dash-hint" style={{ marginTop: "10px" }}>
                    {t("patientProfile.careProgram")}: <strong>{careProgram.status}</strong>
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="dash-split">
            <section className="dash-panel">
              <div className="dash-panel__head">
                <h3 className="dash-panel__title"><ClipboardList />{t("patientProfile.plans")}</h3>
              </div>
              <div className="dash-panel__body">
                <ul className="dash-list">
                  <li><strong>{t("patientProfile.nutrition")}</strong> <span className="dash-muted">{plans?.nutrition ? plans.nutrition.status : t("patientProfile.none")}</span></li>
                  <li><strong>{t("patientProfile.exercise")}</strong> <span className="dash-muted">{plans?.exercise ? plans.exercise.status : t("patientProfile.none")}</span></li>
                </ul>
              </div>
            </section>

            <section className="dash-panel">
              <div className="dash-panel__head">
                <h3 className="dash-panel__title"><Scale />{t("patientProfile.measurements")}</h3>
              </div>
              <div className="dash-panel__body">
                {progress?.latest?.length ? (
                  <ul className="dash-list">
                    {progress.latest.map((m, i) => (
                      <li key={i}>
                        <strong>{m.type}</strong>{" "}
                        <span className="dash-muted">{m.value} {m.unit} · {m.measuredOn}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dash-muted">{t("patientProfile.noMeasurements")}</p>
                )}
              </div>
            </section>
          </div>

          <section className="dash-panel">
            <div className="dash-panel__head">
              <h3 className="dash-panel__title"><Wallet />{t("patientProfile.appointments")}</h3>
            </div>
            <div className="dash-panel__body">
              {upcomingAppointments?.length ? (
                <ul className="dash-list">
                  {upcomingAppointments.map((a) => (
                    <li key={a.id}>
                      <strong>{a.type}</strong>
                      <span className="dash-muted"> · {a.scheduledStartAt ? new Date(a.scheduledStartAt).toLocaleString() : "—"} · <StatusBadge status={a.status} /></span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="dash-empty"><Inbox /><p>{t("patientProfile.noAppointments")}</p></div>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === "care" && <CarePrograms patientId={patientId} />}
      {activeTab === "progress" && <DoctorProgress patientId={patientId} />}
      {activeTab === "payments" && (
        <section className="dash-panel">
          <div className="dash-panel__head">
            <h3 className="dash-panel__title"><Wallet />{t("patientProfile.payments")}</h3>
          </div>
          {payments?.length ? (
            <div className="dash-table-wrap dash-panel__body--flush">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{t("dashboard.payments.amount")}</th>
                    <th>{t("dashboard.payments.method")}</th>
                    <th>{t("dashboard.payments.status")}</th>
                    <th>{t("doctorPatients.created")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="dash-cell-main">{p.amount} {p.currency}</td>
                      <td className="dash-cell-muted">{p.method}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="dash-cell-muted">{p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty"><Inbox /><p>{t("dashboard.patient.noPayments")}</p></div>
          )}
        </section>
      )}
    </>
  );
}