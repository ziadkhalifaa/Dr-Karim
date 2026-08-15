import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Lock } from "lucide-react";

export default function AssessmentSection() {
  const { t } = useTranslation();
  const goals = t("assessment.goals", { returnObjects: true });
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState(goals ? goals[0] : "");
  const [toast, setToast] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setToast(true);
    window.clearTimeout(submit.timer);
    submit.timer = window.setTimeout(() => setToast(false), 3200);
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
                    background: "rgba(217, 119, 6, 0.18)",
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
        </div>

        {toast && <div className="assess__toast" role="status">{t("assessment.comingSoon")}</div>}
      </div>
    </section>
  );
}
