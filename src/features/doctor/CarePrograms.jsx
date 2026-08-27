import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ClipboardList, Plus, ArrowLeft, Save, Play, X, Inbox, UserRound, BookTemplate, Check, Trash2
} from "lucide-react";
import { careApi, patientApi } from "../../api/client";
import { navigate } from "../../lib/router";
import PatientSelector from "../shared/PatientSelector";
import { templateStore } from "../../lib/templateStore";

const statusTone = (s) =>
  ({ draft: "dash-badge--neutral", scheduled: "dash-badge--info", active: "dash-badge--primary", paused: "dash-badge--warning", completed: "dash-badge--success", cancelled: "dash-badge--danger", expired: "dash-badge--neutral" }[s] || "dash-badge--neutral");

// Phase 6D: patient-contextual. The patient is picked by name/phone from the
// directory (never by typing an internal id). When `patientId` is provided the
// workspace is already scoped to that patient.
function PlanVersionSelect({ options, label, value, onChange, busy }) {
  const { t } = useTranslation();
  if (!options || busy)
    return (
      <label className="dash-field">
        <span>{label}</span>
        {busy ? <p className="dash-muted">{t("dashboard.common.loading")}</p> : <p className="dash-muted">{t("doctorCare.selectPatientFirst")}</p>}
      </label>
    );
  return (
    <label className="dash-field">
      <span>{label}</span>
      <select
        className="dash-select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{t("doctorCare.noVersion")}</option>
        {options.map((v) => (
          <option key={v.id} value={v.id}>
            {t("doctorCare.planVersionPicker", { n: v.versionNo })}{" "}
            <span dir="ltr">({v.effectiveFrom || "?"} → {v.effectiveTo || "∞"})</span>
          </option>
        ))}
      </select>
    </label>
  );
}

