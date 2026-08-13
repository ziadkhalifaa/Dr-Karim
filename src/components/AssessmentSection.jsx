import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { PulseIcon } from "./Icons";
import { navigate } from "../lib/router";
import { motion } from "framer-motion";

export default function AssessmentSection() {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [weight, setWeight] = useState(75);
  const [goal, setGoal] = useState("lose");

  const handleSubmit = (e) => {
    e.preventDefault();
    startTransition(() => {
      navigate(`/assessment?w=${weight}&g=${goal}`);
    });
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

        <div className="assessment__grid">
          <motion.form 
            className="assessment__form" 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          >
            <div className="assess-step">
              <div className="assess-step__num">01</div>
              <div className="assess-step__content">
                <label className="assess-label">{t("assessment.q1")}</label>
                <div className="assess-input-group">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="assess-input"
                    min="30"
                    max="300"
                  />
                  <span className="assess-unit">{t("assessment.kg")}</span>
                </div>
              </div>
            </div>

            <div className="assess-step">
              <div className="assess-step__num">02</div>
              <div className="assess-step__content">
                <label className="assess-label">{t("assessment.q2")}</label>
                <div className="assess-radio-group">
                  <label className={`assess-radio ${goal === "lose" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="goal"
                      value="lose"
                      checked={goal === "lose"}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                    {t("assessment.lose")}
                  </label>
                  <label className={`assess-radio ${goal === "gain" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="goal"
                      value="gain"
                      checked={goal === "gain"}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                    {t("assessment.gain")}
                  </label>
                  <label className={`assess-radio ${goal === "maintain" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="goal"
                      value="maintain"
                      checked={goal === "maintain"}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                    {t("assessment.maintain")}
                  </label>
                </div>
              </div>
            </div>

            <motion.button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={isPending}
              whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(18,59,74,0.3)" }}
              whileTap={{ scale: 0.98 }}
            >
              {isPending ? t("assessment.loading") : t("assessment.submit")}
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
          className="assessment__note"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          {t("assessment.disclaimer")}
        </motion.p>
      </div>
    </section>
  );
}