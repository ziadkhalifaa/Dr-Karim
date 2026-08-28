import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { planTemplateController } from "../controllers/plan-template.controller.js";

export function planTemplateRouter() {
  const router = express.Router();
  
  router.use(requireAuth, requireRole("doctor"));
  
  router.get("/", planTemplateController.list);
  router.post("/", planTemplateController.create);
  router.delete("/:id", planTemplateController.delete);
  
  return router;
}
