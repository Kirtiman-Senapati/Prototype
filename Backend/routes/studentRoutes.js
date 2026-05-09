import express from "express";
import {
    submitProposal,
    getAvailableSupervisors,
    requestSupervisor,
    uploadProjectFile,
    getStudentDashboard,
    upload,
    updateTaskStatus,
    completeProject,
    leaveProjectGroup,
    getPendingInvites,
    respondToInvite,
    respondToInviteByToken
} from "../controllers/studentController.js";
import { submitMilestone, uploadMilestoneFile } from "../controllers/milestoneController.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(isAuthenticated, authorizeRoles("Student"));

router.get("/dashboard", getStudentDashboard);
router.post("/proposal", submitProposal);
router.get("/supervisors", getAvailableSupervisors);
router.post("/request-supervisor", requestSupervisor);
router.post("/upload", upload.single("file"), uploadProjectFile);
router.patch("/task/:taskId/status", updateTaskStatus);
router.put("/complete-project/:projectId", completeProject);
router.patch("/project/leave", leaveProjectGroup);
router.get("/invites", getPendingInvites);
router.post("/invite/:inviteId/respond", respondToInvite);
//route to respond to invite by token ya mail
router.post("/invite/respond-token", respondToInviteByToken);

// Milestone routes
router.post("/project/:projectId/milestone/:milestoneId/submit", uploadMilestoneFile.single("file"), submitMilestone);

export default router;


