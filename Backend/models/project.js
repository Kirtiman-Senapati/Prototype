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

const workspaceCommentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    message: { type: String, required: true },
    actionType: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["Pending", "In Progress", "In Review", "Approved", "Rejected", "Overdue"], default: "Pending" },
    deadline: { type: Date },
    files: [fileSchema], // Reuse existing fileSchema
    studentRemarks: { type: String, default: "" },
    submittedAt: { type: Date },
    reviewRemarks: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    completedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comments: { type: [workspaceCommentSchema], default: [] }
});

const workspaceItemSchema = new mongoose.Schema({
    type: { type: String, enum: ["task", "phase"], required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["Pending", "In Progress", "In Review", "Approved", "Rejected", "Completed", "Overdue"], default: "Pending" },
    deadline: { type: Date },
    files: [fileSchema],
    remarks: { type: String, default: "" },
    feedback: { type: String, default: "" },
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentRemarks: { type: String, default: "" },
    submittedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedByRole: { type: String, enum: ["admin", "supervisor"], default: "supervisor" },
    assignedByName: { type: String, default: "" },
    comments: { type: [workspaceCommentSchema], default: [] }
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
        groupName: {
            type: String,
            default: "",
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
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
        workspaceItems: [workspaceItemSchema],
    },
    { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);

