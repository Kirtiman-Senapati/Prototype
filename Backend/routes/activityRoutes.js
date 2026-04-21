import express from "express";
import { getActivities, markActivitiesRead, clearActivities } from "../controllers/activityController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getActivities);
router.patch("/read", markActivitiesRead);
router.delete("/clear", clearActivities);

export default router;
