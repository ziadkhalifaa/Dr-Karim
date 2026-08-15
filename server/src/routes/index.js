import express from "express";
import { healthRouter } from "./health.routes.js";
import contentRouter from "./content.routes.js";
import publicRouter from "./public.routes.js";
import { assessmentRouter } from "./assessment.routes.js";
import { placeholderRouter } from "./placeholder.routes.js";
import { authRouter } from "./auth.routes.js";
import { doctorReviewRouter } from "./doctor-review.routes.js";
import { nutritionPlanRouter, exercisePlanRouter, patientPlanRouter } from "./plan.routes.js";
import { nutritionPlanVersionRouter, exercisePlanVersionRouter } from "./plan-version.routes.js";
import { nutritionPlanController, exercisePlanController } from "../controllers/plan.controller.js";
import { careCycleRouter } from "./care-cycle.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { phase5Router } from "./phase5.routes.js";
import { careRouter } from "./care.routes.js";
import { progressRouter } from "./progress.routes.js";
import { patientRouter } from "./patient.routes.js";
import { foodRouter } from "./food.routes.js";
import packageRouter from "./package.routes.js";
import { authenticateOptional, requireTenantAccess } from "../middleware/auth.js";
import { tenantResolver } from "../middleware/tenant.js";

export function routes(app) {
  const api = express.Router();
  api.use("/content", contentRouter);
  api.use("/public", publicRouter);
  api.use("/monetization/packages", packageRouter);

  api.use("/health", healthRouter());
  api.use("/auth", authRouter());
  api.use(authenticateOptional);
  // Public assessment intake: tenant is resolved anonymously so visitors can
  // submit without an account; authenticated callers are still handled.
  api.use("/assessment", tenantResolver, assessmentRouter());
  api.use(requireTenantAccess);
  api.use("/doctor/reviews", doctorReviewRouter());
  api.use("/nutrition-plans", nutritionPlanRouter());
  api.use("/exercise-plans", exercisePlanRouter());
  api.use("/nutrition-plan-versions", nutritionPlanVersionRouter());
  api.use("/exercise-plan-versions", exercisePlanVersionRouter());
  api.use("/patients", patientPlanRouter(nutritionPlanController));
  api.get("/patients/:id/exercise-plan", authenticateOptional, requireTenantAccess, exercisePlanController.patient);
  api.use(careCycleRouter());
  api.use(paymentRouter());
  api.use(phase5Router());
  api.use(careRouter());
  api.use(progressRouter());
  api.use("/patients", patientRouter());
  api.use("/food", foodRouter());
  // /services is now served dynamically via /public/services
  // api.use("/services", placeholderRouter("services"));
  api.use("/appointments", placeholderRouter("appointments"));
  app.use("/api/v1", api);
}

export default routes;
