import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth.js";
import * as contentController from "../controllers/content.controller.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, "../../uploads/covers");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cover-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

const router = Router();

// ===== PUBLIC =====
router.get("/articles", contentController.listArticles);
router.get("/articles/:slug", contentController.getArticle);

// ===== DOCTOR (protected) =====
router.get("/doctor/articles", authenticateOptional, requireAuth, requireRole("doctor", "admin"), contentController.listAllArticles);
router.post("/doctor/articles", authenticateOptional, requireAuth, requireRole("doctor", "admin"), contentController.createArticle);
router.patch("/doctor/articles/:id", authenticateOptional, requireAuth, requireRole("doctor", "admin"), contentController.updateArticle);
router.delete("/doctor/articles/:id", authenticateOptional, requireAuth, requireRole("doctor", "admin"), contentController.deleteArticle);
router.post("/doctor/articles/:id/cover", authenticateOptional, requireAuth, requireRole("doctor", "admin"), upload.single("cover"), contentController.uploadCover);
router.post("/doctor/services/:id/cover", authenticateOptional, requireAuth, requireRole("doctor", "admin"), upload.single("cover"), contentController.uploadServiceCover);

// ===== LEGACY (compatibility) =====
router.get("/", contentController.getAllContent);
router.get("/:slug", contentController.getContentBySlug);

export default router;
