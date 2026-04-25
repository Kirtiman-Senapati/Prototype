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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
        // ============================================
        // 🔔 REMINDERS (Date Difference Logic)
        // ============================================
        const pendingProjects = await Project.find({
            status: { $ne: "Completed" },
            $or: [
                { reminder2DaySent: false },
                { reminder1DaySent: false }
            ]
        }).populate("student supervisor");

        for (const project of pendingProjects) {
            if (!project.deadline) continue;
            
            // Calculate days difference (100% reliable)
            const diff = Math.ceil((new Date(project.deadline) - todayStart) / (1000 * 60 * 60 * 24));

            // -----------------------------
            // 2-DAY REMINDER
            // -----------------------------
            if (diff === 2 && !project.reminder2DaySent) {
                try {
                    const updated = await Project.updateOne(
                        { _id: project._id, reminder2DaySent: false },
                        { $set: { reminder2DaySent: true } }
                    );

                    if (updated.modifiedCount === 0) continue;

                    const template = getEmailTemplate("DEADLINE_REMINDER", {
                        studentName: project.student?.name || "Student",
                        title: project.title,
                        deadline: new Date(project.deadline).toLocaleDateString()
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
                        message: `📅 Reminder: The submission deadline for your project "${project.title}" is in exactly 2 days (${new Date(project.deadline).toLocaleDateString()}). Please prioritize its completion.`,
                        targetUsers: [project.student?._id, project.supervisor?._id].filter(Boolean),
                        roles: [],
                        relatedProject: project._id,
                        priority: "medium"
                    });
                } catch (err) {
                    console.error("2-Day Reminder failed:", project._id, err);
                }
            }

            // -----------------------------
            // 1-DAY REMINDER (Fallback)
            // -----------------------------
            if (diff === 1 && !project.reminder1DaySent) {
                try {
                    const updated = await Project.updateOne(
                        { _id: project._id, reminder1DaySent: false },
                        { $set: { reminder1DaySent: true } }
                    );

                    if (updated.modifiedCount === 0) continue;

                    const template = getEmailTemplate("DEADLINE_REMINDER", {
                        studentName: project.student?.name || "Student",
                        title: project.title,
                        deadline: new Date(project.deadline).toLocaleDateString()
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
                        message: `⏰ Final Reminder: The submission deadline for your project "${project.title}" is tomorrow (${new Date(project.deadline).toLocaleDateString()}). Please submit your work immediately.`,
                        targetUsers: [project.student?._id, project.supervisor?._id].filter(Boolean),
                        roles: [],
                        relatedProject: project._id,
                        priority: "high"
                    });
                } catch (err) {
                    console.error("1-Day Reminder failed:", project._id, err);
                }
            }
        }

        // ============================================
        // ❌ DEADLINE MISSED
        // ============================================
        const missedProjects = await Project.find({
            deadline: { $lt: todayStart },
            status: { $ne: "Completed" },
            deadlineMissedNotified: false
        }).populate("student supervisor");

        const admins = await User.find({ role: "Admin" });
        const adminEmails = admins.map(a => a.email).filter(Boolean);

        for (const project of missedProjects) {
            try {
                const updated = await Project.updateOne(
                    { _id: project._id, deadlineMissedNotified: false },
                    { $set: { deadlineMissedNotified: true } }
                );

                if (updated.modifiedCount === 0) continue;

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
                    message: `❌ Deadline Passed: The project "${project.title}" assigned to ${project.student?.name} has crossed its submission deadline.`,
                    targetUsers: [
                        project.student?._id,
                        project.supervisor?._id
                    ].filter(Boolean),
                    roles: ["Admin"],
                    relatedProject: project._id,
                    priority: "high"
                });

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

if (process.env.NODE_ENV !== "production") {
    runDeadlineChecker();
}