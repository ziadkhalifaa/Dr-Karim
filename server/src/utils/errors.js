// Operational error type with HTTP status, machine code, and optional details.
// Thrown by services/controllers; the error handler maps it to a clean JSON response.

export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export const ERROR_CODES = {
  PAYLOAD_INVALID: "PAYLOAD_INVALID",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNKNOWN_QUESTION: "UNKNOWN_QUESTION",
  NOT_VISIBLE_QUESTION: "NOT_VISIBLE_QUESTION",
  INVALID_ANSWER: "INVALID_ANSWER",
  REQUIRED_MISSING: "REQUIRED_MISSING",
  ASSESSMENT_VERSION_MISMATCH: "ASSESSMENT_VERSION_MISMATCH",
  ASSESSMENT_VERSION_UNKNOWN: "ASSESSMENT_VERSION_UNKNOWN",
  DUPLICATE_SUBMISSION: "DUPLICATE_SUBMISSION",
  TENANT_NOT_FOUND: "TENANT_NOT_FOUND",
  NOT_FOUND: "NOT_FOUND",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
  CORS_ORIGIN_NOT_ALLOWED: "CORS_ORIGIN_NOT_ALLOWED",
  DB_UNAVAILABLE: "DB_UNAVAILABLE",
  INTERNAL: "INTERNAL",
};

export function validationError(details) {
  return new AppError(422, ERROR_CODES.VALIDATION_ERROR, "Assessment validation failed", details);
}

export function notFound(message) {
  return new AppError(404, ERROR_CODES.NOT_FOUND, message || "Route not found");
}

export function notImplemented(domain) {
  return new AppError(501, ERROR_CODES.NOT_IMPLEMENTED, `${domain} domain is not implemented in Phase 2`);
}

export default AppError;
