import { Router } from "express";
import * as contentController from "../controllers/content.controller.js";

const router = Router();

router.get("/", contentController.getAllContent);
router.get("/:slug", contentController.getContentBySlug);

export default router;
