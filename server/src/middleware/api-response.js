// Consistent API response envelopes (architecture §17).

function nowIso() {
  return new Date().toISOString();
}

export function ok(res, status, data) {
  return res.status(status).json({
    success: true,
    data,
    requestId: res.req?.id,
    timestamp: nowIso(),
  });
}

export function fail(res, status, code, message, details) {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
    requestId: res.req?.id,
    timestamp: nowIso(),
  });
}
