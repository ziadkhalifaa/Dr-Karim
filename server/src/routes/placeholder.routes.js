import { Router } from "express";
import { AppError, ERROR_CODES } from "../utils/errors.js";

export function placeholderRouter(domain) {
  const r = Router();
  const handler = (_req, _res, next) => next(new AppError(501, ERROR_CODES.NOT_IMPLEMENTED, `${domain} domain is not implemented in Phase 2`));
  r.all("/", handler);
  r.all("*", handler);
  return r;
}

export default placeholderRouter;