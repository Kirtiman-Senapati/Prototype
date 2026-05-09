import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";
import { runDeadlineChecker } from "../cron/deadlineChecker.js";
import { User } from "../models/user.js";
import { addTaskToProject } from "./teacherController.js";
import { logActivity } from "../utils/activityLogger.js";
import { Activity } from "../models/activity.js";
import { Request } from "../models/request.js";
import { Feedback } from "../models/Feedback.js";
import { getIo } from "../utils/socket.js";
import { emitRefresh, EVENTS } from "../utils/socketEvents.js";
import { sendEmail } from "../services/emailService.js";
import { generateGroupInviteTemplate } from "../utils/groupInviteEmailTemplate.js";
import { getEmailTemplate } from "../utils/emailTemplates.js";
import { getProjectTargetUsers } from "../utils/getProjectTargetUsers.js";
import { Notification } from "../models/notification.js";
import { generateNotificationEmailTemplate } from "../utils/notificationEmailTemplate.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { GroupInvite } from "../models/GroupInvite.js";


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
        .populate("members", "name email")
        .populate("supervisor", "name email");

    // Get pending projects explicitly
    const pendingProjects = await Project.find({ status: "Pending" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "name email")
        .populate("members", "name email");

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
    const allProjects = await Project.find().populate("student").populate("members");

    // Map student IDs to their project
    const studentProjectMap = {};

    allProjects.forEach((p) => {

    // leader
    if (p.student && p.student._id) {
        studentProjectMap[p.student._id.toString()] = p;
    }

    // members
    if (p.members && p.members.length > 0) {

        p.members.forEach((member) => {

            const memberId =
                member._id
                    ? member._id.toString()
                    : member.toString();

            studentProjectMap[memberId] = p;
        });
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

    await GroupInvite.deleteMany({
        email: user.email.toLowerCase()
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
    const projects = await Project.find()
        .populate("student supervisor")
        .populate("members");
    res.status(200).json({
        success: true,
        projects
    });
});

export const getUnassignedProjects = asyncHandler(async (req, res, next) => {
    const projects = await Project.find({ status: "Approved", supervisor: null })
        .populate("student", "name email")
        .populate("members", "name email");
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
    const studentIds = [
        project.student,
        ...(project.members || [])
    ];

    await User.updateMany(
        {
            _id: { $in: studentIds }
        },
        {
            $set: {
                supervisor: supervisorId,
                proposalStatus: project.status,
                project: project._id
            }
        }
    );

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

    //Added helper in Notification and fixed the logic of targetUsers

    const targetUsers = await getProjectTargetUsers(project, [
        supervisorId,
        req.user._id,
    ]);

    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: "SUPERVISOR_ASSIGNED",
        message: `**Admin** assigned supervisor for project **"${project.title}"**`,
        relatedProject: project._id,
        priority: "high"
    });

    const io = getIo();

    if (io) {
        io.emit(EVENTS.PROJECT_UPDATED, {
            projectId: project._id,
            status: project.status,
            deadline: project.deadline,
            supervisor: project.supervisor,
        });
    }

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

    // Socket.IO: Real-Time Event Emmision to Student
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

    //Added helper in Notification and fixed the logic of targetUsers

    const targetUsers = await getProjectTargetUsers(project, [
        req.user._id,
    ]);

    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: status === "Approved" ? "PROJECT_APPROVED" : "PROJECT_REJECTED",
        message: `Project proposal **"${project.title}"** was ${status.toLowerCase()} by **Admin**`,
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
    project.status = "Approved";
    project.reminder2DaySent = false;
    project.reminder1DaySent = false;
    project.deadlineMissedNotified = false;
    await project.save();

    // Add global socket events
    const globalIo = getIo();
    if (globalIo) {
        globalIo.emit(EVENTS.PROJECT_UPDATED, {
            projectId: project._id,
            status: project.status,
            deadline: project.deadline,
            supervisor: project.supervisor,
        });
    }

    //  Socket.IO: Real-Time Event Emmision to Student
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


    //Added helper in Notification and fixed the logic of targetUsers

    const targetUsers = await getProjectTargetUsers(project, [
        req.user._id,
    ]);


    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: "DEADLINE_SET",
        message: `**Deadline Updated**: Admin has officially scheduled the submission deadline for the project **"${project.title}"** to ${new Date(deadline).toLocaleDateString("en-GB")}.`,
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

export const triggerReminders = async (req, res) => {
    try {
        await runDeadlineChecker();
        res.status(200).json({ success: true, message: "Reminders triggered successfully" });
    } catch (error) {
        console.error("Manual trigger error:", error);
        res.status(500).json({ success: false, message: "Error triggering reminders" });
    }
};

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

    const activity = await logActivity({
        actor: req.user._id,
        actionType: "USER_ADDED",
        message: `**Admin** added a new Student: **${name}**`,
    });

    const io = getIo();

    if (io) {
        io.emit("newActivity", activity);

        io.emit("adminDashboardUpdate");

        io.emit(EVENTS.USER_UPDATED, {
            type: "studentAdded",
        });
    }

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

    const activity = await logActivity({
        actor: req.user._id,
        actionType: "USER_ADDED",
        message: `**Admin** added a new Supervisor: **${name}**`,
    });

    const io = getIo();

    if (io) {
        io.emit("newActivity", activity);

        io.emit("adminDashboardUpdate");

        io.emit(EVENTS.USER_UPDATED, {
            type: "supervisorAdded",
        });
    }


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

    //Added helper in Notification and fixed the logic of targetUsers

    const targetUsers = await getProjectTargetUsers(project, [
        req.user._id,
    ]);

    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: "TASK_ASSIGNED",
        message: `**Admin** assigned a new task **"${title}"** to project **"${project.title}"**`,
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
// sendManualReminder 
export const sendManualReminder = asyncHandler(async (req, res, next) => {
    const { id: projectId } = req.params;
    const { studentId, message } = req.body;

    if (!studentId) {
        return next(new ErrorHandler("Please provide a student ID", 400));
    }

    const project = await Project.findById(projectId).populate("student", "name email").populate("members", "name email");

    if (!project) {
        return next(new ErrorHandler("Project not found", 404));
    }

    //Add new logic for leader and member of project
    const isLeader = project.student?._id.toString() === studentId;
    const isMember =project.members?.some(member => member._id.toString() === studentId);
    
    if (!isLeader && !isMember) {
    return next(new ErrorHandler("Student does not belong to this project",400));
}

//Add notification for leader and member
    const isGroupProject =
        project.members &&
        project.members.length > 0;

    //get pending invites for the project
    const pendingInvites = await GroupInvite.find({ project: projectId, status: "Pending" });

    const defaultMessage = "This is a reminder from the admin regarding your project deadline. Please review your progress and ensure timely completion.";
    const finalMessage = message && message.trim() ? message : defaultMessage;

    // 1. Create Notification
    await Notification.create({
        user: studentId,
        message: finalMessage,
        type: "Deadline",
        relatedId: project._id,
        read: false
    });

    // 2. Log Activity
    await logActivity({
        actor: req.user._id,
        targetUsers: isGroupProject
    ? await getProjectTargetUsers(project, [
          req.user._id,
      ])
    : [studentId, req.user._id],
        actionType: "DEADLINE_REMINDER",
        message: `**Admin** sent a manual reminder to **${project.student.name}** for project **"${project.title}"**`,
        details: finalMessage,
        relatedProject: project._id,
        priority: "medium"
    });

    // 3. Socket.IO Update
    const io = getIo();
    if (io) {
        emitRefresh(io);
        import("../utils/socket.js").then(({ getReceiverSocketId }) => {
            const socketIds = getReceiverSocketId(studentId);
            if (socketIds && socketIds.length > 0) {
                socketIds.forEach(id => {
                    io.to(id).emit("newNotification", {
                        message: finalMessage,
                        type: "Deadline"
                    });
                });
            }
        });
    }

    // 4. Send Email (non-blocking)
    if (project.student.email) {
        const html = generateNotificationEmailTemplate(
            `Admin sent you a reminder for project "${project.title}"`,
            finalMessage
        );

        sendEmail({
            to: project.student.email,
            subject: `Important Reminder: Project ${project.title}`,
            html: html,
            role: "System"
        }).catch(err => {
            console.error("Manual reminder email failed but process continues:", err.message);
        });
    }

    res.status(200).json({
        success: true,
        message: "Reminder sent successfully"
    });
});

export const updateGroupName = asyncHandler(async (req, res, next) => {
    const { id: projectId } = req.params;
    const { groupName } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (groupName !== undefined) {
        project.groupName = groupName;
        await project.save();
    }

    await logActivity({
        actor: req.user._id,
        targetUsers: [req.user._id, project.student, ...project.members],
        actionType: "GROUP_UPDATED",
        message: `**Admin** updated group name for project **"${project.title}"**`,
        relatedProject: project._id,
        priority: "low"
    });

    const io = getIo();
    emitRefresh(io);

    res.status(200).json({ success: true, message: "Group name updated" });
});

export const inviteMember = asyncHandler(async (req, res, next) => {
    const { id: projectId } = req.params;
    const { email } = req.body;

    if (!email) return next(new ErrorHandler("Email is required", 400));

    const project = await Project.findById(projectId);
    if (!project) return next(new ErrorHandler("Project not found", 404));

    const student = await User.findOne({ email: email.toLowerCase(), role: "Student" });
    if (!student) return next(new ErrorHandler("No registered student account was found with this email address", 404));

    if (project.student.toString() === student._id.toString() || project.members.includes(student._id)) {
        return next(new ErrorHandler("Student is already a member of this project", 400));
    }

    const existingProject = await Project.findOne({
        _id: { $ne: project._id },
        $or: [{ student: student._id }, { members: student._id }]
    });
    if (existingProject) return next(new ErrorHandler("Student is already in another project", 400));

    const existingInvite = await GroupInvite.findOne({ project: projectId, email: email.toLowerCase(), status: "Pending" });
    if (existingInvite) return next(new ErrorHandler("An invitation is already pending for this email", 400));

    const token = crypto.randomBytes(32).toString("hex");

    const invite = await GroupInvite.create({
        project: projectId,
        email: email.toLowerCase(),
        invitedBy: req.user._id,
        token,
    });

    let emailSent = false;
    try {

        console.log("INVITE EMAIL START");

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        const acceptUrl =
            `${frontendUrl}/invite/respond?token=${invite.token}&action=accept`;

        const declineUrl =
            `${frontendUrl}/invite/respond?token=${invite.token}&action=reject`;

        const html = generateGroupInviteTemplate({
            invitedStudentName: student.name,
            adminName: req.user.name,
            projectTitle: project.title,
            groupName: project.groupName,
            acceptUrl,
            declineUrl,
        });

        await sendEmail({
            to: student.email,
            subject: `Project Invitation - ${project.title}`,
            html,
            role: "Admin",
        });

        emailSent = true;

        console.log("INVITE EMAIL SUCCESS");

    }
    catch (err) {

        console.error("INVITE EMAIL FAILED:", err.message);

    }

    const io = getIo();
    emitRefresh(io);

    res.status(200).json({
        success: true,
        emailSent,
        message: emailSent
            ? "Invitation sent successfully."
            : "Invitation created successfully, but email delivery failed.",
    });
});

export const cancelInvite = asyncHandler(async (req, res, next) => {
    const { inviteId } = req.params;
    const invite = await GroupInvite.findById(inviteId);
    if (!invite) return next(new ErrorHandler("Invite not found", 404));

    invite.status = "Cancelled";
    await invite.save();

    const io = getIo();
    emitRefresh(io);

    res.status(200).json({ success: true, message: "Invitation cancelled" });
});

export const resendInvite = asyncHandler(async (req, res, next) => {
    const { inviteId } = req.params;
    const invite = await GroupInvite.findById(inviteId).populate("project");
    if (!invite || invite.status !== "Pending") return next(new ErrorHandler("Pending invite not found", 404));

    let emailSent = false;
    let message = "Failed to resend email. Student can still accept from dashboard.";

    try {
        await sendEmail({
            email: invite.email,
            subject: "Reminder: You've been invited to join a project",
            message: `Admin has invited you to join the project "${invite.project.title || invite.project.groupName}". Please log in to your dashboard to accept.`
        });
        emailSent = true;
        message = "Invitation resent successfully";
    } catch (err) {
        console.error("Email sending failed:", err.message);
    }

    res.status(200).json({ success: true, message, emailSent });
});

export const removeMember = asyncHandler(async (req, res, next) => {
    const { id: projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return next(new ErrorHandler("Project not found", 404));

    if (project.student.toString() === userId.toString()) {
        return next(new ErrorHandler("Cannot remove team leader", 400));
    }

    project.members = project.members.filter(m => m.toString() !== userId.toString());
    await project.save();

    const removedUser = await User.findById(userId);

    await logActivity({
        actor: req.user._id,
        targetUsers: [req.user._id, project.student, ...project.members, userId],
        actionType: "MEMBER_REMOVED",
        message: `**Admin** removed **${removedUser?.name || 'a member'}** from project **"${project.title}"**`,
        relatedProject: project._id,
        priority: "high"
    });

    const io = getIo();
    emitRefresh(io);

    res.status(200).json({ success: true, message: "Member removed" });
});
