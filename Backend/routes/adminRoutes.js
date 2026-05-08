import express from "express";
import {
    getAdminDashboard,
    getAllUsers,
    deleteUser,
    getAllProjects,
    getUnassignedProjects,
    getSupervisors,
    assignSupervisor,
    updateProjectStatus,
    updateProjectDeadline,
    addStudent,
    addSupervisor,
    updateUserDetails,
    addTaskAdmin,
    triggerReminders,
    sendManualReminder
} from "../controllers/adminController.js";
import {
    addMilestone,
    updateMilestone,
    deleteMilestone,
    reviewMilestone
} from "../controllers/milestoneController.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(isAuthenticated, authorizeRoles("Admin"));

router.get("/dashboard", getAdminDashboard);
router.get("/users", getAllUsers);
router.delete("/user/:id", deleteUser);
router.get("/projects", getAllProjects);
router.get("/unassigned-projects", getUnassignedProjects);
router.get("/supervisors", getSupervisors);
router.patch("/assign-supervisor/:id", assignSupervisor);
router.patch("/project/:id/status", updateProjectStatus);
router.put("/project/:id/deadline", updateProjectDeadline);
router.post("/student", addStudent);
router.post("/supervisor", addSupervisor);
router.patch("/user/:id", updateUserDetails);
router.post("/task", addTaskAdmin);
router.post("/trigger-reminders", triggerReminders);
router.post("/project/:id/remind", sendManualReminder);

// Milestone routes
router.post("/project/:projectId/milestone", addMilestone);
router.patch("/project/:projectId/milestone/:milestoneId", updateMilestone);
router.delete("/project/:projectId/milestone/:milestoneId", deleteMilestone);
router.patch("/project/:projectId/milestone/:milestoneId/review", reviewMilestone);

export default router;