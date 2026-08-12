// useAssessment — wires the reducer, debounced localStorage persistence,
// and the derived values (flags, tier, bmi, progress) used across the UI.

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { reducer, getInitialState } from "../assessmentState/reducer";
import {
  visibleQuestionsBySection,
  progressPercent,
  getBmi,
  getFlags,
  getOverallTier,
} from "../assessmentState/selectors";
import { loadDraft, saveDraft, clearDraft } from "../utils/storage";

const DEBOUNCE_MS = 500;

function initFromStorage(lang) {
  const draft = loadDraft();
  if (draft) return draft;
  return getInitialState(lang);
}

export function useAssessment() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;

  const [state, dispatch] = useReducer(reducer, lang, initFromStorage);
  const [resumable, setResumable] = useState(
    () => loadDraft() !== null
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  // Keep meta.language in sync with the app language.
  useEffect(() => {
    if (state.meta.language !== lang) dispatch({ type: "SET_LANGUAGE", lang });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Debounced persistence on every state change. Empty fresh drafts are not
  // written, so a first-time reload does not show a phantom resume banner.
  useEffect(() => {
    const s = stateRef.current;
    const hasContent =
      Object.keys(s.answers).length > 0 ||
      s.status === "submitted" ||
      s.position.step !== "intro" ||
      s.contact.handoffPhone !== "" ||
      s.acknowledgements.accurate;
    if (!hasContent) return;
    const timer = window.setTimeout(() => {
      saveDraft({
        ...stateRef.current,
        meta: {
          ...stateRef.current.meta,
          lastSavedAt: new Date().toISOString(),
        },
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const setAnswer = useMemo(
    () => (id, value) => dispatch({ type: "ANSWER", id, value }),
    []
  );
  const setAck = useMemo(
    () => (key, value) => dispatch({ type: "SET_ACK", key, value }),
    []
  );
  const setContact = useMemo(
    () => (patch) => dispatch({ type: "SET_CONTACT", patch }),
    []
  );
  const setContactPerson = useMemo(
    () => (patch) => dispatch({ type: "SET_CONTACT_PERSON", patch }),
    []
  );
  const setPosition = useMemo(
    () => (position) => dispatch({ type: "SET_POSITION", position }),
    []
  );
  const startOver = useMemo(
    () => () => {
      clearDraft();
      dispatch({ type: "RESET", lang: stateRef.current.meta.language });
      setResumable(false);
    },
    []
  );
  const loadFromDraft = useMemo(
    () => () => {
      const draft = loadDraft();
      if (draft) {
        dispatch({ type: "RESTORE", state: draft });
        setResumable(false);
        return true;
      }
      return false;
    },
    []
  );

  const flags = useMemo(() => getFlags(state), [state]);
  const tier = useMemo(() => getOverallTier(state), [state]);
  const bmi = useMemo(() => getBmi(state), [state]);
  const visibleBySection = useMemo(
    () => visibleQuestionsBySection(state),
    [state]
  );
  const progress = useMemo(() => progressPercent(state), [state]);

  return {
    state,
    dispatch,
    lang,
    t,
    resumable,
    setResumable,
    flags,
    tier,
    bmi,
    visibleBySection,
    progress,
    actions: {
      setAnswer,
      setAck,
      setContact,
      setContactPerson,
      setPosition,
      startOver,
      loadFromDraft,
    },
  };
}