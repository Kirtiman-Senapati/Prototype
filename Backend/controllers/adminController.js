import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";
import { User } from "../models/user.js";
import { addTaskToProject } from "./teacherController.js";
import { logActivity } from "../utils/activityLogger.js";
import { Activity } from "../models/activity.js";
import { Request } from "../models/request.js";
import { Feedback } from "../models/Feedback.js";
import { getIo } from "../utils/socket.js";
import { emitRefresh } from "../utils/socketEvents.js";
import { sendEmail } from "../services/emailService.js";
import { getEmailTemplate } from "../utils/emailTemplates.js";
import fs from "fs";
import path from "path";
export const getAdminDashboard = asyncHandler(async (req, res, next) => {
    const totalStudents = await User.countDocuments({ role: "Student" });
    const totalTeachers = await User.countDocuments({ role: "Supervisor" });
    const totalProjects = await Project.countDocuments();
    const pendingProposals = await Project.countDocuments({ status: "Pending" });
    const completedProjects = await Activity.countDocuments({ tag: "Completed" });

    // Get recently created projects
    const recentProjects = await Project.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "name email")
        .populate("supervisor", "name email");

    // Get pending projects explicitly
    const pendingProjects = await Project.find({ status: "Pending" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "name email");

    // Get recent users as activity
    const recentActivity = await User.find({ role: { $ne: "Admin" } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name role createdAt");

    res.status(200).json({
        success: true,
        stats: {
            totalStudents,
            totalTeachers,
            totalProjects,
            pendingProposals,
            completedProjects
        },
        recentProjects,
        pendingProjects,
        recentActivity
    });
});

export const getAllUsers = asyncHandler(async (req, res, next) => {
    // Adding .lean() to allow direct property modification
    const users = await User.find({ role: { $ne: "Admin" } }).select("-password").lean();
    
    // Fetch all projects and populate student to ignore ghost projects (deleted students)
    const allProjects = await Project.find().populate("student");
    
    // Map student IDs to their project
    const studentProjectMap = {};
    const supervisorToStudentsMap = {};

    allProjects.forEach(p => {
        if (p.student && p.student._id) {
            studentProjectMap[p.student._id.toString()] = p;
        }
        if (p.supervisor && p.student && p.student._id) {
            const supId = p.supervisor.toString();
            if (!supervisorToStudentsMap[supId]) {
                supervisorToStudentsMap[supId] = new Set();
            }
            supervisorToStudentsMap[supId].add(p.student._id.toString());
        }
    });

    // Populate supervisor and proposal status for students
    const populatedUsers = users.map(u => {
        if (u.role === "Student") {
            const project = studentProjectMap[u._id.toString()];
            if (project) {
                u.supervisor = project.supervisor ? project.supervisor.toString() : u.supervisor;
                u.proposalStatus = project.status;
            } else {
                u.proposalStatus = null;
            }
        } else if (u.role === "Supervisor") {
             u.assignedStudentsCount = supervisorToStudentsMap[u._id.toString()] ? supervisorToStudentsMap[u._id.toString()].size : 0;
        }
        return u;
    });

    res.status(200).json({
        success: true,
        users: populatedUsers
    });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }
    
    // 1. Get all projects where the user is involved
    const projects = await Project.find({
        $or: [{ student: user._id }, { supervisor: user._id }]
    });

    // 2. Delete all related files from local storage
    for (const project of projects) {
        if (project.files && project.files.length > 0) {
            for (const file of project.files) {
                const filePath = path.join("public", "uploads", file.filename);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (err) {
                        console.error(`Failed to delete file: ${filePath}`, err);
                    }
                }
            }
        }
    }

    // 3. Cascade Delete related data in DB
    await Project.deleteMany({
        $or: [{ student: user._id }, { supervisor: user._id }]
    });

    await Feedback.deleteMany({
        $or: [{ student: user._id }, { sender: user._id }]
    });

    await Activity.deleteMany({
        $or: [{ actor: user._id }, { targetUsers: user._id }]
    });

    await Request.deleteMany({
        $or: [{ fromUser: user._id }, { toUser: user._id }]
    });

    await user.deleteOne();
    
    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    await logActivity({
        actor: req.user._id,
        targetUsers: [req.user._id, ...adminIds],
        actionType: "USER_DELETED",
        message: `**Admin** deleted user **${user.name}** (${user.role})`,
    });

    const io = getIo();
    if (io) {
        io.emit("userDeleted", { userId: user._id, role: user.role });
        io.emit("adminDashboardUpdate");
        io.emit("refreshData"); // Emit a generic refreshData for other components like Files
    }

    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});

