import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    roles: [
      {
        type: String,
        enum: ["Admin", "Supervisor", "Student"],
      },
    ],
    actionType: {
      type: String,
      enum: [
        "PROPOSAL_SUBMITTED",
        "SUPERVISOR_REQUESTED",
        "TASK_COMPLETED",
        "FILE_UPLOADED",
        "REQUEST_ACCEPTED",
        "REQUEST_REJECTED",
        "TASK_ASSIGNED",
        "FEEDBACK_GIVEN",
        "USER_ADDED",
        "USER_DELETED",
        "USER_EDITED",
        "PROJECT_APPROVED",
        "PROJECT_REJECTED",
        "PROJECT_COMPLETED",
        "SUPERVISOR_ASSIGNED",
        "DEADLINE_SET",
        "NEW_USER_REGISTERED",
        "STUDENT_MESSAGE",
        "SUPERVISOR_MESSAGE",
        "ADMIN_MESSAGE",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    tag: {
      type: String,
      enum: ["Progress", "Issue", "Completion", "General", "Blocked", "Resolved"],
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    clearedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export const Activity = mongoose.model("Activity", activitySchema);
