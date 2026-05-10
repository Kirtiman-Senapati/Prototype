import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";
import { User } from "../models/user.js";
import { getProjectTargetUsers } from "../utils/getProjectTargetUsers.js";
import { logActivity } from "../utils/activityLogger.js";
import { getIo } from "../utils/socket.js";
import { emitRefresh } from "../utils/socketEvents.js";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";

// Multer storage for milestone submissions
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = /pdf|doc|docx|ppt|pptx|zip|rar/;

    const extname = allowedExtensions.test(
        path.extname(file.originalname).toLowerCase()
    );

    const mimetype =
        file.mimetype === "application/pdf" ||
        file.mimetype.includes("word") ||
        file.mimetype.includes("presentation") ||
        file.mimetype.includes("zip") ||
        file.mimetype.includes("compressed");

    if (extname && mimetype) {
        return cb(null, true);
    }

    cb(
        new ErrorHandler(
            "Only PDF, DOCX, PPT, ZIP files are allowed",
            400
        )
    );
};

export const uploadMilestoneFile = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter
});

// Helper function to recalculate progress
const recalculateProgress = (project) => {
    if (!project.milestones || project.milestones.length === 0) return 0;
    const approvedCount = project.milestones.filter(m => m.status === "Approved").length;
    return Math.round((approvedCount / project.milestones.length) * 100);
};

// @desc    Add a new milestone
// @route   POST /teacher/project/:projectId/milestone
// @access  Teacher/Admin
export const addMilestone = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { title, description, deadline } = req.body;

    const project = await Project.findById(projectId).populate("student").populate("members");
    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (req.user.role === "Supervisor" && project.supervisor?.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized: Not the supervisor for this project", 403));
    }

    const newId = new mongoose.Types.ObjectId();
    const newMilestone = {
        _id: newId,
        title,
        description,
        deadline,
        status: "Pending",
        assignedByRole: req.user.role.toLowerCase(),
        assignedByName: req.user.name
    };

    project.milestones.push(newMilestone);
    project.workspaceItems.push({
        ...newMilestone,
        type: "phase",
        assignedByRole: req.user.role.toLowerCase(),
        assignedByName: req.user.name
    });

    project.progress = recalculateProgress(project);
    await project.save();

    // Fetch Admins for Event Routing shift to getProjectTargetUsers helper function
    //Added helper in Notification and fixed the logic of targetUsers
    const targetUsers = await getProjectTargetUsers(project, [
        req.user._id,
    ]);

    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: "MILESTONE_ADDED",
        message: `**${req.user.name}** added a new milestone "**${title}**" to the project "**${project.title}**"`,
        details: description,
        relatedProject: project._id,
        priority: "high"
    });

    const io = getIo();
    if (io) emitRefresh(io);

    res.status(201).json({
        success: true,
        message: "Milestone added successfully",
        project
    });
});

// @desc    Update milestone (Edit details)
// @route   PATCH /teacher/project/:projectId/milestone/:milestoneId
// @access  Teacher/Admin
export const updateMilestone = asyncHandler(async (req, res, next) => {
    const { projectId, milestoneId } = req.params;
    const { remarks } = req.body;
    const { title, description, deadline } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (req.user.role === "Supervisor" && project.supervisor?.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 403));
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) return next(new ErrorHandler("Milestone not found", 404));

    if (title) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (deadline) milestone.deadline = deadline;

    // Dual update for workspaceItems
    const workspaceItem = project.workspaceItems.id(milestoneId);
    if (workspaceItem) {
        if (title) workspaceItem.title = title;
        if (description !== undefined) workspaceItem.description = description;
        if (deadline) workspaceItem.deadline = deadline;
    }

    await project.save();

    const io = getIo();
    if (io) emitRefresh(io);

    res.status(200).json({
        success: true,
        message: "Milestone updated successfully",
        project
    });
});

