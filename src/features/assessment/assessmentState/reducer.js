// Assessment state — pure reducer over the spec §7 JSON shape.
// The `answers` map is the single source of truth; flags / bmi / tier are
// DERIVED (never stored as patient truth).

export function createSessionId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getInitialState(lang = "ar") {
  return {
meta: {
      sessionId: createSessionId(),
      assessmentVersion: "1.1",
      language: lang,
      startedAt: new Date().toISOString(),
      lastSavedAt: null,
      status: "draft",
      referenceNumber: null,
    overallTier: null,
    reviewState: null,
    },
    answers: {},
    acknowledgements: { accurate: false, noDiagnosis: false, urgent: false },
    contact: {
      patientName: "",
      contactPerson: { name: "", relationship: "", isGuardian: false },
      handoffPhone: "",
      patientPhone: "",
      preference: "whatsapp",
      email: "",
      bestTime: "",
      consent: false,
    },
    status: "draft",
    submittedAt: null,
    referenceNumber: null,
    position: { step: "intro", sectionIndex: 0, questionIndex: 0 },
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case "ANSWER": {
      const answers = { ...state.answers, [action.id]: action.value };
      return { ...state, answers, meta: { ...state.meta, lastSavedAt: null } };
    }
    case "SET_ACK":
      return {
        ...state,
        acknowledgements: {
          ...state.acknowledgements,
          [action.key]: action.value,
        },
      };
    case "SET_POSITION":
      return { ...state, position: action.position };
    case "SET_CONTACT":
      return { ...state, contact: { ...state.contact, ...action.patch } };
    case "SET_CONTACT_PERSON":
      return {
        ...state,
        contact: {
          ...state.contact,
          contactPerson: { ...state.contact.contactPerson, ...action.patch },
        },
      };
    case "SET_LANGUAGE":
      return {
        ...state,
        meta: { ...state.meta, language: action.lang },
      };
    case "SUBMIT":
      return {
        ...state,
        status: "submitted",
        submittedAt: action.submittedAt,
        referenceNumber: action.referenceNumber,
        overallTier: action.overallTier || null,
        reviewState: action.reviewState || null,
        meta: {
          ...state.meta,
          status: "submitted",
          referenceNumber: action.referenceNumber,
        },
      };
    case "RESTORE":
      return action.state;
    case "RESET":
      return getInitialState(action.lang);
    default:
      return state;
  }
}



