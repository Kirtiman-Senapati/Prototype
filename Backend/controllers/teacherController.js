import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/project.js";
import { Request } from "../models/request.js";
import { Notification } from "../models/notification.js";
import { getProjectTargetUsers } from "../utils/getProjectTargetUsers.js";
import { User } from "../models/user.js";
import { getIo, getReceiverSocketId } from "../utils/socket.js";
import { logActivity } from "../utils/activityLogger.js";
import mongoose from "mongoose";
export const getPendingRequests = asyncHandler(async (req, res, next) => {
    const requests = await Request.find({ toUser: req.user._id, status: "Pending" }).populate("fromUser", "name email department");
    res.status(200).json({
        success: true,
        requests
    });
});
export const handleRequest = asyncHandler(async (req, res, next) => {
    const { requestId, status } = req.body;
    
    if (!["Accepted", "Rejected"].includes(status)) {
        return next(new ErrorHandler("Invalid status", 400));
    }
    const request = await Request.findById(requestId);
    if (!request || request.toUser.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Request not found", 404));
    }
    // Bulletproof validation logic to prevent ANY overlapping accepts
    let studentToAssign = null;
    if (status === "Accepted" && request.type === "Supervisor") {
        studentToAssign = await User.findById(request.fromUser);
        
        const checkProject = await Project.findOne({ student: request.fromUser });
        let assignedTeacherId = null;
        if (checkProject && checkProject.supervisor) {
            assignedTeacherId = checkProject.supervisor.toString();
        } else if (studentToAssign && studentToAssign.supervisor) {
            assignedTeacherId = studentToAssign.supervisor.toString();
        }
        if (assignedTeacherId && assignedTeacherId !== req.user._id.toString()) {
            const oldSup = await User.findById(assignedTeacherId);
            const supName = oldSup ? oldSup.name : "another faculty member";
            return next(new ErrorHandler(`Already ${supName} assigned supervisor`, 400));
        }
    }
    request.status = status;
    await request.save();
    if (status === "Accepted" && request.type === "Supervisor" && studentToAssign) {
        // Assign logic
        studentToAssign.supervisor = req.user._id;
        // Use findByIdAndUpdate to forcibly bypass any pre-save schema validation failures
        await User.findByIdAndUpdate(studentToAssign._id, { supervisor: req.user._id });
        // also add to teacher's assigned students
        if (!req.user.assignedStudents.includes(studentToAssign._id)) {
            await User.findByIdAndUpdate(req.user._id, { $addToSet: { assignedStudents: studentToAssign._id } });
        }
        // update project supervisor
        const project = await Project.findOne({ student: studentToAssign._id });
        if (project) {
            await Project.findByIdAndUpdate(project._id, { supervisor: req.user._id, status: "Approved" });
        }
        // CRITICAL: Auto-reject any other pending supervisor requests from this student to cleanup the database instantly
        await Request.updateMany(
            { fromUser: studentToAssign._id, type: "Supervisor", status: "Pending", _id: { $ne: requestId } },
            { $set: { status: "Rejected" } }
        );

        //Added helper in Notification and fixed the logic of targetUsers

        const targetUsers = await getProjectTargetUsers(project, [
            req.user._id,
        ]);

        await logActivity({
            actor: req.user._id,
            targetUsers,
            actionType: "REQUEST_ACCEPTED",
            message: `Supervisor **${req.user.name}** accepted **${studentToAssign.name}**'s request`,
            priority: "high"
        });

        const io = getIo();
        if (io) {
            const studentSocket = getReceiverSocketId(studentToAssign._id.toString());
            if (studentSocket) io.to(studentSocket).emit("requestStatusUpdated", { status: "Accepted" });
        }
    } else if (status === "Rejected") {
        const io = getIo();
        if (io) {
            const studentSocket = getReceiverSocketId(request.fromUser.toString());
            if (studentSocket) io.to(studentSocket).emit("requestStatusUpdated", { status: "Rejected" });
        }

        const studentInfo = await User.findById(request.fromUser).select("name");
        await logActivity({
            actor: req.user._id,
            targetUsers: [request.fromUser],
            actionType: "REQUEST_REJECTED",
            message: `Supervisor **${req.user.name}** rejected **${studentInfo ? studentInfo.name + "'s" : "your"}** request`,
            priority: "high"
        });
    }
    res.status(200).json({
        success: true,
        message: `Request ${status}`,
        request
    });
});
export const getAssignedStudents = asyncHandler(async (req, res, next) => {
    const projects = await Project.find({ supervisor: req.user._id })
        .populate("student")
        .populate("members");
    const students = projects.map(p => {
        if (p.student) {
            const studentObj = p.student.toObject ? p.student.toObject() : p.student;
            studentObj.project = p;
            return studentObj;
        }
        return null;
    }).filter(Boolean);
    
    res.status(200).json({
        success: true,
        students
    });
});
export const addTaskToProject = async (projectId, taskData, assignedByRole, userId, assignedByName) => {
    const project = await Project.findById(projectId);
    if (!project) throw new ErrorHandler("Project not found", 404);

    if (assignedByRole === "supervisor") {
        if (!project.supervisor || project.supervisor.toString() !== userId.toString()) {
            throw new ErrorHandler("Unauthorized: Not the supervisor", 403);
        }
    }

    const newId = new mongoose.Types.ObjectId();
    const newTask = {
        _id: newId,
        ...taskData,
        assignedByRole,
        assignedByName
    };

    project.tasks.push(newTask);
    project.workspaceItems.push({
        ...newTask,
        type: "task"
    });

    await project.save();
    return project;
};

