import { Activity } from "../models/activity.js";

// @desc    Get activities based on role
// @route   GET /api/v1/activities
// @access  Private
export const getActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    let query = {};

    if (userRole === "Admin") {
      // Admin sees everything not cleared by them
      query = { clearedBy: { $ne: userId } };
    } else if (userRole === "Supervisor") {
      // Supervisor sees activities targeting them or created by them
      query = {
        $and: [
           { $or: [{ targetUsers: userId }, { actor: userId }] },
           { clearedBy: { $ne: userId } }
        ]
      };
    } else if (userRole === "Student") {
      // Student sees activities targeting them
      query = { 
        targetUsers: userId,
        clearedBy: { $ne: userId }
      };
    }

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
    const userId = req.user._id;
    const { activityIds } = req.body;

    let filter = { targetUsers: userId, readBy: { $ne: userId } };
    
    if (activityIds && activityIds.length > 0) {
      filter._id = { $in: activityIds };
    }

    await Activity.updateMany(filter, {
      $addToSet: { readBy: userId },
    });

    res.status(200).json({
      success: true,
      message: "Activities marked as read."
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
    
    let filter = {};
    if (userRole === "Admin") {
      filter = {};
    } else if (userRole === "Supervisor") {
      filter = { $or: [{ targetUsers: userId }, { actor: userId }] };
    } else if (userRole === "Student") {
      filter = { targetUsers: userId };
    }

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
