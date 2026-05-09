import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";
import { Request } from "../models/request.js";
import { User } from "../models/user.js";
import { Notification } from "../models/notification.js";
import multer from "multer";
import path from "path";
import { logActivity } from "../utils/activityLogger.js";
import { emitRefresh } from "../utils/socketEvents.js";
import { sendEmail } from "../services/emailService.js";
import { getEmailTemplate } from "../utils/emailTemplates.js";
import { getIo } from "../utils/socket.js";

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
    const { title, description, groupName, forceSubmit } = req.body;

    if (!title || !description) {
        return next(new ErrorHandler("Please provide title and description", 400));
    }

    if (!forceSubmit) {
        const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const similarProjects = await Project.find({
            student: { $ne: req.user._id },
            title: { $regex: new RegExp(`^${escapeRegex(title.trim())}$`, 'i') }
        });

        if (similarProjects.length > 0) {
            return res.status(200).json({
                success: true,
                status: "warning",
                message: "Similar project detected. Another student is already working on or has been approved for a project with a similar title. Please review before proceeding.",
                matches: similarProjects.length
            });
        }
    }

    // Check if project exists
    let project = await Project.findOne({ $or: [{ student: req.user._id }, { members: req.user._id }] });
    if (project) {
        if (project.status === "Pending" || project.status === "Approved") {
            return next(new ErrorHandler("You already have an active proposal or are part of a project group. Please wait for the admin's decision or submit only if rejected.", 400));
        }
        
        project.title = title;
        project.description = description;
        if (groupName !== undefined) project.groupName = groupName;
        project.status = "Pending"; // Reset status for Admin Review
        await project.save();
    } else {
        project = await Project.create({
            title,
            description,
            student: req.user._id,
            groupName: groupName || "",
        });

        req.user.project = project._id;
        await req.user.save();
    }

    // Socket Emission for Admin Dashboard Updates
    import("../utils/socket.js").then(({ getIo }) => {
        const io = getIo();
        emitRefresh(io);
    });

    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    await logActivity({
        actor: req.user._id,
        targetUsers: [req.user._id, ...adminIds],
        actionType: "PROPOSAL_SUBMITTED",
        message: `**${req.user.name}** submitted a new project proposal: "**${title}**"`,
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
    const projectExists = await Project.findOne({ $or: [{ student: req.user._id }, { members: req.user._id }] });
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

    const project = await Project.findOne({ $or: [{ student: req.user._id }, { members: req.user._id }] });
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
        emitRefresh(io);
    });

    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    await logActivity({
        actor: req.user._id,
        targetUsers: [req.user._id, project.supervisor, ...adminIds].filter(Boolean),
        actionType: "FILE_UPLOADED",
        message: `**${req.user.name}** uploaded a new file: **${req.file.originalname}**`,
        relatedProject: project._id,
    });

    res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        project
    });
});

export const getStudentDashboard = asyncHandler(async (req, res, next) => {
    const project = await Project.findOne({ $or: [{ student: req.user._id }, { members: req.user._id }] })
        .populate("student", "name email")
        .populate("supervisor", "name email department experties")
        .populate("members", "name email department");

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

    const project = await Project.findOne({ $or: [{ student: req.user._id }, { members: req.user._id }] });
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    const task = project.tasks.id(taskId);
    if (!task) {
        return next(new ErrorHandler("Task not found", 404));
    }

    if (task.status === status) {
        return res.status(200).json({ success: true, project });
    }

    task.status = status;
    let completionDate = undefined;
    if (status === "Completed") {
        completionDate = new Date();
    }
    task.completedAt = completionDate;

    // Dual update for workspaceItems
    const workspaceItem = project.workspaceItems.id(taskId);
    if (workspaceItem) {
        workspaceItem.status = status;
        workspaceItem.completedAt = completionDate;
    }

    await project.save();

    // Socket Emission for Admin and Supervisor Dashboard Updates
    import("../utils/socket.js").then(({ getIo }) => {
        const io = getIo();
        emitRefresh(io);
    });

    if (status === "Completed") {
        // Fetch Admins for Event Routing (CASE 3)
        const admins = await User.find({ role: "Admin" }).select("_id");
        const adminIds = admins.map(a => a._id);

        await logActivity({
            actor: req.user._id,
            targetUsers: [project.supervisor, ...adminIds].filter(Boolean),
            actionType: "TASK_COMPLETED",
            message: `**${req.user.name}** marked task **"${task.title}"** as completed`,
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

export const completeProject = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate("student", "name email").populate("supervisor").populate("members", "name email");
    
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    // Security: Only the assigned student can mark it complete
    if (project.student._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Not authorized to complete this project", 403));
    }

    if (project.status === "Completed") {
        return next(new ErrorHandler("Project is already marked as completed", 400));
    }

    if (project.status === "Incomplete") {
        return next(new ErrorHandler("Project deadline has already passed. You can no longer mark this project as completed. Please contact your administrator for further assistance.", 400));
    }

    project.status = "Completed";
    await project.save();

    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    // Activity for student, supervisor, and admins
    await logActivity({
        actor: req.user._id,
        targetUsers: [project.student._id, project.supervisor?._id].filter(Boolean),
        roles: ["Admin"],
        actionType: "PROJECT_COMPLETED",
        message: `Assigned project "${project.title}" completed by student "${project.student.name}"`,
        relatedProject: project._id,
        priority: "medium" // Send manually to guarantee delivery
    });

    // Email to supervisor explicitly as requested
    if (project.supervisor && project.supervisor.email) {
        try {
            const template = getEmailTemplate("PROJECT_COMPLETED", {
                studentName: project.student.name,
                title: project.title
            });

            if (template) {
                await sendEmail({
                    to: project.supervisor.email,
                    subject: template.subject,
                    html: template.html,
                    role: "System"
                });
            }
        } catch (err) {
            console.log("Email failed", err);
        }
    }

    const io = getIo();
    if (io) {
        emitRefresh(io);
    }

    res.status(200).json({
        success: true,
        message: "Project marked as completed successfully"
    });
});

// Member Leaves Group
export const leaveProjectGroup = asyncHandler(async (req, res, next) => {
    const project = await Project.findOne({ members: req.user._id });
    
    if (!project) {
        return next(new ErrorHandler("You are not a member of any project group", 400));
    }

    // Leader cannot leave through this route
    if (project.student.toString() === req.user._id.toString()) {
        return next(new ErrorHandler("Team leader cannot leave the group. Delete project instead.", 403));
    }

    // Remove user from members
    project.members = project.members.filter(m => m.toString() !== req.user._id.toString());
    await project.save();

    const targetUsers = [project.student, req.user._id, ...project.members.map(m => m._id || m)];

    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: "MEMBER_LEFT",
        message: `**${req.user.name}** left the project group "**${project.title || project.groupName || 'Project'}**"`,
        relatedProject: project._id,
        priority: "high"
    });

    const io = getIo();
    emitRefresh(io);

    res.status(200).json({
        success: true,
        message: "Successfully left the project group"
    });
});
