import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/Project.js";
import { Request } from "../models/Request.js";
import { User } from "../models/user.js";

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

    request.status = status;
    await request.save();

    if (status === "Accepted" && request.type === "Supervisor") {
        const student = await User.findById(request.fromUser);
        if (student) {
            // CRITICAL FIX: If student already had a previous supervisor, we must remove them from that supervisor's array!
            if (student.supervisor && student.supervisor.toString() !== req.user._id.toString()) {
                const oldSupervisor = await User.findById(student.supervisor);
                if (oldSupervisor) {
                    oldSupervisor.assignedStudents = oldSupervisor.assignedStudents.filter(
                        id => id.toString() !== student._id.toString()
                    );
                    await oldSupervisor.save();
                }
            }

            student.supervisor = req.user._id;
            await student.save();

            // also add to teacher's assigned students
            if (!req.user.assignedStudents.includes(student._id)) {
                req.user.assignedStudents.push(student._id);
                await req.user.save();
            }

            // update project supervisor
            const project = await Project.findOne({ student: student._id });
            if (project) {
                project.supervisor = req.user._id;
                project.status = "Approved"; // Optionally approve immediately
                await project.save();
            }
        }
    }

    res.status(200).json({
        success: true,
        message: `Request ${status}`,
        request
    });
});

export const getAssignedStudents = asyncHandler(async (req, res, next) => {
    const students = await User.find({ supervisor: req.user._id }).populate("project");
    res.status(200).json({
        success: true,
        students
    });
});

export const addTask = asyncHandler(async (req, res, next) => {
    const { projectId, title, description, deadline } = req.body;

    const project = await Project.findById(projectId);
    if (!project || project.supervisor.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Project not found or unauthorized", 404));
    }

    project.tasks.push({
        title,
        description,
        deadline
    });

    await project.save();

    res.status(201).json({
        success: true,
        message: "Task added successfully",
        project
    });
});

export const getTeacherDashboard = asyncHandler(async (req, res, next) => {
    const pendingRequestsCount = await Request.countDocuments({ toUser: req.user._id, status: "Pending" });
    const assignedStudentsCount = req.user.assignedStudents.length;

    res.status(200).json({
        success: true,
        stats: {
            pendingRequests: pendingRequestsCount,
            assignedStudents: assignedStudentsCount
        }
    });
});
