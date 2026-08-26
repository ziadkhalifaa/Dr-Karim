import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth.js";
import * as storeController from "../controllers/store.controller.js";
import { productsDir, reviewsDir } from "../config/uploads.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

const reviewStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, reviewsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `review-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const reviewUpload = multer({
  storage: reviewStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

const router = Router();

// ===== PUBLIC (tenant resolved from header, like /assessment) =====
router.get("/products", storeController.publicProducts);
router.get("/products/:slug", storeController.publicProduct);
router.get("/categories", storeController.publicCategories);
router.post("/checkout", requireAuth, requireRole("patient"), storeController.checkout);
router.post("/orders/:id/payment", requireAuth, requireRole("patient"), storeController.submitPayment);

// ===== PATIENT: my orders =====
router.get("/patient/orders", requireAuth, requireRole("patient"), storeController.patientOrders);
router.get("/patient/orders/:id", requireAuth, requireRole("patient"), storeController.patientOrderDetail);

// ===== REVIEWS (public list; submit by verified buyers only) =====
router.get("/products/:slug/reviews", storeController.getReviews);
router.post("/products/:slug/reviews", authenticateOptional, requireRole("patient"), storeController.postReview);
router.post("/reviews/images", authenticateOptional, requireRole("patient"), reviewUpload.array("images", 6), storeController.uploadReviewImages);

// ===== DOCTOR (protected) =====
const doc = [authenticateOptional, requireAuth, requireRole("doctor", "admin")];
router.get("/doctor/categories", ...doc, storeController.doctorCategories);
router.post("/doctor/categories", ...doc, storeController.createCategory);
router.patch("/doctor/categories/:id", ...doc, storeController.updateCategory);
router.delete("/doctor/categories/:id", ...doc, storeController.deleteCategory);

router.get("/doctor/products", ...doc, storeController.doctorProducts);
router.post("/doctor/products", ...doc, storeController.createProduct);
router.patch("/doctor/products/:id", ...doc, storeController.updateProduct);
router.delete("/doctor/products/:id", ...doc, storeController.deleteProduct);
router.post("/doctor/products/:id/images", ...doc, upload.single("image"), storeController.uploadProductImage);

router.get("/doctor/orders", ...doc, storeController.doctorOrders);
router.get("/doctor/orders/:id", ...doc, storeController.doctorOrder);
router.patch("/doctor/orders/:id/status", ...doc, storeController.updateOrderStatus);

router.get("/doctor/payments", ...doc, storeController.doctorPayments);
router.post("/doctor/payments/:id/review", ...doc, storeController.reviewPayment);

router.get("/doctor/reviews", ...doc, storeController.doctorReviews);
router.post("/doctor/reviews/:id/reply", ...doc, storeController.doctorReplyReview);
router.delete("/doctor/reviews/:id", ...doc, storeController.deleteReview);

export default router;