// @desc    Delete milestone
// @route   DELETE /teacher/project/:projectId/milestone/:milestoneId
// @access  Teacher/Admin
export const deleteMilestone = asyncHandler(async (req, res, next) => {
    const { projectId, milestoneId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (req.user.role === "Supervisor" && project.supervisor?.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 403));
    }

    project.milestones.pull(milestoneId);
    
    const workspaceItem = project.workspaceItems.id(milestoneId);
    if (workspaceItem) project.workspaceItems.pull(milestoneId);

    project.progress = recalculateProgress(project);
    await project.save();

    const io = getIo();
    if (io) emitRefresh(io);

    res.status(200).json({
        success: true,
        message: "Milestone deleted successfully",
        project
    });
});

// @desc    Student submits file for a milestone
// @route   POST /student/project/:projectId/milestone/:milestoneId/submit
// @access  Student
export const submitMilestone = asyncHandler(async (req, res, next) => {
    const { projectId, milestoneId } = req.params;

    const project = await Project.findById(projectId).populate("supervisor");
    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (project.student.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 403));
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) return next(new ErrorHandler("Milestone not found", 404));

    if (milestone.status === "Approved") {
        return next(new ErrorHandler("This milestone is already approved.", 400));
    }

    const { remarks } = req.body;
    let fileData = null;

    if (req.file) {
        fileData = {
            filename: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            type: "Document",
            uploadedBy: req.user._id
        };
        milestone.files.push(fileData);
    }
    
    milestone.status = "In Review";
    milestone.submittedAt = new Date();
    milestone.studentRemarks = remarks || "";
    const commentEntry = {
        user: req.user._id,
        name: req.user.name,
        role: req.user.role,
        message: remarks || "Submitted milestone work.",
        actionType: "SUBMITTED"
    };

    milestone.comments.push(commentEntry);

    const workspaceItem = project.workspaceItems.id(milestoneId);
    if (workspaceItem) 
    {
        workspaceItem.status = "In Review";
        workspaceItem.studentRemarks = remarks || "";
        workspaceItem.submittedAt = new Date();
        workspaceItem.comments.push(commentEntry);

        if (req.file && fileData) 
        {
            workspaceItem.files.push(fileData);
        }
    }
    await project.save();

    //Added helper in Notification and fixed the logic of targetUsers
    const targetUsers = await getProjectTargetUsers(project);
    
    const io = getIo();

    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: "MILESTONE_SUBMITTED",
        message: `**${req.user.name}** submitted work for the milestone "**${milestone.title}**"`,
        relatedProject: project._id,
        priority: "medium"
    });


    if (io) {
    emitRefresh(io);

    io.emit("newActivity", {
        actionType: "MILESTONE_SUBMITTED",
        message: `${req.user.name} submitted milestone work`,
        relatedProject: project._id,
        createdAt: new Date(),
    });
    }

    res.status(200).json({
        success: true,
        message: "Milestone submitted for review successfully",
        project
    });
});

