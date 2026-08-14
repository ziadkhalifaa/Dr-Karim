import { useTranslation } from "react-i18next";
import { navigate } from "../../../lib/router";

export default function SuccessScreen({ referenceNumber, overallTier, reviewState }) {
  const { t } = useTranslation("assessment");
  const nextItems = [
    "next1",
    "next2",
    "next3",
  ];

  const createAccount = () => {
    // Prefill data + reference were stashed at submit time in sessionStorage.
    navigate("/register");
  };

  return (
    <div className="aq-screen aq-success">
      <div className="aq-card aq-success__card">
        <div
          className="aq-success__check"
          aria-hidden="true"
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="aq-screen__title aq-success__title">{t("success.title")}</h2>
        <p className="aq-success__body">{t("success.body")}</p>

        <div className="aq-success__ref">
          <span className="aq-success__ref-label">{t("success.refLabel")}</span>
          <span className="aq-success__ref-num" dir="ltr">
            {referenceNumber}
          </span>
        </div>

        <p className="aq-success__note">{overallTier ? `Review tier: ${overallTier}` : "Review tier: standard queue"} · {reviewState || "queued"}</p>

        <div className="aq-success__next">
          <h3>{t("success.nextTitle")}</h3>
          <ul>
            {nextItems.map((k) => (
              <li key={k}>{t(`success.${k}`)}</li>
            ))}
          </ul>
        </div>

        <p className="aq-success__note">{t("success.note")}</p>

<div className="aq-success__actions">
          <button
            type="button"
            className="aq-btn aq-btn--accent"
            onClick={() => navigate("/packages")}
            style={{ padding: "16px 24px", fontSize: "18px", borderRadius: "12px", background: "var(--primary)", color: "#fff", border: "none", fontWeight: "800", cursor: "pointer", width: "100%" }}
          >
            {t("success.choosePackage", "الخطوة التالية: اختيار الباقة والدفع")}
          </button>
        </div>
      </div>
    </div>
  );
}
