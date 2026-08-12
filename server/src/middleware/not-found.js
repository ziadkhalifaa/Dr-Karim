import { AppError } from "../utils/errors.js";

export function notFound(req, _res, next) {
  next(new AppError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl.split("?")[0]}`));
}

export default notFound;
