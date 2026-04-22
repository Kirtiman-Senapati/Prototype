import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        senderRole: {
            type: String,
            enum: ["Admin", "Supervisor"],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["General", "Positive", "Needs Revision"],
            default: "General",
        },
    },
    { timestamps: true }
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
