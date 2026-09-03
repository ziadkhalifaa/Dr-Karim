import express from "express";
import { testimonialController } from "../controllers/testimonial.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Doctor — full CRUD (auth enforced in controller via role check)
router.get("/", requireAuth, testimonialController.listAll);
router.post("/", requireAuth, testimonialController.create);
router.put("/:id", requireAuth, testimonialController.update);
router.delete("/:id", requireAuth, testimonialController.remove);

export const testimonialRouter = router;