export const addTask = asyncHandler(async (req, res, next) => {
    const { projectId, title, description, deadline } = req.body;
    const project = await addTaskToProject(projectId, { title, description, deadline }, "supervisor", req.user._id, req.user.name);

    await project.populate("student", "name");
    await project.populate("members", "name");
    
    // Fetch Admins for Event Routing (CASE 2) shifted to getProjectTargetUsers

    //Added helper in Notification and fixed the logic of targetUsers

   const targetUsers = await getProjectTargetUsers(project, [
    req.user._id,
   ]);

    await logActivity({
        actor: req.user._id,
        targetUsers,
        actionType: "TASK_ASSIGNED",
        message: `Supervisor **${req.user.name}** assigned a new task "**${title}**" to **${project.student.name}**`,
        details: description,
        relatedProject: project._id,
        priority: "high"
    });

    res.status(201).json({
        success: true,
        message: "Task added successfully",
        project
    });
});
export const getTeacherDashboard = asyncHandler(async (req, res, next) => {
    const pendingRequestsCount = await Request.countDocuments({ toUser: req.user._id, status: "Pending" });
    
    // Fetch all assigned projects and populate student and members to ignore ghost projects (deleted students)
    const assignedProjects = await Project.find({ supervisor: req.user._id })
        .populate("student")
        .populate("members");
    const uniqueStudents = new Set();
    assignedProjects.forEach(p => {
        if (p.student && p.student._id) uniqueStudents.add(p.student._id.toString());
    });
    const assignedStudentsCount = uniqueStudents.size;
    const completedProjectsCount = await Project.countDocuments({ supervisor: req.user._id, status: "Completed" });
    
    // Fetch completed projects details for the modal
    const completedProjectsList = await Project.find({ supervisor: req.user._id, status: "Completed" })
        .populate("student", "name")
        .populate("members", "name");
    
    // Fetch projects assigned to this supervisor
    const projects = await Project.find({ supervisor: req.user._id })
        .populate("student", "name")
        .populate("members", "name");
    
    // Extract recent files
    let recentFiles = [];
    projects.forEach(p => {
        if (p.files && p.files.length > 0) {
            p.files.forEach(f => {
                recentFiles.push({
                    _id: f._id,
                    filename: f.filename,
                    url: f.url,
                    type: f.type,
                    uploadedAt: f.uploadedAt,
                    studentName: p.student?.name || "Unknown"
                });
            });
        }
    });
    
    // Sort descending by uploadedAt and grab top 5
    recentFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    recentFiles = recentFiles.slice(0, 5);
    // Get recent activity (latest 5 requests handled or pending)
    const recentActivity = await Request.find({ toUser: req.user._id })
        .populate("fromUser", "name")
        .sort({ updatedAt: -1 })
        .limit(5);
    res.status(200).json({
        success: true,
        stats: {
            pendingRequests: pendingRequestsCount,
            assignedStudents: assignedStudentsCount,
            completedProjects: completedProjectsCount
        },
        completedProjectsList,
        recentFiles,
        recentActivity
    });
});
