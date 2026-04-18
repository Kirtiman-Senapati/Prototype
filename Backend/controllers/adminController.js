import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/Project.js";
import { User } from "../models/user.js";

export const getAdminDashboard = asyncHandler(async (req, res, next) => {
    const totalStudents = await User.countDocuments({ role: "Student" });
    const totalTeachers = await User.countDocuments({ role: "Supervisor" });
    const totalProjects = await Project.countDocuments();

    // Get recently created projects
    const recentProjects = await Project.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "name email")
        .populate("supervisor", "name email");

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
            totalProjects
        },
        recentProjects,
        recentActivity
    });
});

export const getAllUsers = asyncHandler(async (req, res, next) => {
    // Adding .lean() to allow direct property modification
    const users = await User.find({ role: { $ne: "Admin" } }).select("-password").lean();
    
    // Self-healing cross-reference: fetch all accepted projects that have supervisors
    const assignedProjects = await Project.find({ supervisor: { $ne: null } });
    
    // Map student IDs to their assigned supervisor IDs
    const studentSupervisorMap = {};
    assignedProjects.forEach(p => {
        if (p.student) {
            studentSupervisorMap[p.student.toString()] = p.supervisor.toString();
        }
    });

    // Retroactively populate the supervisor field for students missing it in the User collection
    const populatedUsers = users.map(u => {
        if (u.role === "Student") {
            const assignedSup = studentSupervisorMap[u._id.toString()];
            if (assignedSup) {
                u.supervisor = assignedSup;
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
    
    // Cleanup projects if user is student
    if (user.role === "Student") {
        await Project.findOneAndDelete({ student: user._id });
    }

    await user.deleteOne();
    
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

    // UPDATE the Teacher's User Document
    await User.findByIdAndUpdate(supervisorId, { $addToSet: { assignedStudents: project.student } });

    // Clear any pending requests this student made to other supervisors
    await import("../models/Request.js").then(async ({ Request }) => {
         await Request.updateMany(
            { fromUser: project.student, type: "Supervisor", status: "Pending" },
             { $set: { status: "Rejected" } }
         );
    });

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

    project.deadline = deadline;
    await project.save();

    // 🚀 Socket.IO: Real-Time Event Emmision to Student
    import("../utils/socket.js").then(({ getIo, getReceiverSocketId }) => {
        const io = getIo();
        if (io && project.student && project.student._id) {
            const studentSocketId = getReceiverSocketId(project.student._id.toString());
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

    res.status(200).json({
        success: true,
        message: "Deadline updated successfully",
        project
    });
});
