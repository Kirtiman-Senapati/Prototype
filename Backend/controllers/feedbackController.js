import { asyncHandler } from "../middlewares/asyncHandler.js";
import ErrorHandler from "../middlewares/error.js";
import { Feedback } from "../models/Feedback.js";
import { User } from "../models/user.js";
import { getIo, getReceiverSocketId } from "../utils/socket.js";
import { logActivity } from "../utils/activityLogger.js";

// Send Feedback (Teacher or Admin)
export const sendFeedback = asyncHandler(async (req, res, next) => {
    const { studentId, title, message, type } = req.body;

    if (!studentId || !title || !message) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== "Student") {
        return next(new ErrorHandler("Valid student not found", 404));
    }

    // Determine sender role
    let senderRole;
    if (req.user.role === "Admin") {
        senderRole = "Admin";
    } else if (req.user.role === "Teacher" || req.user.role === "Supervisor") {
        senderRole = "Supervisor";
        // Optionally verify if this teacher is really the student's supervisor
        if (student.supervisor?.toString() !== req.user._id.toString()) {
            return next(new ErrorHandler("You are not the assigned supervisor for this student", 403));
        }
    } else {
        return next(new ErrorHandler("Unauthorized role", 403));
    }

    const feedback = await Feedback.create({
        student: studentId,
        sender: req.user._id,
        senderRole,
        title,
        message,
        type: type || "General"
    });

    // Populate sender details for frontend display
    await feedback.populate("sender", "name email");

    // Real-Time Socket Emission
    const io = getIo();
    if (io) {
        // Ping specific student
        const studentSocket = getReceiverSocketId(studentId.toString());
        if (studentSocket) {
            io.to(studentSocket).emit("newFeedback", feedback);
        }

        // Bonus: if Admin sends, notify the supervisor of this student too (to keep histories synced)
        // If Supervisor sends, notify admin dashboards
        if (senderRole === "Supervisor") {
            io.emit("adminDashboardUpdate");
        } else if (senderRole === "Admin" && student.supervisor) {
            const svSocket = getReceiverSocketId(student.supervisor.toString());
            if (svSocket) io.to(svSocket).emit("teacherDashboardUpdate");
        }
    }

    let messageLog = "";
    if (senderRole === "Admin") {
        messageLog = `Admin sent feedback to student ${student.name}`;
    } else {
        messageLog = `Supervisor ${req.user.name} sent feedback to student ${student.name}`;
    }

    // Get Admin IDs
    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    let recipients = [studentId, ...adminIds];
    if (senderRole === "Admin" && student.supervisor) {
        recipients.push(student.supervisor);
    } else if (senderRole === "Supervisor") {
        recipients.push(req.user._id);
    }

    await logActivity({
        actor: req.user._id,
        targetUsers: recipients,
        actionType: "FEEDBACK_GIVEN",
        message: messageLog,
        details: message,
        priority: "medium"
    });

    res.status(201).json({
        success: true,
        message: "Feedback sent successfully",
        feedback
    });
});

// Get Feedback Timeline for a Student
export const getStudentFeedback = asyncHandler(async (req, res, next) => {
    const studentId = req.params.studentId || req.user._id;

    // Optional Role checks: 
    // Student can only see their own.
    // Admin can see any.
    // Teacher can see their assigned students.
    if (req.user.role === "Student" && req.user._id.toString() !== studentId.toString()) {
        return next(new ErrorHandler("Unauthorized", 403));
    }

    const feedbacks = await Feedback.find({ student: studentId })
        .populate("sender", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        feedbacks
    });
});
