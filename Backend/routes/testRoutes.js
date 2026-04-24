import express from "express";
import { runDeadlineChecker } from "../cron/deadlineChecker.js";

const router = express.Router();

router.get("/run-deadline-checker", async (req, res) => {
    try {
        await runDeadlineChecker();
        res.json({ success: true, message: "Deadline checker executed" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;