import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, Coins, ArrowLeft, ShoppingBag, TrendingUp } from "lucide-react";
import { careApi, storeApi } from "../../api/client";
import { navigate } from "../../lib/router";

export default function PointsPage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("balance"); // balance | leaderboard | redeem

  useEffect(() => {
    (async () => {
      try {
        const [b, lb] = await Promise.all([
          careApi.pointsBalance(),
          careApi.pointsLeaderboard(),
        ]);
        setBalance(b);
        setLeaderboard(lb || []);
      } catch { /* ignore */ }
      try {
        const prods = await storeApi.products();
        setProducts((prods || []).filter((p) => p.points_price));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const redeem = async (productId, points) => {
    if (!window.confirm(t("points.redeemConfirm", { points, product: productId }))) return;
    try {
      await careApi.redeemPoints({ productId, pointsToSpend: points });
      const b = await careApi.pointsBalance();
      setBalance(b);
    } catch (e) { alert(e.message || t("points.redeemFailed")); }
  };

  if (loading) return <div className="app-loading" aria-live="polite">{t("loading")}</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => navigate("/patient")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--dash-primary)" }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>{t("points.title")}</h1>
      </div>

      {/* Balance card */}
      <div style={{ background: "linear-gradient(135deg, var(--dash-primary), #4aa300)", borderRadius: "16px", padding: "32px", color: "#fff", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <Coins size={28} />
          <span style={{ fontSize: "14px", opacity: 0.9 }}>{t("points.myBalance")}</span>
        </div>
        <div style={{ fontSize: "48px", fontWeight: 800 }}>{balance}</div>
        <div style={{ fontSize: "14px", opacity: 0.8, marginTop: "4px" }}>{t("points.balanceDesc")}</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {[
          { key: "balance", label: t("points.myBalance"), icon: Coins },
          { key: "leaderboard", label: t("points.leaderboard"), icon: Trophy },
          { key: "redeem", label: t("points.redeem"), icon: ShoppingBag },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              padding: "10px 8px", borderRadius: "10px", border: "none", cursor: "pointer",
              background: view === tab.key ? "var(--dash-primary)" : "var(--dash-bg)",
              color: view === tab.key ? "#fff" : "var(--dash-text)",
              fontWeight: 600, fontSize: "13px",
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === "balance" && (
        <div style={{ background: "var(--dash-bg)", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ marginBottom: "12px" }}><TrendingUp size={18} /> {t("points.recentActivity")}</h3>
          <p style={{ color: "var(--dash-muted)", fontSize: "14px" }}>{t("points.activityHint")}</p>
          <div style={{ marginTop: "16px", display: "grid", gap: "8px" }}>
            {[
              { label: t("points.exercise"), pts: 10, icon: "💪" },
              { label: t("points.nutrition"), pts: 5, icon: "🥗" },
              { label: t("points.checkin"), pts: 5, icon: "📋" },
              { label: t("points.join"), pts: 50, icon: "🎯" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", borderRadius: "8px", border: "1px solid var(--dash-border)" }}>
                <span>{item.icon} {item.label}</span>
                <span style={{ fontWeight: 700, color: "var(--dash-primary)" }}>+{item.pts} {t("points.pts")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "leaderboard" && (
        <div style={{ background: "var(--dash-bg)", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ marginBottom: "16px" }}><Trophy size={20} /> {t("points.leaderboardTitle")}</h3>
          {leaderboard.length === 0 ? (
            <p style={{ color: "var(--dash-muted)" }}>{t("points.noData")}</p>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {leaderboard.map((row, i) => (
                <div key={row.patient_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#fff", borderRadius: "8px", border: "1px solid var(--dash-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: i === 0 ? "#ffc107" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "var(--dash-muted)", width: "24px" }}>#{i + 1}</span>
                    <span style={{ fontSize: "14px" }}>Patient {row.patient_id}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: "var(--dash-primary)" }}>{row.balance} {t("points.pts")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "redeem" && (
        <div style={{ background: "var(--dash-bg)", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ marginBottom: "16px" }}><ShoppingBag size={20} /> {t("points.redeemTitle")}</h3>
          {products.length === 0 ? (
            <p style={{ color: "var(--dash-muted)" }}>{t("points.noProducts")}</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {products.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#fff", borderRadius: "10px", border: "1px solid var(--dash-border)" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name_ar || p.name_en || p.name}</div>
                    {p.points_price && <div style={{ fontSize: "13px", color: "var(--dash-primary)", fontWeight: 600 }}>{p.points_price} {t("points.pts")}</div>}
                  </div>
                  <button
                    onClick={() => redeem(p.id, p.points_price)}
                    disabled={balance < p.points_price}
                    style={{
                      padding: "8px 16px", borderRadius: "8px", border: "none", cursor: balance < p.points_price ? "not-allowed" : "pointer",
                      background: balance >= p.points_price ? "var(--dash-primary)" : "#ccc", color: "#fff", fontWeight: 600, fontSize: "13px",
                    }}
                  >
                    {t("points.redeem")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}