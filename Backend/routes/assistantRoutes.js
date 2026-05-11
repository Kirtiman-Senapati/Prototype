import express from "express";
import { chatWithAssistant } from "../controllers/assistantController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/chat", isAuthenticated, chatWithAssistant);

export default router;
