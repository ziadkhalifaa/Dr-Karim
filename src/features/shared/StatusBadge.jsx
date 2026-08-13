import { useTranslation } from "react-i18next";

const MAP = {
  queued: "dash-badge--neutral",
  assigned: "dash-badge--info",
  in_review: "dash-badge--warning",
  approved: "dash-badge--primary",
  rejected: "dash-badge--danger",
  pending: "dash-badge--neutral",
  confirmed: "dash-badge--info",
  completed: "dash-badge--primary",
  cancelled: "dash-badge--danger",
  no_show: "dash-badge--danger",
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span className={`dash-badge ${MAP[status] || "dash-badge--neutral"}`}>
      {t(`dashboard.status.${status}`, status)}
    </span>
  );
}
