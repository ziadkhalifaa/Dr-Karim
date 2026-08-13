import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

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

  return (
    <section className="section assessment" id="assessment" style={{ overflow: "hidden" }}>
      <div className="container">
        <motion.div 
          className="assessment__head"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, type: "spring" }}
        >
          <h2 className="sec-title" style={{ marginTop: 0 }}>
            {t("assessment.title")} <strong>{t("assessment.title2")}</strong>
          </h2>
          <p className="assessment__subtitle">{t("assessment.subtitle")}</p>
        </motion.div>

        <div className="assessment__layout">
          <motion.form 
            className="assessment__card" 
            onSubmit={submit}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          >
            <div className="assessment__step">
              <span className="assessment__step-no">01</span>
              <label className="assessment__step-label" htmlFor="assessment-weight">
                {t("assessment.weightLabel")}
              </label>
              <div className="assessment__weight">
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
                />
                <span className="assessment__unit">{t("assessment.weightUnit")}</span>
              </div>
            </div>

            <hr className="assessment__divider" />

            <div
              className="assessment__step"
              role="radiogroup"
              aria-labelledby="assessment-goal-label"
            >
              <span className="assessment__step-no">02</span>
              <p id="assessment-goal-label" className="assessment__step-label">
                {t("assessment.goalLabel")}
              </p>
              <div className="assessment__goals">
                {goals && goals.map((g) => (
                  <label
                    key={g}
                    className={`goal-opt ${goal === g ? "is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="assessment-goal"
                      checked={goal === g}
                      onChange={() => setGoal(g)}
                    />
                    <span className="goal-opt__radio" aria-hidden="true" />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <motion.button 
              type="submit" 
              className="btn btn-accent assessment__submit"
              whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(18,59,74,0.3)" }}
              whileTap={{ scale: 0.98 }}
            >
              {t("assessment.cta")}
              <svg
                className="assessment__arrow"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12h16M14 6l6 6-6 6" />
              </svg>
            </motion.button>
          </motion.form>

          <motion.div 
            className="assessment__media"
            initial={{ opacity: 0, scale: 0.8, x: -50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          >
            <motion.img 
              src="/assets/running_man.gif" 
              alt="Running" 
              className="assessment__art" 
              style={{ width: "100%", height: "auto", objectFit: "contain", filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.15))" }}
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
          </motion.div>
        </div>

        <motion.p 
          className="assessment__meta"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          {t("assessment.meta")}
        </motion.p>

        {toast && (
          <div className="assessment-toast" role="status">
            {t("assessment.comingSoon")}
          </div>
        )}
      </div>
    </section>
  );
}