function CreateProgram({ onCreate, onCancel, patientId, patientLabel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(patientId ? { id: patientId, fullName: patientLabel || "…" } : null);
  const [versions, setVersions] = useState(null);
  const [versionsBusy, setVersionsBusy] = useState(false);
  const [nutritionVersionId, setNutritionVersionId] = useState("");
  const [exerciseVersionId, setExerciseVersionId] = useState("");
  const [mode, setMode] = useState("manual"); // "manual" | "template"
  const [chosenTemplate, setChosenTemplate] = useState(null);
  const templates = templateStore.list();

  useEffect(() => {
    if (!selected?.id) { setVersions(null); setNutritionVersionId(""); setExerciseVersionId(""); return; }
    let cancelled = false;
    setVersionsBusy(true);
    patientApi.planVersions(selected.id)
      .then((res) => { if (!cancelled) setVersions({ nutrition: res.nutrition || [], exercise: res.exercise || [] }); })
      .catch(() => { if (!cancelled) setVersions({ nutrition: [], exercise: [] }); })
      .finally(() => { if (!cancelled) setVersionsBusy(false); });
    return () => { cancelled = true; };
  }, [selected?.id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const f = new FormData(e.currentTarget);
      // Template activities may carry non-ASCII codes (auto-generated from
      // Arabic names in the template editor). The API only accepts
      // [a-z0-9_-], so derive a safe unique code per activity here.
      const seen = new Set();
      const safeCode = (a, idx) => {
        let base = String(a.code || a.nameEn || a.activityType || "activity")
          .toLowerCase()
          .replace(/[^a-z0-9_-]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 30);
        if (!base) base = `${a.activityType || "activity"}_${idx}`;
        let code = base;
        let n = 2;
        while (seen.has(code)) code = `${base}_${n++}`;
        seen.add(code);
        return code;
      };
      const templateActivities = chosenTemplate?.activities?.length
        ? chosenTemplate.activities.map((a, idx) => ({
            activityType: a.activityType,
            measure: a.measure,
            code: safeCode(a, idx),
            nameAr: a.nameAr || null,
            nameEn: a.nameEn || null,
            plannedTarget: a.plannedTarget || {},
          }))
        : null;
      await onCreate({
        patientId: selected?.id,
        startDate: f.get("startDate"),
        endDate: f.get("endDate"),
        status: f.get("status") || "draft",
        nutritionPlanVersionId: nutritionVersionId || null,
        exercisePlanVersionId: exerciseVersionId || null,
        programInstructions: f.get("programInstructions") || null,
        templateActivities,
      });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ background: "#fff", border: "1.5px solid var(--dash-border)", borderRadius: "24px", overflow: "hidden", marginBottom: "32px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
      <div style={{ background: "var(--dash-bg)", borderBottom: "1.5px solid var(--dash-border)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--dash-text)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: 36, height: 36, background: "var(--dash-primary)", color: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={20} /></span>
          إعداد مساحة عمل جديدة للمريض
        </h3>
        <button onClick={onCancel} style={{ background: "#fff", border: "1.5px solid var(--dash-border)", width: 32, height: 32, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--dash-text-muted)" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: "24px" }}>
        {/* Mode Toggle */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", background: "var(--dash-bg)", padding: "6px", borderRadius: "14px", width: "fit-content" }}>
          <button
            type="button"
            onClick={() => { setMode("manual"); setChosenTemplate(null); }}
            style={{
              padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "800", border: "none",
              background: mode === "manual" ? "#fff" : "transparent",
              color: mode === "manual" ? "var(--dash-primary)" : "var(--dash-text-muted)",
              boxShadow: mode === "manual" ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s"
            }}
          >
            ✏️ إنشاء وتخصيص يدوي
          </button>
          <button
            type="button"
            onClick={() => setMode("template")}
            style={{
              padding: "10px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "800", border: "none",
              background: mode === "template" ? "#fff" : "transparent",
              color: mode === "template" ? "var(--dash-primary)" : "var(--dash-text-muted)",
              boxShadow: mode === "template" ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s"
            }}
          >
            📋 استيراد من قالب جاهز
          </button>
        </div>

        {/* Template Picker */}
        {mode === "template" && (
          <div style={{ padding: "20px", background: "var(--dash-bg)", borderRadius: "16px", border: "1.5px dashed var(--dash-border)", marginBottom: "24px" }}>
            <div style={{ fontWeight: "800", fontSize: "15px", color: "var(--dash-text)", marginBottom: "16px" }}>اختر قالب الرعاية:</div>
            {templates.length === 0 ? (
              <p style={{ color: "var(--dash-text-muted)", fontSize: "14px", fontWeight: "600", textAlign: "center", margin: 0 }}>
                لا توجد قوالب محفوظة بعد — اذهب لقسم "القوالب" لإنشاء أول قالب لك.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" }}>
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => setChosenTemplate(chosenTemplate?.id === tmpl.id ? null : tmpl)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "12px",
                      padding: "16px", borderRadius: "12px", cursor: "pointer",
                      border: "2px solid " + (chosenTemplate?.id === tmpl.id ? "var(--dash-primary)" : "transparent"),
                      background: "#fff",
                      boxShadow: chosenTemplate?.id === tmpl.id ? "0 4px 12px rgba(var(--dash-primary-rgb), 0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: "10px", background: chosenTemplate?.id === tmpl.id ? "var(--dash-primary)" : "var(--dash-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {chosenTemplate?.id === tmpl.id ? <Check size={20} style={{ color: "#fff" }} /> : <BookTemplate size={20} style={{ color: "var(--dash-primary)" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "800", fontSize: "15px", color: "var(--dash-text)", lineHeight: 1.2 }}>{tmpl.name}</div>
                      {tmpl.description && <div style={{ fontSize: "13px", color: "var(--dash-text-muted)", marginTop: "6px", lineHeight: 1.4 }}>{tmpl.description}</div>}
                      <div style={{ display: "inline-block", fontSize: "12px", color: "#3ca503", background: "#e6fbc2", padding: "4px 8px", borderRadius: "6px", fontWeight: "700", marginTop: "8px" }}>
                        {tmpl.activities.length} نشاط مدرج
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            <div style={{ background: "var(--dash-bg)", padding: "20px", borderRadius: "16px", border: "1px solid var(--dash-border)" }}>
              <h4 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: "800", color: "var(--dash-text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserRound size={16} /> بيانات المريض
              </h4>
              {patientId ? (
                <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--dash-primary)", background: "#fff", padding: "12px 16px", borderRadius: "12px", border: "1.5px solid var(--dash-border)" }}>
                  {selected?.fullName}
                </div>
              ) : (
                <PatientSelector value={selected} onSelect={setSelected} />
              )}
            </div>

            <div style={{ background: "var(--dash-bg)", padding: "20px", borderRadius: "16px", border: "1px solid var(--dash-border)" }}>
              <h4 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: "800", color: "var(--dash-text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <ClipboardList size={16} /> توقيت وحالة البرنامج
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px", display: "block" }}>تاريخ البداية</span>
                  <input type="date" name="startDate" required style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid var(--dash-border)", fontSize: "14px", fontFamily: "inherit" }} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px", display: "block" }}>تاريخ النهاية</span>
                  <input type="date" name="endDate" required style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid var(--dash-border)", fontSize: "14px", fontFamily: "inherit" }} />
                </label>
              </div>
              <label style={{ display: "block" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--dash-text-muted)", marginBottom: "6px", display: "block" }}>حالة البرنامج (الآن)</span>
                <select name="status" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid var(--dash-border)", fontSize: "14px", fontFamily: "inherit", background: "#fff" }}>
                  <option value="draft">مسودة (Draft) - يمكن التعديل عليه</option>
                  <option value="scheduled">مجدول (Scheduled) - سيبدأ قريباً</option>
                </select>
              </label>
            </div>
          </div>

          <div style={{ background: "var(--dash-bg)", padding: "24px", borderRadius: "16px", border: "1px solid var(--dash-border)" }}>
            <h4 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "800", color: "var(--dash-text)", display: "flex", alignItems: "center", gap: "8px" }}>
              ربط مساحة العمل بخطط أخرى (اختياري)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid var(--dash-border)" }}>
                <PlanVersionSelect
                  options={versions?.nutrition}
                  busy={versionsBusy}
                  label="🥗 الخطة الغذائية المرتبطة"
                  value={nutritionVersionId}
                  onChange={setNutritionVersionId}
                />
              </div>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid var(--dash-border)" }}>
                <PlanVersionSelect
                  options={versions?.exercise}
                  busy={versionsBusy}
                  label="💪 خطة التمارين المرتبطة"
                  value={exerciseVersionId}
                  onChange={setExerciseVersionId}
                />
              </div>
            </div>
          </div>

          <label style={{ display: "block" }}>
            <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--dash-text)", marginBottom: "8px", display: "block" }}>تعليمات وإرشادات إضافية للبرنامج (تظهر للمريض)</span>
            <textarea name="programInstructions" rows="3" placeholder="اكتب أي تعليمات عامة للمريض خلال فترة البرنامج..." style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1.5px solid var(--dash-border)", fontSize: "14px", fontFamily: "inherit", resize: "vertical", background: "var(--dash-bg)" }} />
          </label>

          {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: "700" }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1.5px solid var(--dash-border)", paddingTop: "24px" }}>
            <button type="button" onClick={onCancel} style={{ padding: "12px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "800", background: "var(--dash-bg)", border: "1.5px solid var(--dash-border)", color: "var(--dash-text)", cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
            <button type="submit" disabled={busy || !selected?.id} style={{ padding: "12px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "800", background: "var(--dash-primary)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(var(--dash-primary-rgb), 0.3)" }}>
              <Save size={18} /> {busy ? "جاري الإنشاء..." : "إنشاء مساحة العمل"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddDefinitions({ onAdd }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const f = new FormData(e.currentTarget);
      const target = {};
      if (f.get("targetValue") !== "") target.value = Number(f.get("targetValue"));
      if (f.get("targetUnit")) target.unit = f.get("targetUnit");
      const rawCode = String(f.get("code") || "").trim();
      const code = rawCode.toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || `act_${Date.now().toString(36)}`;
      await onAdd([{
        activityType: f.get("activityType"),
        measure: f.get("measure"),
        code,
        nameAr: f.get("nameAr") || null,
        nameEn: f.get("nameEn") || null,
        plannedTarget: target,
      }]);
      e.currentTarget.reset();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">
          <Plus />
          {t("doctorCare.addDefinition")}
        </h3>
      </div>
      <form className="dash-form" onSubmit={submit}>
        <div className="dash-form--grid">
          <label className="dash-field">
            <span>{t("doctorCare.type")}</span>
            <select name="activityType">
              <option value="nutrition">🥗 {t("doctorCare.nutrition")}</option>
              <option value="exercise">💪 {t("doctorCare.exercise")}</option>
              <option value="medication">💊 {t("doctorCare.medication")}</option>
            </select>
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.measure")}</span>
            <select name="measure">
              <option value="boolean">{t("doctorCare.measureBoolean")}</option>
              <option value="sessions">{t("doctorCare.measureSessions")}</option>
              <option value="quantity">{t("doctorCare.measureQuantity")}</option>
              <option value="duration">{t("doctorCare.measureDuration")}</option>
            </select>
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.code")}</span>
            <input type="text" name="code" required />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.nameAr")}</span>
            <input type="text" name="nameAr" required />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.nameEn")}</span>
            <input type="text" name="nameEn" />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.targetValue")}</span>
            <input type="number" name="targetValue" min="0" step="any" />
          </label>
          <label className="dash-field">
            <span>{t("doctorCare.targetUnit")}</span>
            <input type="text" name="targetUnit" placeholder="g · min · sessions" />
          </label>
        </div>
        {error && <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>}
        <button className="dash-btn dash-btn--primary" disabled={busy}>
          <Plus />{busy ? t("dashboard.common.loading") : t("doctorCare.add")}
        </button>
      </form>
    </section>
  );
}

function ProgramDetail({ id, patientLabel, onBack, onChanged }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setData(await careApi.program(id));
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const activate = async (versionNo) => {
    setBusy(true);
    try {
      await careApi.activate(id, versionNo);
      await load();
      await onChanged();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const addDefinitions = async (body) => {
    try {
      await careApi.addDefinitions(id, body);
      await load();
      await onChanged();
      setShowAdd(false);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const deleteThis = async () => {
    if (!window.confirm("هل أنت متأكد من حذف هذا البرنامج؟")) return;
    setBusy(true);
    try {
      await careApi.deleteProgram(id);
      await onChanged();
      onBack();
    } catch (err) {
      setError(err.message || String(err));
      setBusy(false);
    }
  };

  if (!data && !error) return <p className="dash-muted">{t("dashboard.common.loading")}</p>;
  if (error && !data)
    return (
      <section className="dash-panel">
        <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>
      </section>
    );

  const { program, versions } = data;
  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <ClipboardList />
          {t("doctorCare.programDetail")}
        </span>
        <h2>{patientLabel ? `${patientLabel}` : `#${program.id}`}</h2>
        <div className="dash-row-actions">
          <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={onBack}>
            <ArrowLeft />{t("doctorCare.back")}
          </button>
          <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={deleteThis} disabled={busy} style={{ color: "var(--dash-danger)" }}>
            <Trash2 size={16} /> حذف
          </button>
          <span className={`dash-badge ${statusTone(program.status)}`}>{program.status}</span>
        </div>
      </div>
      {error && <p className="dash-muted" style={{ color: "var(--dash-danger)" }}>{error}</p>}
      <div className="dash-split">
        {versions.map((version) => {
          const draft = version.status === "draft";
          return (
            <section className="dash-panel" key={version.id}>
              <div className="dash-panel__head">
                <h3 className="dash-panel__title">
                  {t("doctorCare.version", { n: version.version_no })}
                </h3>
                <span className={`dash-badge ${statusTone(version.status)}`}>{version.status}</span>
              </div>
              <div className="dash-panel__body">
                <p className="dash-muted">
                  {version.effective_from} → {version.effective_to || "∞"}
                </p>
                {draft && (
                  <div className="dash-row-actions">
                    <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => setShowAdd((s) => !s)}>
                      <Plus />{t("doctorCare.addDefinition")}
                    </button>
                    <button className="dash-btn dash-btn--primary dash-btn--sm" disabled={busy} onClick={() => activate(version.version_no)}>
                      <Play />{t("doctorCare.activate")}
                    </button>
                  </div>
                )}
                {version.definitions.length ? (
                  <ul className="dash-list">
                    {version.definitions.map((d) => (
                      <li key={d.id}>
                        <strong>{d.name_ar || d.name_en}</strong>
                        <span className="dash-muted"> · {d.measure}{d.planned_target_json?.value != null ? ` (${d.planned_target_json.value}${d.planned_target_json.unit ? ` ${d.planned_target_json.unit}` : ""})` : ""}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dash-muted">{t("doctorCare.noDefinitions")}</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {showAdd && <AddDefinitions onAdd={addDefinitions} />}
    </>
  );
}

const PLAN_STATUS_AR = { draft: "مسودة", doctor_review: "قيد المراجعة", approved: "معتمدة", active: "منشطة", archived: "مؤرشفة" };

function SavedPlans({ patientId, reloadKey }) {
  const [plans, setPlans] = useState(null);
  useEffect(() => {
    if (!patientId) { setPlans(null); return; }
    let cancelled = false;
    patientApi.planVersions(patientId)
      .then((res) => { if (!cancelled) setPlans(res); })
      .catch(() => { if (!cancelled) setPlans({ nutrition: [], exercise: [] }); });
    return () => { cancelled = true; };
  }, [patientId, reloadKey]);
  if (!plans) return null;
  const rows = [
    ...plans.nutrition.map((v) => ({ ...v, icon: "🥗", label: "تغذية" })),
    ...plans.exercise.map((v) => ({ ...v, icon: "🏋️", label: "رياضة" })),
  ];
  return (
    <section className="dash-panel">
      <div className="dash-panel__head">
        <h3 className="dash-panel__title">الخطط المحفوظة</h3>
        <span className="dash-badge dash-badge--primary">{rows.length}</span>
      </div>
      {rows.length ? (
        <div className="dash-table-wrap dash-panel__body--flush">
          <table className="dash-table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>النسخة</th>
                <th>الحالة</th>
                <th>مفعّلة من</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={`${v.label}-${v.id}`}>
                  <td>{v.icon} {v.label}</td>
                  <td>#{v.versionNo}</td>
                  <td><span className={`dash-badge ${statusTone(v.status)}`}>{PLAN_STATUS_AR[v.status] || v.status}</span></td>
                  <td className="dash-cell-muted">{v.effectiveFrom || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dash-empty"><Inbox /><p>لا توجد خطط محفوظة بعد — اضغط "إضافة وتعديل النظام الغذائي" لإنشاء خطة.</p></div>
      )}
    </section>
  );
}

export default function CarePrograms({ patientId, patientLabel }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    const list = await careApi.programList(patientId ? `?patientId=${patientId}` : "");
    setRows(list || []);
  };

  const removeProgram = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("هل أنت متأكد من حذف هذا البرنامج؟")) return;
    try {
      await careApi.deleteProgram(id);
      await load();
    } catch (err) {
      alert(err.message || String(err));
    }
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  if (selected) return <ProgramDetail id={selected} patientLabel={patientLabel} onBack={() => setSelected(null)} onChanged={load} />;

  return (
    <>
      <div className="dash-page-head">
        <span className="dash-eyebrow">
          <ClipboardList />
          {t("doctorCare.title")}
        </span>
        <h2>{patientLabel ? patientLabel : t("doctorCare.title")}</h2>
        <p>{t("doctorCare.subtitle")}</p>
      </div>

      {showCreate && <CreateProgram patientId={patientId} patientLabel={patientLabel} onCreate={async (body) => {
        const p = await careApi.createProgram(body);
        if (body.templateActivities?.length && p?.program?.id) {
          await careApi.addDefinitions(String(p.program.id), body.templateActivities);
        }
        setShowCreate(false);
        await load();
        setSelected(String(p.program.id));
        return p;
      }} onCancel={() => setShowCreate(false)} />}

      <SavedPlans patientId={patientId} reloadKey={rows.length} />

      <section className="dash-panel">
        <div className="dash-panel__head">
          <h3 className="dash-panel__title">
            <ClipboardList />
            {t("doctorCare.listTitle")}
          </h3>
          <div className="dash-row-actions">
            <span className="dash-badge dash-badge--primary">{rows.length}</span>
            {patientId && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  className="dash-btn dash-btn--sm" 
                  onClick={() => navigate(`/doctor/patients/${patientId}/nutrition-builder`)} 
                  style={{ background: "linear-gradient(135deg, #024fab 0%, #024fab 100%)", color: "#fff", border: "none", boxShadow: "0 4px 15px rgba(2, 79, 171, 0.4)", display: "flex", alignItems: "center", gap: "6px", fontWeight: "900", padding: "8px 16px", borderRadius: "10px", transition: "all 0.2s" }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  🥗 بناء النظام الغذائي
                </button>
                <button 
                  className="dash-btn dash-btn--sm" 
                  onClick={() => navigate(`/doctor/patients/${patientId}/exercise-builder`)} 
                  style={{ background: "linear-gradient(135deg, #ef4444 0%, #ef4444 100%)", color: "#fff", border: "none", boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)", display: "flex", alignItems: "center", gap: "6px", fontWeight: "900", padding: "8px 16px", borderRadius: "10px", transition: "all 0.2s" }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  💪 بناء خطة التمارين
                </button>
              </div>
            )}
            <button className="dash-btn dash-btn--primary dash-btn--sm" onClick={() => setShowCreate((s) => !s)}>
              <Plus />{t("doctorCare.newProgram")}
            </button>
          </div>
        </div>
        {rows.length ? (
          <div className="dash-table-wrap dash-panel__body--flush">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t("doctorCare.range")}</th>
                  <th>{t("doctorCare.status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="dash-cell-muted" style={{ fontWeight: 700 }} dir="ltr">{p.start_date} &rarr; {p.end_date}</td>
                    <td><span className={`dash-badge ${statusTone(p.status)}`}>{p.status}</span></td>
                    <td>
                      <div className="dash-row-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={() => setSelected(String(p.id))}>
                          {t("doctorCare.open")}
                        </button>
                        <button className="dash-btn dash-btn--ghost dash-btn--sm" onClick={(e) => removeProgram(String(p.id), e)} style={{ padding: "8px", color: "var(--dash-danger)" }} title="حذف البرنامج">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dash-empty"><Inbox /><p>{t("doctorCare.empty")}</p></div>
        )}
      </section>
    </>
  );
}