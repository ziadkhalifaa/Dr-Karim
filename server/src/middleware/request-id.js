import crypto from "node:crypto";

// Assigns a correlation/request id (uses X-Request-Id if provided, else generates).
export function requestId(req, res, next) {
  const incoming = req.headers["x-request-id"];
  const id = incoming && /^[A-Za-z0-9-]{1,128}$/u.test(incoming) ? incoming : crypto.randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}
