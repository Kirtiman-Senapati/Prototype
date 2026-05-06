import { Activity } from "../models/activity.js";
import { Project } from "../models/project.js";
import { User } from "../models/user.js";
import { logActivity } from "../utils/activityLogger.js";
// @desc    Get activities based on role
// @route   GET /api/v1/activities
// @access  Private
export const getActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    let query = {};

    // FETCH ONLY RELEVANT ACTIVITIES
    query = {
      $and: [
        {
          $or: [
            { targetUsers: userId },
            { roles: userRole },
            { actor: userId } // Allow users to see activities they created
          ]
        },
        { clearedBy: { $ne: userId } }
      ]
    };

    const activities = await Activity.find(query)
      .populate("actor", "name role profilePic")
      .populate("relatedProject", "title")
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50 to avoid payload bloat

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Get Activities Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching activities",
    });
  }
};

// @desc    Mark activities as read
// @route   PATCH /api/v1/activities/read
// @access  Private
// @body    { activityIds: ['id1', 'id2'] } Optional array. If omitted, marks all relevant as read.
export const markActivitiesRead = async (req, res) => {
  try {
    const { activityIds } = req.body;

    await Activity.updateMany(
      {
        _id: { $in: activityIds },
      },
      {
        $addToSet: {
          readBy: req.user._id,
        },
      }
    );

    res.status(200).json({
      success: true,
      activityIds,
    });
  } catch (error) {
    console.error("Mark Activities Read Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking activities read",
    });
  }
};

// @desc    Clear activities for user
// @route   DELETE /api/v1/activities/clear
// @access  Private
export const clearActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let filter = {
      $or: [
        { targetUsers: userId },
        { roles: userRole },
        { actor: userId } // Allow users to clear activities they created
      ]
    };

    // Add user to clearedBy array
    await Activity.updateMany(filter, {
      $addToSet: { clearedBy: userId }
    });

    res.status(200).json({
      success: true,
      message: "Activities cleared successfully."
    });
  } catch (error) {
    console.error("Clear Activities Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error clearing activities",
    });
  }
};

// @desc    Send a shared message via the Activity system
// @route   POST /api/v1/activities/message
// @access  Private
export const sendProjectMessage = async (req, res) => {
  try {
    const { projectId, title, message, tag } = req.body;

    if (!projectId || !title || !message) {
      return res.status(400).json({ success: false, message: "Please provide projectId, title, and message" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id.toString());

    // Build targetUsers (everyone associated minus the sender)
    let targetUsersSet = new Set([...adminIds, project.student.toString()]);
    if (project.supervisor) {
      targetUsersSet.add(project.supervisor.toString());
    }

    // Remove the sender from the target list (since they already see it as actor)
    targetUsersSet.delete(req.user._id.toString());

    const targetUsers = Array.from(targetUsersSet);

    // Determine Action Type
    let actionType = "STUDENT_MESSAGE";
    if (req.user.role === "Supervisor") actionType = "SUPERVISOR_MESSAGE";
    if (req.user.role === "Admin") actionType = "ADMIN_MESSAGE";

    await logActivity({
      actor: req.user._id,
      targetUsers: targetUsers,
      actionType,
      message: `${req.user.name} : ${title} - ${message}`,
      relatedProject: project._id,
      priority: "medium" // Or map to 'high' based on urgency
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error("Error sending project message: ", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};


