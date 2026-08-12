import { AppError, ERROR_CODES } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { fail } from "./api-response.js";
import env from "../config/env.js";

const KNOWN_SEQ_ERRORS = [
  "SequelizeUniqueConstraintError",
  "SequelizeConnectionError",
  "SequelizeConnectionRefusedError",
  "SequelizeConnectionTimedOutError",
  "SequelizeHostNotFoundError",
  "SequelizeAccessDeniedError",
  "SequelizeForeignKeyConstraintError",
  "SequelizeValidationError",
];

export function errorHandler(err, req, res, _next) {
  const requestId = req.id;
  let status = 500;
  let code = ERROR_CODES.INTERNAL;
  let message = "Internal server error";
  let details;

  if (err instanceof AppError && err.isOperational) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    code = ERROR_CODES.PAYLOAD_INVALID;
    message = "Malformed JSON body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    code = ERROR_CODES.PAYLOAD_TOO_LARGE;
    message = "Payload too large";
  } else if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors?.[0]?.path || "unknown";
    if (field === "session_token") {
      status = 409;
      code = ERROR_CODES.DUPLICATE_SUBMISSION;
      message = "This assessment session was already submitted";
    } else if (field === "reference_number") {
      status = 409;
      code = ERROR_CODES.DUPLICATE_SUBMISSION;
      message = "Reference number collision; please retry";
    } else {
      status = 409;
      code = ERROR_CODES.DUPLICATE_SUBMISSION;
      message = "Duplicate record";
    }
  } else if (err.name === "SequelizeConnectionError" || err.name === "SequelizeConnectionRefusedError" || err.name === "SequelizeConnectionTimedOutError" || err.name === "SequelizeHostNotFoundError" || err.name === "SequelizeAccessDeniedError") {
    status = 503;
    code = ERROR_CODES.DB_UNAVAILABLE;
    message = "Database unavailable";
  } else if (err.name === "SequelizeForeignKeyConstraintError") {
    status = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = "Invalid reference";
  } else if (err.name === "SequelizeValidationError") {
    status = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = "Invalid data";
  }

  if (status >= 500) {
    logger.error("unhandled_error", {
      requestId,
      errorMessage: err.message,
      stack: env.IS_PRODUCTION ? undefined : err.stack,
      errorName: err.name,
      knownSeq: KNOWN_SEQ_ERRORS.includes(err.name),
    });
  } else {
    logger.warn("client_error", { requestId, status, code, errorMessage: err.message });
  }

  if (res.headersSent) return undefined;
  return fail(res, status, code, message, details);
}

export default errorHandler;
