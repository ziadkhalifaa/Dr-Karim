import express from "express";
import { couponController } from "../controllers/coupon.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Patient-accessible: validate a coupon code (still needs auth to prevent abuse)
router.post("/validate", requireAuth, couponController.validate);

// Doctor CRUD
router.get("/", requireAuth, couponController.list);
router.post("/", requireAuth, couponController.create);
router.put("/:id", requireAuth, couponController.update);
router.delete("/:id", requireAuth, couponController.remove);

export const couponRouter = router;
