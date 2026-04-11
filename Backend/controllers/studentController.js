import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Project } from "../models/Project.js";
import { Request } from "../models/Request.js";
import { User } from "../models/user.js";
import { Notification } from "../models/Notification.js";
import multer from "multer";
import path from "path";

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
        project.title = title;
        project.description = description;
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

    res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        project
    });
});

export const getStudentDashboard = asyncHandler(async (req, res, next) => {
    const project = await Project.findOne({ student: req.user._id }).populate("supervisor", "name email");
    const requests = await Request.find({ fromUser: req.user._id });
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5);
    
    res.status(200).json({
        success: true,
        project,
        requests,
        notifications
    });
});

