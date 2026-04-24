import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";
import { Request } from "../models/request.js";
import { User } from "../models/user.js";
import { Notification } from "../models/notification.js";
import multer from "multer";
import path from "path";
import { logActivity } from "../utils/activityLogger.js";

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

export const upload = multer({ storage });

export const submitProposal = asyncHandler(async (req, res, next) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return next(new ErrorHandler("Please provide title and description", 400));
    }

    // Check if project exists
    let project = await Project.findOne({ student: req.user._id });
    if (project) {
        if (project.status === "Pending" || project.status === "Approved") {
            return next(new ErrorHandler("You already have an active proposal. Please wait for the admin's decision or submit only if rejected.", 400));
        }
        
        project.title = title;
        project.description = description;
        project.status = "Pending"; // Reset status for Admin Review
        await project.save();
    } else {
        project = await Project.create({
            title,
            description,
            student: req.user._id,
        });

        req.user.project = project._id;
        await req.user.save();
    }

    // Socket Emission for Admin Dashboard Updates
    import("../utils/socket.js").then(({ getIo }) => {
        const io = getIo();
        if (io) {
            io.emit("adminDashboardUpdate");
        }
    });

    await logActivity({
        actor: req.user._id,
        actionType: "PROPOSAL_SUBMITTED",
        message: `**${req.user.name}** submitted a new project proposal: "${title}"`,
        relatedProject: project._id,
        priority: "medium"
    });

    res.status(201).json({
        success: true,
        message: "Project Proposal Submitted successfully",
        project
    });
});

export const getAvailableSupervisors = asyncHandler(async (req, res, next) => {
    const supervisors = await User.find({ role: "Supervisor" }).select("name email department experties");
    res.status(200).json({
        success: true,
        supervisors
    });
});

export const requestSupervisor = asyncHandler(async (req, res, next) => {
    const { teacherId, title, description } = req.body;

    if (!teacherId || !title || !description) {
        return next(new ErrorHandler("Please provide all fields", 400));
    }

    // STRICT VALIDATION: Student MUST have a Project Proposal before requesting
    const projectExists = await Project.findOne({ student: req.user._id });
    if (!projectExists) {
        return next(new ErrorHandler("Please submit your Project Proposal first before requesting a supervisor.", 400));
    }

    if (projectExists.status !== "Approved") {
        return next(new ErrorHandler("Your project proposal must be approved before you can request a supervisor.", 400));
    }

    // Strictly enforce 1 supervisor rule
    const studentCheck = await User.findById(req.user._id);
    if (studentCheck.supervisor) {
        return next(new ErrorHandler("Already Superviser Assigned", 400));
    }

    // Create new supervisor request
    const newRequest = await Request.create({
        type: "Supervisor",
        fromUser: req.user._id,
        toUser: teacherId,
        title,
        description
    });

    const targetTeacher = await User.findById(teacherId).select("name");

    await logActivity({
        actor: req.user._id,
        targetUsers: [teacherId],
        actionType: "SUPERVISOR_REQUESTED",
        message: `**${req.user.name}** requested supervisor **${targetTeacher?.name || "Teacher"}** to supervise the project **${projectExists.title}**`,
        priority: "high"
    });

    res.status(201).json({
        success: true,
        message: "Supervisor request sent",
        request: newRequest
    });
});

export const uploadProjectFile = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorHandler("Please upload a file", 400));
    }

    const project = await Project.findOne({ student: req.user._id });
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.body.fileType || "Report";

    project.files.push({
        filename: req.file.originalname,
        url: fileUrl,
        type: fileType,
        uploadedBy: req.user._id
    });

    await project.save();

    // Socket Emission for Admin Dashboard Updates
    import("../utils/socket.js").then(({ getIo }) => {
        const io = getIo();
        if (io) {
            io.emit("adminDashboardUpdate");
        }
    });

    await logActivity({
        actor: req.user._id,
        targetUsers: [project.supervisor].filter(Boolean),
        actionType: "FILE_UPLOADED",
        message: `**${req.user.name}** uploaded a new file: ${req.file.originalname}`,
        relatedProject: project._id,
    });

    res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        project
    });
});

export const getStudentDashboard = asyncHandler(async (req, res, next) => {
    const project = await Project.findOne({ student: req.user._id }).populate("supervisor", "name email department experties");

    const requests = await Request.find({ fromUser: req.user._id }).populate("toUser", "name email department experties");
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
        success: true,
        project,
        requests,
        notifications
    });
});

export const updateTaskStatus = asyncHandler(async (req, res, next) => {
    const { taskId } = req.params;
    const { status } = req.body;

    const project = await Project.findOne({ student: req.user._id });
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    const task = project.tasks.id(taskId);
    if (!task) {
        return next(new ErrorHandler("Task not found", 404));
    }

    task.status = status;
    if (status === "Completed") {
        task.completedAt = new Date();
    } else {
        task.completedAt = undefined;
    }

    await project.save();

    // Socket Emission for Admin and Supervisor Dashboard Updates
    import("../utils/socket.js").then(({ getIo }) => {
        const io = getIo();
        if (io) {
            io.emit("adminDashboardUpdate");
            if (project.supervisor) {
                // If there's a specific supervisor dashboard update event, emit it
                io.emit("teacherDashboardUpdate");
            }
        }
    });

    if (status === "Completed") {
        await logActivity({
            actor: req.user._id,
            targetUsers: [project.supervisor].filter(Boolean),
            actionType: "TASK_COMPLETED",
            message: `**${req.user.name}** marked task "${task.title}" as completed`,
            relatedProject: project._id,
            priority: "medium"
        });
    }

    res.status(200).json({
        success: true,
        message: "Task status updated successfully",
        project
    });
});

