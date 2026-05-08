import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";
import { User } from "../models/user.js";
import { logActivity } from "../utils/activityLogger.js";
import { getIo } from "../utils/socket.js";
import { emitRefresh } from "../utils/socketEvents.js";
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

    const project = await Project.findById(projectId).populate("student");
    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (req.user.role === "Supervisor" && project.supervisor?.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized: Not the supervisor for this project", 403));
    }

    project.milestones.push({
        title,
        description,
        deadline,
        status: "Pending"
    });

    project.progress = recalculateProgress(project);
    await project.save();

    // Fetch Admins for Event Routing
    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    await logActivity({
        actor: req.user._id,
        targetUsers: [req.user._id, project.student._id, ...adminIds],
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

    if (req.file) {
        milestone.files.push({
            filename: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            type: "Document",
            uploadedBy: req.user._id
        });
    }

    milestone.status = "In Review";
    await project.save();

    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    await logActivity({
        actor: req.user._id,
        targetUsers: [project.supervisor?._id, ...adminIds].filter(Boolean),
        actionType: "MILESTONE_SUBMITTED",
        message: `**${req.user.name}** submitted work for the milestone "**${milestone.title}**"`,
        relatedProject: project._id,
        priority: "medium"
    });

    const io = getIo();
    if (io) emitRefresh(io);

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

    const project = await Project.findById(projectId).populate("student");
    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (req.user.role === "Supervisor" && project.supervisor?.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 403));
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) return next(new ErrorHandler("Milestone not found", 404));

    milestone.status = status;
    if (status === "Approved") {
        milestone.completedAt = new Date();
        milestone.approvedBy = req.user._id;
        milestone.reviewRemarks = remarks || "Approved successfully.";
    } else {
        milestone.rejectionReason = remarks || "Requires revision.";
        milestone.reviewRemarks = remarks || "";
    }

    project.progress = recalculateProgress(project);
    await project.save();

    await logActivity({
        actor: req.user._id,
        targetUsers: [project.student._id],
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
