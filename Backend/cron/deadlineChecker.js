import cron from "node-cron";
import { Project } from "../models/project.js";
import { User } from "../models/user.js";
import { getProjectTargetUsers } from "../utils/getProjectTargetUsers.js";
import { sendEmail } from "../services/emailService.js";
import { getEmailTemplate } from "../utils/emailTemplates.js";
import { logActivity } from "../utils/activityLogger.js";

// ===============================
//  MAIN FUNCTION (IMPORTANT)
// ===============================
export const runDeadlineChecker = async () => {
    console.log("⏰ Running deadline checker...");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
        // ============================================
        //  REMINDERS (Date Difference Logic)
        // ============================================
        const pendingProjects = await Project.find({
            status: { $in: ["Approved"] },
            $or: [
                { reminder2DaySent: false },
                { reminder1DaySent: false }
            ]
        }).populate("student supervisor");

        console.log(`[CRON] Found ${pendingProjects.length} pending projects to check for reminders.`);

        for (const project of pendingProjects) {
            if (!project.deadline) continue;
            
            // Normalize dates to remove time effect
            const deadlineDate = new Date(project.deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            
            // Calculate pure days difference (100% reliable)
            const diff = Math.round((deadlineDate - todayStart) / (1000 * 60 * 60 * 24));
            
            console.log(`[CRON]  Project: "${project.title}" | Deadline: ${new Date(project.deadline).toLocaleDateString("en-GB")} | Diff: ${diff} days`);

            // -----------------------------
            // 2-DAY REMINDER
            // -----------------------------
            if (diff === 2 && !project.reminder2DaySent) {
                console.log(`[CRON]  Sending 2-day reminder for "${project.title}"`);
                try {
                    const updated = await Project.updateOne(
                        { _id: project._id, reminder2DaySent: false },
                        { $set: { reminder2DaySent: true } }
                    );

                    if (updated.modifiedCount === 0) continue;

                    const template = getEmailTemplate("DEADLINE_REMINDER", {
                        studentName: project.student?.name || "Student",
                        title: project.title,
                        deadline: new Date(project.deadline).toLocaleDateString("en-GB")
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
                        message: ` Reminder: The submission deadline for your project "${project.title}" is in exactly 2 days (${new Date(project.deadline).toLocaleDateString("en-GB")}). Please prioritize its completion.`,
                        targetUsers: await getProjectTargetUsers(project),
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
                console.log(`[CRON]  Sending 1-day reminder for "${project.title}"`);
                try {
                    const updated = await Project.updateOne(
                        { _id: project._id, reminder1DaySent: false },
                        { $set: { reminder1DaySent: true } }
                    );

                    if (updated.modifiedCount === 0) continue;

                    const template = getEmailTemplate("DEADLINE_REMINDER", {
                        studentName: project.student?.name || "Student",
                        title: project.title,
                        deadline: new Date(project.deadline).toLocaleDateString("en-GB")
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
                        message: `Final Reminder: The submission deadline for your project "${project.title}" is tomorrow (${new Date(project.deadline).toLocaleDateString("en-GB")}). Please submit your work immediately.`,
                        targetUsers: await getProjectTargetUsers(project),
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
        //  DEADLINE MISSED
        // ============================================
        const missedProjects = await Project.find({
            deadline: { $lt: todayStart },
            status: "Approved",
            deadlineMissedNotified: false
        }).populate("student supervisor");;

        console.log(`[CRON] Found ${missedProjects.length} projects with missed deadlines.`);

        const admins = await User.find({ role: "Admin" });
        const adminEmails = admins.map(a => a.email).filter(Boolean);

        for (const project of missedProjects) {
            console.log(`[CRON] Deadline missed for "${project.title}"`);
            try 
            {
                const updated = await Project.updateOne(
                {
                    _id: project._id,
                    status: "Approved",
                    deadlineMissedNotified: false
                },
                {
                    $set: {
                        status: "Incomplete",
                        deadlineMissedNotified: true
                    }
                }
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
                    message: `Deadline Passed: The project "${project.title}" assigned to ${project.student?.name} has crossed its submission deadline.`,
                    targetUsers: await getProjectTargetUsers(project),
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
// CRON SCHEDULER
// ===============================
if (process.env.CRON_ENABLED === "true") {
    cron.schedule("0 * * * *", runDeadlineChecker);
}

if (process.env.NODE_ENV !== "production") {
    runDeadlineChecker();
}