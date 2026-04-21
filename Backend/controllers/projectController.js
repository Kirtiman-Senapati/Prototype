import { asyncHandler } from "../middlewares/asyncHandler.js";
import { Project } from "../models/project.js";

export const getProjectDetails = asyncHandler(async (req, res, next) => {
    const project = await Project.findById(req.params.id).populate("student supervisor");
    res.status(200).json({
        success: true,
        project
    });
});
