import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    url: { type: String, required: true },
    type: { 
        type: String,
        enum: ["Report", "Presentation", "Code", "Document", "Archive"],
        default: "Document"
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    deadline: { type: Date },
    feedback: { type: String, default: "" },
    completedAt: { type: Date },
    assignedByRole: { type: String, enum: ["admin", "supervisor"], default: "supervisor" },
});

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["Pending", "In Progress", "In Review", "Approved", "Rejected", "Overdue"], default: "Pending" },
    deadline: { type: Date },
    files: [fileSchema], // Reuse existing fileSchema
    reviewRemarks: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    completedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Project title is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Project description is required"],
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        supervisor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected", "Completed", "Incomplete"],
            default: "Pending",
        },
        deadline: {
            type: Date,
        },
        reminder2DaySent: {
            type: Boolean,
            default: false,
        },
        reminder1DaySent: {
            type: Boolean,
            default: false,
        },
        deadlineMissedNotified: {
            type: Boolean,
            default: false,
        },
        progress: {
            type: Number,
            default: 0,
        },
        files: [fileSchema],
        tasks: [taskSchema],
        milestones: [milestoneSchema],
    },
    { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);

