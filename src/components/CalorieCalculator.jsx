import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, Flame, Beef, Wheat, Droplet, ArrowLeft, RefreshCw, Zap } from "lucide-react";
import { navigate } from "../lib/router";

export default function CalorieCalculator() {
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(80);
  const [activity, setActivity] = useState("1.375"); // Lightly active
  const [goal, setGoal] = useState("lose"); // lose, maintain, gain

  const results = useMemo(() => {
    const w = Number(weight) || 0;
    const h = Number(height) || 0;
    const a = Number(age) || 0;
    const act = Number(activity) || 1.2;

    if (w <= 0 || h <= 0 || a <= 0) return null;

    // Mifflin-St Jeor Equation
    let bmr = 10 * w + 6.25 * h - 5 * a + (gender === "male" ? 5 : -161);
    bmr = Math.round(bmr);

    const tdee = Math.round(bmr * act);

    let targetCalories = tdee;
    if (goal === "lose") targetCalories = Math.max(1200, Math.round(tdee - 500));
    else if (goal === "gain") targetCalories = Math.round(tdee + 350);

    // Macro Calculation
    // Protein: ~2g per kg
    const proteinG = Math.round(w * 2.0);
    const proteinCal = proteinG * 4;

    // Fat: 25% of calories
    const fatCal = targetCalories * 0.25;
    const fatG = Math.round(fatCal / 9);

    // Carbs: Remaining
    const carbCal = Math.max(0, targetCalories - (proteinCal + fatCal));
    const carbG = Math.round(carbCal / 4);

    // Water Intake: ~35ml per kg
    const waterL = (w * 0.035).toFixed(1);

    return {
      bmr,
      tdee,
      targetCalories,
      proteinG,
      carbG,
      fatG,
      waterL,
    };
  }, [gender, age, height, weight, activity, goal]);

  const handleStartAssessment = () => {
    try {
      sessionStorage.setItem("drke-home-weight", String(weight));
      sessionStorage.setItem("drke-home-goal", goal === "lose" ? "خسارة الوزن" : goal === "gain" ? "زيادة عضلية" : "الحفاظ على الوزن");
    } catch {
      /* ignore */
    }
    navigate("/assessment");
  };

  return (
    <section className="section" style={{ background: "var(--bg-soft)", padding: "70px 0" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 40px" }}
        >
          <span className="page-hero__kicker" style={{ justifyContent: "center" }}>
            <Calculator size={16} /> حاسبة التغذية السريعة
          </span>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "var(--deep)", marginTop: 10 }}>
            احسب احتیاجك اليومي من السعرات والماكروز
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 16, marginTop: 8 }}>
            أدخل بياناتك الأساسية للتعرف على معدل الحرق التلقائي والسعرات المناسبة لهدفك في ثوانٍ.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 30,
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          {/* Inputs Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card"
            style={{ padding: 28, borderRadius: 24, boxShadow: "var(--shadow-md)" }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, color: "var(--deep)" }}>
              بياناتك الشخصية
            </h3>

            <div style={{ display: "grid", gap: 18 }}>
              {/* Gender selector */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>النوع</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    type="button"
                    className={`btn ${gender === "male" ? "btn-accent" : "btn-outline"}`}
                    onClick={() => setGender("male")}
                    style={{ borderRadius: 12, padding: "10px" }}
                  >
                    👨 ذكر
                  </button>
                  <button
                    type="button"
                    className={`btn ${gender === "female" ? "btn-accent" : "btn-outline"}`}
                    onClick={() => setGender("female")}
                    style={{ borderRadius: 12, padding: "10px" }}
                  >
                    👩 أنثى
                  </button>
                </div>
              </div>

              {/* Age, Height, Weight inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>العمر (سنة)</label>
                  <input type="number" className="input" value={age} onChange={(e) => setAge(e.target.value)} style={{ padding: "10px" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>الطول (سم)</label>
                  <input type="number" className="input" value={height} onChange={(e) => setHeight(e.target.value)} style={{ padding: "10px" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>الوزن (كجم)</label>
                  <input type="number" className="input" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ padding: "10px" }} />
                </div>
              </div>

              {/* Activity level */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>مستوى النشاط اليومي</label>
                <select className="input" value={activity} onChange={(e) => setActivity(e.target.value)}>
                  <option value="1.2">خامل (مكتبي / قليل الحركة)</option>
                  <option value="1.375">نشاط خفيف (تمارين 1-3 أيام/أسبوع)</option>
                  <option value="1.55">نشاط متوسط (تمارين 3-5 أيام/أسبوع)</option>
                  <option value="1.725">نشاط عالي (تمارين 6-7 أيام/أسبوع)</option>
                  <option value="1.9">نشاط مكثف جداً (رياضي محترف / عمل شاق)</option>
                </select>
              </div>

              {/* Goal */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>الهدف الرئيسي</label>
                <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
                  <option value="lose">🔥 خسارة الدهون والنزل بالوزن</option>
                  <option value="maintain">⚖️ الحفاظ على الوزن الحالي</option>
                  <option value="gain">💪 بناء عضلات وزيادة الوزن</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Output Results Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card"
            style={{
              padding: 28,
              borderRadius: 24,
              boxShadow: "var(--shadow-md)",
              background: "linear-gradient(145deg, var(--surface-brand), var(--surface-brand-2))",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>
                  النتيجة التقديرية
                </h3>
                <span style={{ background: "rgba(111, 208, 5, 0.2)", color: "#7ed90f", padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 800 }}>
                  <Zap size={14} inline /> حساب فوري
                </span>
              </div>

              {results ? (
                <div>
                  <div style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: 20, textAlign: "center", marginBottom: 20, border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                    <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 600 }}>السعرات اليومية المقترحة</div>
                    <div style={{ fontSize: 38, fontWeight: 900, color: "var(--primary)", margin: "4px 0" }}>
                      {results.targetCalories.toLocaleString("ar-EG")} <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>سعرة / يوم</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      معدل الحرق الأساسي (BMR): {results.bmr} • مجهودك الكلي (TDEE): {results.tdee}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center", marginBottom: 20 }}>
                    <div style={{ background: "rgba(255, 255, 255, 0.06)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>البروتين 🥩</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", marginTop: 4 }}>{results.proteinG}ج</div>
                    </div>
                    <div style={{ background: "rgba(255, 255, 255, 0.06)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>الكارب 🌾</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", marginTop: 4 }}>{results.carbG}ج</div>
                    </div>
                    <div style={{ background: "rgba(255, 255, 255, 0.06)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>الدهون 🥑</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", marginTop: 4 }}>{results.fatG}ج</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.85, textAlign: "center" }}>
                    💧 احتياجك اليومي من الماء: <strong style={{ color: "#ffffff" }}>{results.waterL} لتر</strong>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.6 }}>
                  أدخل أرقام صحيحة لعرض النتيجة
                </div>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-accent btn-lg"
                onClick={handleStartAssessment}
                style={{ width: "100%", justifyContent: "center" }}
              >
                ابدأ التقييم الطبي الشامل بخطتك المخصصة <ArrowLeft size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
