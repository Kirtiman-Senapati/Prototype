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
    addSupervisor
} from "../controllers/adminController.js";
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

export default router;