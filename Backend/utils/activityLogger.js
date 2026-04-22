import { Activity } from "../models/activity.js";
import { getIo, getReceiverSocketId } from "./socket.js";
import { User } from "../models/user.js";
import { sendEmail } from "../services/emailService.js";
import { generateNotificationEmailTemplate } from "./notificationEmailTemplate.js";

/**
 * Logs an activity to the database and emits real-time sockets
 * @param {Object} params
 * @param {String} params.actor - ObjectId of the user performing the action
 * @param {Array<String>} params.targetUsers - Array of ObjectIds of target users (optional)
 * @param {String} params.actionType - Enum string of the action
 * @param {String} params.message - Human readable message
 * @param {String} params.relatedProject - ObjectId of related project (optional)
 * @param {String} params.priority - 'low', 'medium', 'high'
 */
export const logActivity = async ({
  actor,
  targetUsers = [],
  actionType,
  message,
  details,
  relatedProject = null,
  priority = "low",
  tag
}) => {
  try {
    const newActivity = await Activity.create({
      actor,
      targetUsers,
      actionType,
      message,
      details,
      relatedProject,
      priority,
      tag
    });

    // Populate actor details for the socket payload
    const populatedActivity = await Activity.findById(newActivity._id)
      .populate("actor", "name role profilePic")
      .populate("relatedProject", "title")
      .lean();

    const io = getIo();
    if (io) {
      if (targetUsers && targetUsers.length > 0) {
        // Emit to specific users
        targetUsers.forEach(async (userId) => {
          const socketId = getReceiverSocketId(userId.toString());
          if (socketId) {
            io.to(socketId).emit("newActivity", populatedActivity);
          }

          // Trigger email notification for any targeted user (unified)
          try {
            const user = await User.findById(userId);
            if (user && user.email) {
              const emailHtml = generateNotificationEmailTemplate(populatedActivity.message, populatedActivity.details);
              const actorRole = populatedActivity.actor?.role || "System";
              
              await sendEmail({
                to: user.email,
                subject: "New Update - Academic Project Monitoring System",
                html: emailHtml,
                role: actorRole
              });
            }
          } catch (emailErr) {
            console.error("Error sending notification email: ", emailErr);
          }
        });
      }

      // Always broadcast to admins, or specific 'admin' rooms if we had rooms
      // For now we broadcast the system activities to all active admins
      // Since we don't have socket rooms for roles currently, we can emit a global "systemActivity"
      // that the admin client listens to, or we can fetch all admin IDs from DB and send targeted.
      // Easiest is global emit and let clients ignore if not admin.
      io.emit("systemActivity", populatedActivity);
    }

    return newActivity;
  } catch (error) {
    console.error("Error logging activity: ", error);
  }
};

