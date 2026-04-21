import express from "express";
import {
    submitProposal,
    getAvailableSupervisors,
    requestSupervisor,
    uploadProjectFile,
    getStudentDashboard,
    upload,
    updateTaskStatus
} from "../controllers/studentController.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(isAuthenticated, authorizeRoles("Student"));

router.get("/dashboard", getStudentDashboard);
router.post("/proposal", submitProposal);
router.get("/supervisors", getAvailableSupervisors);
router.post("/request-supervisor", requestSupervisor);
router.post("/upload", upload.single("file"), uploadProjectFile);
router.patch("/task/:taskId/status", updateTaskStatus);

export default router;


