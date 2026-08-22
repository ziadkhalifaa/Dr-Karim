import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { useAssessment } from "../hooks/useAssessment";
import { SECTIONS } from "../data/sections";
import { SUBJECT_DEFAULT } from "../data/questions";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Intro from "../components/Intro";
import ResumeBanner from "../components/ResumeBanner";
import ProgressBar from "../components/ProgressBar";
import SectionView from "../components/SectionView";
import StepActions from "../components/StepActions";
import ReviewStep from "../components/ReviewStep";
import SuccessScreen from "../components/SuccessScreen";
import { isRequired } from "../logic/conditions";
import { validateQuestion, getWarnings } from "../validation/validate";
import { submitAssessment } from "../api/assessmentApi.js";
import { clearDraft } from "../utils/storage";

const LAST_SECTION = SECTIONS.length - 1; // 4 → 5th (last) step
const EMPTY_QUESTIONS = [];

const STEP_MOTION = {
  initial: { opacity: 0, y: 26, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -22, scale: 0.995 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
};

export default function AssessmentPage() {
  const { t } = useTranslation("assessment");
  const {
    state,
    dispatch,
    lang,
    tier,
    visibleBySection,
    progress,
    resumable,
    setResumable,
    actions,
  } = useAssessment();

  const [attempted, setAttempted] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const { step, sectionIndex, questionIndex } = state.position;
  const sectionNo = sectionIndex + 1;
  const questions = useMemo(
    () => visibleBySection[sectionIndex] || EMPTY_QUESTIONS,
    [visibleBySection, sectionIndex]
  );

  const langMeta = state.meta.language || lang || "ar";

  // If the restored draft was already submitted, land on the success screen.
  useEffect(() => {
    if (state.status === "submitted") {
      actions.setPosition({ step: "success", sectionIndex: 0, questionIndex: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // Prefill weight + goal carried from the homepage AssessmentSection
  // (drke-home-weight / drke-home-goal) into the full flow, once per session.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    try {
      const homeWeight = sessionStorage.getItem("drke-home-weight");
      const homeGoal = sessionStorage.getItem("drke-home-goal");
      if (homeWeight) {
        const w = Number(homeWeight);
        if (Number.isFinite(w) && w > 0) actions.setAnswer("Q02_02", String(w));
      }
      if (homeGoal) {
        const map = {
          "خسارة الوزن": "lose",
          "Lose weight": "lose",
          "زيادة الوزن": "gain",
          "Gain weight": "gain",
          "الحفاظ على الوزن": "maintain",
          "Maintain weight": "maintain",
        };
        const value = map[homeGoal];
        if (value) actions.setAnswer("Q03_01", value);
      }
      sessionStorage.removeItem("drke-home-weight");
      sessionStorage.removeItem("drke-home-goal");
    } catch { /* ignore storage errors */ }
  }, [actions]);

  const goTo = (s, si = 0, qi = 0) =>
    actions.setPosition({ step: s, sectionIndex: si, questionIndex: qi });

  const onAnswer = (id, value) => {
    actions.setAnswer(id, value);
    if (attempted[id]) setAttempted((p) => ({ ...p, [id]: false }));
  };

  // One step per section — every required question in the section must be valid.
  const sectionValid = useMemo(() => {
    if (questions.length === 0) return true;
    return questions.every(
      (q) => !isRequired(q.id, state) || !validateQuestion(q.id, state.answers[q.id], state)
    );
  }, [questions, state]);

  const canNext = sectionValid;

  const handleBack = () => {
    if (step === "section") {
      if (sectionIndex > 0) {
        goTo("section", sectionIndex - 1, 0);
      } else {
        goTo("intro");
      }
      return;
    }
    if (step === "review") goTo("section", LAST_SECTION, 0);
  };

  const handleNext = () => {
    if (step === "intro") {
      goTo("section", 0, 0);
      return;
    }
    if (step === "section") {
      if (!sectionValid) {
        const next = { ...attempted };
        for (const q of questions) {
          if (isRequired(q.id, state)) next[q.id] = true;
        }
        setAttempted(next);
        return;
      }
      if (sectionIndex < LAST_SECTION) {
        goTo("section", sectionIndex + 1, 0);
      } else {
        goTo("review", 0, 0);
      }
      return;
    }
    // review → handled by ReviewStep onSubmit
  };

  const handleSubmit = async (contactPatch) => {
    setSubmitError(null);
    try {
      const result = await submitAssessment({
        ...state,
        answers: { ...state.answers, Q01_01: SUBJECT_DEFAULT },
        contact: { ...state.contact, ...(contactPatch || {}) },
      });
      const data = result.data || result;
      dispatch({ type: "SUBMIT", referenceNumber: data.referenceNumber, overallTier: data.overallTier, reviewState: data.reviewState, submittedAt: new Date().toISOString() });
      clearDraft();
      actions.setPosition({ step: "success", sectionIndex: 0, questionIndex: 0 });
      try {
        sessionStorage.setItem("drke-register-name", (state.contact?.patientName || state.answers.Q01_03 || "").toString());
        sessionStorage.setItem("drke-register-phone", (state.contact?.patientPhone || state.contact?.handoffPhone || "").toString());
        sessionStorage.setItem("drke-register-assessment", String(data.referenceNumber || ""));
      } catch { /* ignore storage errors */ }
    } catch (error) {
      setSubmitError(error.message || "Unable to submit assessment");
    }
  };

  const onStartOver = () => {
    actions.startOver();
    goTo("intro");
  };

  const onContinue = () => {
    setResumable(false);
  };

  const warnings = useMemo(() => getWarnings(state), [state]);

  if (step === "success") {
    return (
      <div className="aq">
        <Header />
        <main className="aq-main">
          <SuccessScreen
            referenceNumber={state.referenceNumber}
            overallTier={state.overallTier}
            reviewState={state.reviewState}
            onStartOver={onStartOver}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const stepKey = step === "section" ? `section-${sectionIndex}` : step;

  return (
    <div className="aq">
      <Header />
      <main className="aq-main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={stepKey} {...STEP_MOTION}>
            {step === "intro" && (
              <Intro onStart={() => goTo("section", 0, 0)} />
            )}

            {step === "section" && (
              <>
                <ProgressBar
                  sectionNo={sectionNo}
                  progress={progress}
                  tier={tier}
                  lang={langMeta}
                  ariaLive={t("ui.step", { n: sectionNo, total: 5 })}
                />
                <SectionView
                  sectionNo={sectionNo}
                  questions={questions}
                  state={state}
                  onAnswer={onAnswer}
                  errors={attempted}
                  warnings={warnings}
                />
                <StepActions onBack={handleBack} onNext={handleNext} nextDisabled={!canNext} />
              </>
            )}

            {step === "review" && (
              <ReviewStep
                state={state}
                setContact={actions.setContact}
                setAck={actions.setAck}
                onSubmit={handleSubmit}
                submitError={submitError}
                onBack={handleBack}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {resumable && step !== "success" && (
          <ResumeBanner onContinue={onContinue} onStartOver={onStartOver} />
        )}
      </main>
      <Footer />
    </div>
  );
}
