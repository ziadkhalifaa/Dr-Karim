import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAssessment } from "../hooks/useAssessment";
import { useIsMobile } from "../hooks/useMediaQuery";
import { SECTIONS } from "../data/sections";
import AssessmentHeader from "../components/AssessmentHeader";
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

export default function AssessmentPage() {
  const { t } = useTranslation("assessment");
  const isMobile = useIsMobile();
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

  const sectionValid = useMemo(() => {
    return !questions.some((q) => {
      if (!isRequired(q.id, state)) return false;
      return Boolean(validateQuestion(q.id, state.answers[q.id], state));
    });
  }, [questions, state]);

  const currentQuestionValid = useMemo(() => {
    if (!currentQuestion) return true;
    if (!isRequired(currentQuestion.id, state)) return true;
    return !validateQuestion(currentQuestion.id, state.answers[currentQuestion.id], state);
  }, [currentQuestion, state]);

  // Desktop: validate whole section. Mobile: validate current question.
  const canNext = isMobile ? currentQuestionValid : sectionValid;

  const handleBack = () => {
    if (step === "section") {
      if (isMobile && questionIndex > 0) {
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
      if (isMobile) {
        if (!currentQuestionValid) {
          setAttempted((p) => ({ ...p, [currentQuestion.id]: true }));
          return;
        }
        if (questionIndex < questions.length - 1) {
          goTo("section", sectionIndex, questionIndex + 1);
          return;
        }
      } else if (!sectionValid) {
        const invalid = questions.find((q) => isRequired(q.id, state) && validateQuestion(q.id, state.answers[q.id], state));
        if (invalid) setAttempted((p) => ({ ...p, [invalid.id]: true }));
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

const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const result = await submitAssessment(state);
      const data = result.data || result;
      dispatch({ type: "SUBMIT", referenceNumber: data.referenceNumber, overallTier: data.overallTier, reviewState: data.reviewState, submittedAt: new Date().toISOString() });
      clearDraft();
      actions.setPosition({ step: "success", sectionIndex: 0, questionIndex: 0 });
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

  return (
    <div className="aq">
      <Header />
      <main className="aq-main">
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
              isMobile={isMobile}
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
            setContactPerson={actions.setContactPerson}
            onSubmit={handleSubmit}
            submitError={submitError}
            onBack={handleBack}
          />
        )}

        {resumable && step !== "success" && (
          <ResumeBanner onContinue={onContinue} onStartOver={onStartOver} />
        )}
      </main>
      <Footer />
    </div>
  );
}
