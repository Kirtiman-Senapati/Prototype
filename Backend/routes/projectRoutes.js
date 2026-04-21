import express from "express";
import { getProjectDetails, getMyProjects } from "../controllers/projectController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(isAuthenticated);
router.get("/my", getMyProjects);
router.get("/:id", getProjectDetails);

export default router;
