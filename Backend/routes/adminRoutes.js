import express from "express";
import {
    getAdminDashboard,
    getAllUsers,
    deleteUser,
    getAllProjects
} from "../controllers/adminController.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(isAuthenticated, authorizeRoles("Admin"));

router.get("/dashboard", getAdminDashboard);
router.get("/users", getAllUsers);
router.delete("/user/:id", deleteUser);
router.get("/projects", getAllProjects);

export default router;