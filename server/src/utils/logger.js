// Safe structured logger. NEVER logs request bodies, headers, or PHI.
// Emits one JSON line per event to stdout/stderr for structured ingestion.

function serializeMeta(meta) {
  if (!meta || typeof meta !== "object") return undefined;
  const safe = {};
  for (const [k, v] of Object.entries(meta)) {
    if (k === "body" || k === "headers" || k === "answer" || k === "contact") continue;
    safe[k] = v;
  }
  return safe;
}

function write(level, message, meta) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(serializeMeta(meta) || {}),
  };
  const out = level === "error" ? console.error : console.log;
  out(JSON.stringify(line));
}

export const logger = {
  debug: (m, meta) => write("debug", m, meta),
  info: (m, meta) => write("info", m, meta),
  warn: (m, meta) => write("warn", m, meta),
  error: (m, meta) => write("error", m, meta),
};

export default logger;
