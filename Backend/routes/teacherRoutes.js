import express from "express";
import {
    getPendingRequests,
    handleRequest,
    getAssignedStudents,
    addTask,
    getTeacherDashboard
} from "../controllers/teacherController.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(isAuthenticated, authorizeRoles("Supervisor"));

router.get("/dashboard", getTeacherDashboard);
router.get("/requests", getPendingRequests);
router.put("/request/handle", handleRequest);
router.get("/students", getAssignedStudents);
router.post("/task", addTask);

export default router;
