import cron from "node-cron";
import { Project } from "../models/project.js";
import { User } from "../models/user.js";
import { sendEmail } from "../services/emailService.js";
import { getEmailTemplate } from "../utils/emailTemplates.js";
import { logActivity } from "../utils/activityLogger.js";

// ===============================
// ✅ MAIN FUNCTION (IMPORTANT)
// ===============================
export const runDeadlineChecker = async () => {
    console.log("⏰ Running deadline checker...");

    const format = (date) => {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
    };

    // Today range
    const todayStr = format(new Date());
    const todayStart = new Date(todayStr);
    const todayEnd = new Date(todayStr);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Tomorrow range
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = format(tomorrowDate);
    const tomorrowStart = new Date(tomorrowStr);
    const tomorrowEnd = new Date(tomorrowStr);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    try {
        // ============================================
        // 🔔 1 DAY BEFORE DEADLINE (REMINDER)
        // ============================================
        const now = new Date();
        const nearDeadlineProjects = await Project.find({
            deadline: {
                $gte: new Date(now.getTime() + 18 * 60 * 60 * 1000),
                $lte: new Date(now.getTime() + 30 * 60 * 60 * 1000)
            },
            status: { $ne: "Completed" },
            reminderSent: false
        }).populate("student supervisor");

        for (const project of nearDeadlineProjects) {
            try {
                const template = getEmailTemplate("DEADLINE_REMINDER", {
                    studentName: project.student?.name || "Student",
                    title: project.title,
                    deadline: format(project.deadline)
                });

                if (template && project.student?.email) {
                    await sendEmail({
                        to: project.student.email,
                        subject: template.subject,
                        html: template.html,
                        role: "System"
                    });
                }

                await logActivity({
                    actionType: "DEADLINE_REMINDER",
                    message: `⏰ Your project "${project.title}" submission deadline is tomorrow (${format(project.deadline)}). Please complete it on time.`,
                    targetUsers: [project.student?._id].filter(Boolean),
                    roles: [],
                    relatedProject: project._id,
                    priority: "medium"
                });

                await Project.updateOne(
                    { _id: project._id, reminderSent: false },
                    { $set: { reminderSent: true } }
                );

            } catch (err) {
                console.error("Reminder failed:", project._id, err);
            }
        }

        // ============================================
        // ❌ DEADLINE MISSED
        // ============================================
        const missedProjects = await Project.find({
            deadline: { $lt: todayEnd },
            status: { $ne: "Completed" },
            deadlineMissedNotified: false
        }).populate("student supervisor");

        const admins = await User.find({ role: "Admin" });
        const adminEmails = admins.map(a => a.email).filter(Boolean);

        for (const project of missedProjects) {
            try {
                const template = getEmailTemplate("DEADLINE_MISSED", {
                    studentName: project.student?.name || "Student",
                    title: project.title
                });

                const emailSet = new Set([
                    project.student?.email,
                    project.supervisor?.email,
                    ...adminEmails
                ].filter(Boolean));

                const uniqueEmails = [...emailSet];

                if (template && uniqueEmails.length > 0) {
                    await sendEmail({
                        to: uniqueEmails,
                        subject: template.subject,
                        html: template.html,
                        role: "System"
                    });
                }

                await logActivity({
                    actionType: "DEADLINE_MISSED",
                    message: `Deadline missed: "${project.title}" not completed by ${project.student?.name}`,
                    targetUsers: [
                        project.student?._id,
                        project.supervisor?._id
                    ].filter(Boolean),
                    roles: ["Admin"],
                    relatedProject: project._id,
                    priority: "high"
                });

                await Project.updateOne(
                    { _id: project._id },
                    { $set: { deadlineMissedNotified: true } }
                );

            } catch (err) {
                console.error("Missed deadline error:", project._id, err);
            }
        }

    } catch (error) {
        console.error("Cron error:", error);
    }
};

// ===============================
// ⏰ CRON SCHEDULER
// ===============================
if (process.env.CRON_ENABLED === "true") {
    cron.schedule("0 * * * *", runDeadlineChecker);
}