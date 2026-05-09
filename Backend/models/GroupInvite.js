import mongoose from "mongoose";

const groupInviteSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email address",
            ],
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected", "Cancelled"],
            default: "Pending",
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
    },
    { timestamps: true }
);

export const GroupInvite = mongoose.model("GroupInvite", groupInviteSchema);
