import mongoose from "mongoose";

const supportRequestSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null, // Allow null if the student doesn't have a project yet
        },
        phone: {
            type: String,
            required: true,
            match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"],
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxLength: [1000, "Reason cannot exceed 1000 characters"],
        },
        type: {
            type: String,
            enum: ["Deadline Extension", "Technical Problem", "Supervisor Issue", "Submission Issue", "Other"],
            default: "Deadline Extension",
        },
        status: {
            type: String,
            enum: ["PENDING", "RESOLVED", "REJECTED"],
            default: "PENDING",
        },
    },
    { timestamps: true }
);

export const SupportRequest = mongoose.model("SupportRequest", supportRequestSchema);
