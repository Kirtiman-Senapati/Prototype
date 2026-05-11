import express from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { createSupportRequest } from "../controllers/supportController.js";

const router = express.Router();

// Protected route: only logged in users (students/supervisors) can create requests
router.post("/", isAuthenticated, createSupportRequest);

export default router;
