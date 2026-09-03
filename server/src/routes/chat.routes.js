import express from "express";
import { chatController } from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Patient routes
router.get("/session", requireAuth, chatController.getOrCreateSession);
router.post("/messages", requireAuth, chatController.patientSend);

// Doctor routes
router.get("/sessions", requireAuth, chatController.listSessions);
router.get("/sessions/:sid/messages", requireAuth, chatController.sessionMessages);
router.post("/sessions/:sid/messages", requireAuth, chatController.doctorReply);

export const chatRouter = router;
