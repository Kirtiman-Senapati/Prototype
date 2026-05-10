import express from "express";
import {
    getPendingRequests,
    handleRequest,
    getAssignedStudents,
    addTask,
    getTeacherDashboard
} from "../controllers/teacherController.js";
import {
    addMilestone,
    updateMilestone,
    deleteMilestone,
    reviewMilestone,
    addMilestoneComment
} from "../controllers/milestoneController.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(isAuthenticated, authorizeRoles("Supervisor"));

router.get("/dashboard", getTeacherDashboard);
router.get("/requests", getPendingRequests);
router.put("/request/handle", handleRequest);
router.get("/students", getAssignedStudents);
router.post("/task", addTask);

// Milestone routes
router.post("/project/:projectId/milestone", addMilestone);
router.patch("/project/:projectId/milestone/:milestoneId", updateMilestone);
router.delete("/project/:projectId/milestone/:milestoneId", deleteMilestone);
router.patch("/project/:projectId/milestone/:milestoneId/review", reviewMilestone);
router.post("/project/:projectId/milestone/:milestoneId/comment", addMilestoneComment);

export default router;
