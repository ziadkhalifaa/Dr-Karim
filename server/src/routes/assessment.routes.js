import { Router } from "express";
import { assessmentController } from "../controllers/assessment.controller.js";

export function assessmentRouter() {
  const r = Router();
  r.post("/submit", assessmentController.submit);
  return r;
}

export default assessmentRouter;