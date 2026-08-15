import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { foodController } from "../controllers/food.controller.js";

export function foodRouter() {
  const router = express.Router();
  router.use(requireAuth);
  
  router.get("/", foodController.list);
  
  return router;
}

export default foodRouter;
