import { asyncHandler } from "../middlewares/asyncHandler.js";
import { Project } from "../models/project.js";

export const getProjectDetails = asyncHandler(async (req, res, next) => {
    const project = await Project.findById(req.params.id).populate("student supervisor");
    res.status(200).json({
        success: true,
        project
    });
});

export const getMyProjects = asyncHandler(async (req, res, next) => {
    let query = {};
    if (req.user.role === "Student") query = { student: req.user._id };
    else if (req.user.role === "Supervisor") query = { supervisor: req.user._id };
    
    // Admins implicitly pass the empty {} query, returning all projects
    const projects = await Project.find(query).select("title _id").sort({ createdAt: -1 });
    
    res.status(200).json({
        success: true,
        projects
    });
});