export const getAllProjects = asyncHandler(async (req, res, next) => {
    const projects = await Project.find().populate("student supervisor");
    res.status(200).json({
        success: true,
        projects
    });
});

export const getUnassignedProjects = asyncHandler(async (req, res, next) => {
    const projects = await Project.find({ status: "Approved", supervisor: null }).populate("student", "name email");
    res.status(200).json({
        success: true,
        projects
    });
});

export const getSupervisors = asyncHandler(async (req, res, next) => {
    const supervisors = await User.find({ role: "Supervisor" }).select("name email department experties");
    res.status(200).json({
        success: true,
        supervisors
    });
});

export const assignSupervisor = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { supervisorId } = req.body;

    if (!supervisorId) {
        return next(new ErrorHandler("Please provide a supervisor ID", 400));
    }

    const project = await Project.findById(id);
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    project.supervisor = supervisorId;
    await project.save();

    // UPDATE the Student's User Document
    await User.findByIdAndUpdate(project.student, { supervisor: supervisorId });

    // Clear any pending requests this student made to other supervisors
    await Request.updateMany(
        { fromUser: project.student, type: "Supervisor", status: "Pending" },
        { $set: { status: "Rejected" } }
    );

    // 🚀 Socket.IO: Real-Time Event Emmision to Student
    import("../utils/socket.js").then(({ getIo, getReceiverSocketId }) => {
        const io = getIo();
        if (io && project.student) {
            const studentId = project.student._id ? project.student._id.toString() : project.student.toString();
            const studentSocketId = getReceiverSocketId(studentId);
            if (studentSocketId) {
                // Emit event directly to the student
                io.to(studentSocketId).emit("supervisorAssignedAdmin", {
                    projectId: project._id,
                    supervisorId: supervisorId
                });
            }
        }
    });

    await logActivity({
        actor: req.user._id,
        targetUsers: [project.student, supervisorId, req.user._id],
        actionType: "SUPERVISOR_ASSIGNED",
        message: `**Admin** assigned supervisor for project "${project.title}"`,
        relatedProject: project._id,
        priority: "high"
    });

    const io = getIo();
    emitRefresh(io);

    try {
        const supervisor = await User.findById(supervisorId);
        const student = await User.findById(project.student);
        if (supervisor && supervisor.email) {
            const template = getEmailTemplate("PROJECT_ASSIGNED", {
                supervisorName: supervisor.name,
                studentName: student ? student.name : "Student",
                title: project.title
            });

            if (template) {
                await sendEmail({
                    to: supervisor.email,
                    subject: template.subject,
                    html: template.html,
                    role: "System"
                });
            }
        }
    } catch (err) {
        console.error("Email failed but system continues:", err.message);
    }

    res.status(200).json({
        success: true,
        message: "Supervisor assigned successfully",
        project
    });
});

export const updateProjectStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["Pending", "Approved", "Rejected"].includes(status)) {
        return next(new ErrorHandler("Invalid status provided", 400));
    }

    const project = await Project.findById(id).populate("student supervisor");
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    project.status = status;
    await project.save();

    // 🚀 Socket.IO: Real-Time Event Emmision to Student
    import("../utils/socket.js").then(({ getIo, getReceiverSocketId }) => {
        const io = getIo();
        if (io && project.student) {
            const studentId = project.student._id ? project.student._id.toString() : project.student.toString();
            const studentSocketId = getReceiverSocketId(studentId);
            if (studentSocketId) {
                // Emit event directly to the student
                io.to(studentSocketId).emit("projectStatusUpdated", {
                    projectId: project._id,
                    status: project.status
                });
            }
        }
    });

    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    await logActivity({
        actor: req.user._id,
        targetUsers: [req.user._id, project.student?._id, project.supervisor?._id, ...adminIds].filter(Boolean),
        actionType: status === "Approved" ? "PROJECT_APPROVED" : "PROJECT_REJECTED",
        message: `Project proposal "${project.title}" was ${status.toLowerCase()} by **Admin**`,
        relatedProject: project._id,
        priority: status === "Rejected" ? "high" : "medium"
    });

    const io = getIo();
    emitRefresh(io);

    res.status(200).json({
        success: true,
        message: `Project ${status.toLowerCase()} successfully`,
        project
    });
});

