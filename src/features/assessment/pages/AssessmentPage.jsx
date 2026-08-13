import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { useAssessment } from "../hooks/useAssessment";
import { SECTIONS } from "../data/sections";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Intro from "../components/Intro";
import ResumeBanner from "../components/ResumeBanner";
import ProgressBar from "../components/ProgressBar";
import SectionView from "../components/SectionView";
import StepActions from "../components/StepActions";
import SafetyScreen from "../components/SafetyScreen";
import ContactScreen from "../components/ContactScreen";
import SuccessScreen from "../components/SuccessScreen";
import { isRequired } from "../logic/conditions";
import { validateQuestion, getWarnings } from "../validation/validate";
import { submitAssessment } from "../api/assessmentApi.js";
import { clearDraft } from "../utils/storage";

const LAST_SECTION = SECTIONS.length - 1; // 8 → 9th (last question) section
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
    flags,
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
  const currentQuestion = questions[Math.min(questionIndex, Math.max(0, questions.length - 1))];

  const langMeta = state.meta.language || lang || "ar";

  // If the restored draft was already submitted, land on the success screen.
  useEffect(() => {
    if (state.status === "submitted") {
      actions.setPosition({ step: "success", sectionIndex: 0, questionIndex: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // Bug fix: prefill contact.patientName from Q01_03 once when entering the
  // Contact step, only if it is still empty. One-shot (ref) — user edits are
  // never overwritten and there is no continuous force-sync afterwards.
  const namePrefilled = useRef(false);
  useEffect(() => {
    if (step !== "contact" || namePrefilled.current) return;
    namePrefilled.current = true;
    const fromQ01 = (state.answers.Q01_03 || "").trim();
    if (!fromQ01) return;
    if ((state.contact.patientName || "").trim() !== "") return;
    actions.setContact({ patientName: fromQ01 });
  }, [step, state.answers.Q01_03, state.contact.patientName, actions]);

  const goTo = (s, si = 0, qi = 0) =>
    actions.setPosition({ step: s, sectionIndex: si, questionIndex: qi });

  const onAnswer = (id, value) => {
    actions.setAnswer(id, value);
    if (attempted[id]) setAttempted((p) => ({ ...p, [id]: false }));
  };

  // One question per step on every screen size — focused, fast to answer.
  const currentQuestionValid = useMemo(() => {
    if (!currentQuestion) return true;
    if (!isRequired(currentQuestion.id, state)) return true;
    return !validateQuestion(currentQuestion.id, state.answers[currentQuestion.id], state);
  }, [currentQuestion, state]);

  const canNext = currentQuestionValid;

  const handleBack = () => {
    if (step === "section") {
      if (questionIndex > 0) {
        goTo("section", sectionIndex, questionIndex - 1);
      } else if (sectionIndex > 0) {
        goTo("section", sectionIndex - 1, 0);
      } else {
        goTo("intro");
      }
      return;
    }
    if (step === "safety") goTo("section", LAST_SECTION, 0);
    if (step === "contact") goTo("safety");
  };

  const handleNext = () => {
    if (step === "intro") {
      goTo("section", 0, 0);
      return;
    }
    if (step === "section") {
      if (!currentQuestionValid) {
        if (currentQuestion) setAttempted((p) => ({ ...p, [currentQuestion.id]: true }));
        return;
      }
      if (questionIndex < questions.length - 1) {
        goTo("section", sectionIndex, questionIndex + 1);
        return;
      }
      if (sectionIndex < LAST_SECTION) {
        goTo("section", sectionIndex + 1, 0);
      } else {
        goTo("safety", 0, 0);
      }
      return;
    }
    if (step === "safety") goTo("contact", 0, 0);
    // contact → submit handled by ContactScreen's onSubmit
  };

  const handleSubmit = async (contactPatch) => {
    setSubmitError(null);
    try {
      const result = await submitAssessment({
        ...state,
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
          <SuccessScreen referenceNumber={state.referenceNumber} overallTier={state.overallTier} reviewState={state.reviewState} />
        </main>
        <Footer />
      </div>
    );
  }

  const stepKey = step === "section" ? `section-${sectionIndex}-${questionIndex}` : step;

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
                  ariaLive={t("ui.step", { n: sectionNo })}
                />
                <SectionView
                  sectionNo={sectionNo}
                  questions={questions}
                  state={state}
                  mobileIndex={questionIndex}
                  onAnswer={onAnswer}
                  errors={attempted}
                  warnings={warnings}
                />
                <StepActions onBack={handleBack} onNext={handleNext} nextDisabled={!canNext} />
              </>
            )}

            {step === "safety" && (
              <SafetyScreen
                state={state}
                flags={flags}
                onAck={actions.setAck}
                onNext={() => goTo("contact", 0, 0)}
                onBack={handleBack}
              />
            )}

            {step === "contact" && (
              <ContactScreen
                state={state}
                setContact={actions.setContact}
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
