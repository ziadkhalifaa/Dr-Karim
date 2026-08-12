const buckets = new Map();

export function simpleRateLimit({ windowMs = 60000, max = 10, key = (req) => req.ip } = {}) {
  return (req, res, next) => {
    const now = Date.now(); const id = key(req); const current = buckets.get(id);
    const bucket = !current || now - current.startedAt >= windowMs ? { startedAt: now, count: 0 } : current;
    bucket.count += 1; buckets.set(id, bucket);
    if (bucket.count > max) return res.status(429).json({ success: false, error: { code: "AUTH_RATE_LIMITED", message: "Too many attempts" }, requestId: req.id, timestamp: new Date().toISOString() });
    return next();
  };
}
