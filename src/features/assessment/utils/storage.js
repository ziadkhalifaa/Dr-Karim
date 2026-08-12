// Safe localStorage wrapper for the assessment draft (spec §11).
// Storage key uses the session id: drke.assessment.<sessionId>.
// A pointer key tracks the latest draft for resume detection.

const POINTER_KEY = "drke.assessment.current";

export function draftKeyFor(sessionId) {
  return `drke.assessment.${sessionId}`;
}

function read(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / private-mode — persistence is best-effort */
  }
}

function remove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function saveDraft(state) {
  write(POINTER_KEY, state.meta.sessionId);
  write(draftKeyFor(state.meta.sessionId), JSON.stringify(state));
}

export function loadDraft() {
  const id = read(POINTER_KEY);
  if (!id) return null;
  const raw = read(draftKeyFor(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  const id = read(POINTER_KEY);
  if (id) remove(draftKeyFor(id));
  remove(POINTER_KEY);
}

// Kept read-only for the report / testing: list stored draft keys.
export function listDraftKeys() {
  const keys = [];
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.indexOf("drke.assessment.") === 0) keys.push(k);
    }
  } catch {
    /* ignore */
  }
  return keys;
}

export const DRAFT_POINTER_KEY = POINTER_KEY;