// @desc    Teacher/Admin reviews milestone
// @route   PATCH /teacher/project/:projectId/milestone/:milestoneId/review
// @access  Teacher/Admin
export const reviewMilestone = asyncHandler(async (req, res, next) => {
    const { projectId, milestoneId } = req.params;
    const { status, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return next(new ErrorHandler("Invalid status", 400));
    }

    const project = await Project.findById(projectId).populate("student").populate("members");
    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (req.user.role === "Supervisor" && project.supervisor?.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 403));
    }

    const milestone = project.milestones.id(milestoneId) || project.workspaceItems.id(milestoneId);
    if (!milestone) return next(new ErrorHandler("Milestone not found", 404));

    milestone.status = status;
    let completedAt = undefined;
    let approvedBy = undefined;
    let reviewRemarks = "";
    let rejectionReason = "";

    if (status === "Approved") {
        completedAt = new Date();
        approvedBy = req.user._id;
        reviewRemarks = remarks || "Approved successfully.";
        milestone.completedAt = completedAt;
        milestone.approvedBy = approvedBy;
        milestone.reviewRemarks = reviewRemarks;
    } else {
        rejectionReason = remarks || "Requires revision.";
        reviewRemarks = remarks || "";
        milestone.rejectionReason = rejectionReason;
        milestone.reviewRemarks = reviewRemarks;
    }

    const commentEntry = {
        user: req.user._id,
        name: req.user.name,
        role: req.user.role,
        message: reviewRemarks || `Milestone ${status.toLowerCase()}.`,
        actionType: status.toUpperCase()
    };
    
    // We only push to milestone if it was found in project.milestones to avoid duplicate pushes if milestone === workspaceItem
    if (project.milestones.id(milestoneId)) {
        project.milestones.id(milestoneId).comments.push(commentEntry);
    }

    // Dual update for workspaceItems
    const workspaceItem = project.workspaceItems.id(milestoneId);
    if (workspaceItem) {
        workspaceItem.status = status;
        workspaceItem.comments.push(commentEntry);
       if (status === "Approved") 
        {
            workspaceItem.completedAt = completedAt;
            workspaceItem.approvedBy = approvedBy;
            workspaceItem.remarks = remarks || reviewRemarks || "";
        } 
       else 
       {
            workspaceItem.remarks = remarks || reviewRemarks || "";
       }
    }

    project.progress = recalculateProgress(project);
    await project.save();

    //Added helper in Notification and fixed the logic of targetUsers
    const targetUsers = await getProjectTargetUsers(project,[req.user._id,
    ]);

    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: "MILESTONE_REVIEWED",
        message: `Milestone "**${milestone.title}**" was **${status}** by ${req.user.name}`,
        details: remarks,
        relatedProject: project._id,
        priority: "high"
    });

    const io = getIo();
    if (io) emitRefresh(io);

    res.status(200).json({
        success: true,
        message: `Milestone ${status.toLowerCase()} successfully`,
        project
    });
});

// @desc    Add a comment to a milestone
// @route   POST /project/:projectId/milestone/:milestoneId/comment
// @access  Admin/Teacher/Student
export const addMilestoneComment = asyncHandler(async (req, res, next) => {
    const { projectId, milestoneId } = req.params;
    const { message } = req.body;

    if (!message) {
        return next(new ErrorHandler("Comment message is required", 400));
    }

    const project = await Project.findById(projectId);
    if (!project) return next(new ErrorHandler("Project not found", 404));

    // Authorization
    const isStudentOrMember = project.student.toString() === req.user._id.toString() || project.members.some(m => m.toString() === req.user._id.toString());
    const isSupervisor = project.supervisor && project.supervisor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isStudentOrMember && !isSupervisor && !isAdmin) {
        return next(new ErrorHandler("Unauthorized", 403));
    }

    const commentEntry = {
        user: req.user._id,
        name: req.user.name,
        role: req.user.role,
        message: message,
        actionType: "COMMENT"
    };

    const milestone = project.milestones.id(milestoneId);
    if (milestone) {
        milestone.comments.push(commentEntry);
    }

    const workspaceItem = project.workspaceItems.id(milestoneId);
    if (workspaceItem) {
        workspaceItem.comments.push(commentEntry);
    }

    if (!milestone && !workspaceItem) {
        return next(new ErrorHandler("Milestone not found", 404));
    }

    await project.save();

    // Notify other users
    const targetUsers = await getProjectTargetUsers(project, [req.user._id]);

    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: "MILESTONE_COMMENTED",
        message: `**${req.user.name}** commented on milestone "**${milestone?.title || workspaceItem?.title}**"`,
        details: message,
        relatedProject: project._id,
        priority: "low"
    });

    const io = getIo();
    if (io) emitRefresh(io);

    res.status(200).json({
        success: true,
        message: "Comment added successfully",
        project
    });
});