export const updateProjectDeadline = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { deadline } = req.body;

    if (!deadline) {
        return next(new ErrorHandler("Please provide a valid deadline", 400));
    }

    const project = await Project.findById(id).populate("student supervisor");
    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    if (project.status === "Completed") {
        return next(new ErrorHandler("Cannot update deadline. Project is already completed.", 400));
    }

    project.deadline = deadline;
    project.reminder2DaySent = false;
    project.reminder1DaySent = false;
    project.deadlineMissedNotified = false;
    await project.save();

    // 🚀 Socket.IO: Real-Time Event Emmision to Student
    import("../utils/socket.js").then(({ getIo, getReceiverSocketId }) => {
        const io = getIo();
        if (io && project.student) {
            const studentId = project.student._id ? project.student._id.toString() : project.student.toString();
            const studentSocketId = getReceiverSocketId(studentId);
            if (studentSocketId) {
                // Emit event directly to the student
                io.to(studentSocketId).emit("deadlineUpdated", {
                    projectId: project._id,
                    projectTitle: project.title,
                    deadline: project.deadline
                });
            }
        }
    });

    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    await logActivity({
        actor: req.user._id,
        targetUsers: [req.user._id, project.student?._id, project.supervisor?._id, ...adminIds].filter(Boolean),
        actionType: "DEADLINE_SET",
        message: `📢 Update: The submission deadline for "${project.title}" has been set to ${new Date(deadline).toLocaleDateString()} by Admin.`,
        relatedProject: project._id,
        priority: "medium"
    });

    const io = getIo();
    emitRefresh(io);

    res.status(200).json({
        success: true,
        message: "Deadline updated successfully",
        project
    });
});

export const addStudent = asyncHandler(async (req, res, next) => {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler("Please fill name, email and password", 400));
    }

    let user = await User.findOne({ email });
    if (user) {
        return next(new ErrorHandler("User already exists with this email", 400));
    }

    user = await User.create({
        name,
        email,
        password,
        department,
        role: "Student",
    });

    await logActivity({
        actor: req.user._id,
        actionType: "USER_ADDED",
        message: `**Admin** added a new Student: **${name}**`,
    });

    const io = getIo();
    emitRefresh(io);

    res.status(201).json({
        success: true,
        message: "Student added successfully",
        user
    });
});

export const addSupervisor = asyncHandler(async (req, res, next) => {
    const { name, email, password, department, experties } = req.body;

    if (!name || !email || !password || !department) {
        return next(new ErrorHandler("Please fill all required fields", 400));
    }

    let user = await User.findOne({ email });
    if (user) {
        return next(new ErrorHandler("User already exists with this email", 400));
    }

    // Convert comma-separated expertise into an array if it's a string
    let parsedExpertise = [];
    if (experties) {
        parsedExpertise = Array.isArray(experties) 
            ? experties 
            : experties.split(',').map(e => e.trim()).filter(e => e);
    }

    user = await User.create({
        name,
        email,
        password,
        department,
        experties: parsedExpertise,
        role: "Supervisor",
    });

    await logActivity({
        actor: req.user._id,
        actionType: "USER_ADDED",
        message: `**Admin** added a new Supervisor: **${name}**`,
    });

    const io = getIo();
    emitRefresh(io);

    res.status(201).json({
        success: true,
        message: "Supervisor added successfully",
        user
    });
});

export const updateUserDetails = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, email, department, experties, password } = req.body;

    let user = await User.findById(id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (department) user.department = department;
    
    if (password) {
        user.password = password; // Pre-save hook will hash this
    }

    if (user.role === "Supervisor" && experties !== undefined) {
        let parsedExpertise = [];
        if (experties) {
            parsedExpertise = Array.isArray(experties) 
                ? experties 
                : experties.split(',').map(e => e.trim()).filter(e => e);
        }
        user.experties = parsedExpertise;
    }

    await user.save();

    await logActivity({
        actor: req.user._id,
        actionType: "USER_EDITED",
        message: `**Admin** updated details for user: **${user.name}**`,
    });

    const io = getIo();
    emitRefresh(io);

    res.status(200).json({
        success: true,
        message: "User details updated successfully",
        user
    });
});



export const addTaskAdmin = asyncHandler(async (req, res, next) => {
    // strict admin protection
    if (req.user.role !== "Admin") {
        return next(new ErrorHandler("Access denied", 403));
    }

    const { projectId, title, description, deadline } = req.body;
    const project = await addTaskToProject(projectId, { title, description, deadline }, "admin", req.user._id);

    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    await logActivity({
        actor: req.user._id,
        targetUsers: [req.user._id, project.student, project.supervisor, ...adminIds].filter(Boolean),
        actionType: "TASK_ASSIGNED",
        message: `**Admin** assigned a new task "${title}" to project "${project.title}"`,
        details: description,
        relatedProject: project._id,
        priority: "high"
    });

    const io = getIo();
    emitRefresh(io);

    res.status(201).json({
        success: true,
        message: "Task added successfully by admin",
        project
    });
});
