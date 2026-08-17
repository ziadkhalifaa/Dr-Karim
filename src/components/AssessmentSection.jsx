import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { navigate } from "../lib/router";
import { useAuth } from "../context/AuthProvider";

export default function AssessmentSection() {
  const { t } = useTranslation();
  const { user, authenticated } = useAuth();
  const isStaff = authenticated && user?.role !== "patient";
  const goals = t("assessment.goals", { returnObjects: true });
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState(goals ? goals[0] : "");

  const submit = (e) => {
    e.preventDefault();
    try {
      sessionStorage.setItem("drke-home-weight", weight.trim());
      sessionStorage.setItem("drke-home-goal", goal);
    } catch { /* ignore storage errors */ }
    navigate("/assessment");
  };

  const features = [
    { key: "features.1", icon: CheckCircle2 },
    { key: "features.2", icon: Clock },
    { key: "features.3", icon: Lock },
  ];

  return (
    <section className="section section--alt" id="assessment">
      <div className="container">
        <div className="assess">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <span className="assess__kicker">{t("assessment.tag")}</span>
            <h2 className="assess__title">
              {t("assessment.title")} <span className="gold">{t("assessment.title2")}</span>
            </h2>
            <p className="assess__lead">{t("assessment.subtitle")}</p>

            <div className="assess__features">
              {features.map(({ key, icon: Icon }) => (
                <div className="assess__feature" key={key}>
                  <span className="assess__feature-ico">
                    <Icon size={17} />
                  </span>
                  {t(`assessment.${key}`)}
                </div>
              ))}
            </div>
          </motion.div>

          {isStaff ? (
            <motion.div
              className="assess__card"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 14, padding: "40px 32px" }}
            >
              <span style={{ fontSize: 44 }}>🩺</span>
              <p className="assess__kicker" style={{ margin: 0 }}>
                {t("assessment.previewTitle", { defaultValue: "أنت في وضع المعاينة" })}
              </p>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
                {t("assessment.previewTitle", { defaultValue: "أنت في وضع المعاينة" })}
              </h3>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14.5, lineHeight: 1.8, marginTop: 4 }}>
                {t("assessment.previewBody", {
                  defaultValue: "هذا القسم مخصص للمرضى للبدء في التقييم الغذائي. انتقل إلى لوحة التحكم لإدارة المرضى والباقات والخطط.",
                })}
              </div>
              <button
                className="btn btn-accent"
                style={{ width: "100%", padding: "16px 24px", justifyContent: "center" }}
                onClick={() => navigate("/doctor")}
              >
                {t("nav.dashboard", { defaultValue: "لوحة التحكم" })}
              </button>
            </motion.div>
          ) : (
          <motion.form
            className="assess__card"
            onSubmit={submit}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="assess__field">
              <label className="assess__label" htmlFor="assessment-weight">
                {t("assessment.weightLabel")}
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  id="assessment-weight"
                  type="number"
                  min="1"
                  max="400"
                  step="0.1"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="75"
                  className="assess__input"
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 18px",
                    borderRadius: 14,
                    background: "rgba(2, 79, 171, 0.1)",
                    color: "var(--secondary-soft)",
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  {t("assessment.weightUnit")}
                </span>
              </div>
            </div>

            <div className="assess__field" role="radiogroup" aria-labelledby="assessment-goal-label">
              <p className="assess__label" id="assessment-goal-label">
                {t("assessment.goalLabel")}
              </p>
              <div className="assess__goals">
                {goals && goals.map((g) => (
                  <button
                    type="button"
                    key={g}
                    className={`assess__goal ${goal === g ? "is-active" : ""}`}
                    onClick={() => setGoal(g)}
                  >
                    <span className="assess__goal-radio" aria-hidden="true" />
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-accent btn-block" style={{ padding: "17px 30px" }}>
              {t("assessment.cta")}
            </button>

            <p style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
              {t("assessment.meta")}
            </p>
          </motion.form>
          )}
        </div>
      </div>
    </section>
  );
}
