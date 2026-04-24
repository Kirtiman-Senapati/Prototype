import cron from "node-cron";
import { Project } from "../models/project.js";
import { User } from "../models/user.js";
import { sendEmail } from "../services/emailService.js";
import { getEmailTemplate } from "../utils/emailTemplates.js";
import { logActivity } from "../utils/activityLogger.js";

// Run everyday at 9:00 AM
cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running deadline checker...");

    const format = (date) => {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
    };

    // Today Date Range Boundaries
    const todayStr = format(new Date());
    const todayStart = new Date(todayStr);
    const todayEnd = new Date(todayStr);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Tomorrow Date Range Boundaries
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = format(tomorrowDate);
    const tomorrowStart = new Date(tomorrowStr);
    const tomorrowEnd = new Date(tomorrowStr);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    try {
        // ----------------------------------------------------
        // 📌 1 DAY BEFORE DEADLINE (REMINDER)
        // ----------------------------------------------------
        const nearDeadlineProjects = await Project.find({
            deadline: {
                $gte: tomorrowStart,
                $lt: tomorrowEnd
            },
            status: { $ne: "Completed" },
            reminderSent: false
        }).populate("student supervisor");

        for (const project of nearDeadlineProjects) {
            // Atomic check
            if (project.reminderSent) continue;

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

                // Activity only for student
                await logActivity({
                    actionType: "DEADLINE_REMINDER",
                    message: `Deadline nearing for project "${project.title}"`,
                    targetUsers: [project.student?._id].filter(Boolean),
                    roles: [],
                    relatedProject: project._id,
                    priority: "medium"
                });

                // ONLY mark flag to prevent duplicates if everything succeeds
                project.reminderSent = true;
                await project.save();
            } catch (err) {
                console.error("Reminder failed for project:", project._id, err);
            }
        }

        // ----------------------------------------------------
        // 📌 DEADLINE TODAY/MISSED (ESCALATION)
        // ----------------------------------------------------
        const missedProjects = await Project.find({
            deadline: {
                $lt: todayEnd // Includes today + all past missed deadlines!
            },
            status: { $ne: "Completed" },
            deadlineMissedNotified: false
        }).populate("student supervisor");

        const admins = await User.find({ role: "Admin" });
        const adminEmails = admins.map(a => a.email);

        for (const project of missedProjects) {
            // Atomic check
            if (project.deadlineMissedNotified) continue;

            try {
                const template = getEmailTemplate("DEADLINE_MISSED", {
                    studentName: project.student?.name || "Student",
                    title: project.title
                });

                // Extract unique emails avoiding duplicates if supervisor == admin etc.
                const emailSet = new Set([
                    ...(project.student?.email ? [project.student.email] : []),
                    ...(project.supervisor?.email ? [project.supervisor.email] : []),
                    ...adminEmails
                ]);
                const uniqueEmails = [...emailSet];

                if (template && uniqueEmails.length > 0) {
                    await sendEmail({
                        to: uniqueEmails,
                        subject: template.subject,
                        html: template.html,
                        role: "System"
                    });
                }

                // Activity for student, supervisor, and roles: Admin
                await logActivity({
                    actionType: "DEADLINE_MISSED",
                    message: `Deadline missed: "${project.title}" not completed by ${project.student?.name || "Student"}`,
                    targetUsers: [
                        project.student?._id,
                        project.supervisor?._id
                    ].filter(Boolean),
                    roles: ["Admin"],
                    relatedProject: project._id,
                    priority: "high"
                });

                // Mark flag to prevent duplicates
                project.deadlineMissedNotified = true;
                await project.save();
            } catch (err) {
                console.error("Missed deadline notification failed for project:", project._id, err);
            }
        }
    } catch (error) {
        console.error("Error running deadline cron job:", error);
    }
});
