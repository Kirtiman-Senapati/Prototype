import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js";
import { sendFeedback, getStudentFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

router.use(isAuthenticated);

// Admin and Teacher can send feedback
router.post("/send", authorizeRoles("Admin", "Teacher", "Supervisor"), sendFeedback);

// Get student's feedback timeline. Can be accessed by Student (themself), Admin, or Teacher.
router.get("/student", getStudentFeedback);
router.get("/student/:studentId", getStudentFeedback);

export default router;