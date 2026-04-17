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
    const users = await User.find({ role: { $ne: "Admin" } }).select("-password");
    res.status(200).json({
        success: true,
        users
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
