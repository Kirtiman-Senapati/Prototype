import { SupportRequest } from "../models/SupportRequest.js";
import { Notification } from "../models/notification.js";
import { User } from "../models/user.js";
import { sendEmail } from "../services/emailService.js";
import { getEmailTemplate } from "../utils/emailTemplates.js";

export const createSupportRequest = async (req, res, next) => {
    try {
        const { phone, type, reason } = req.body;
        const user = req.user;

        if (!phone || !type || !reason) {
            return res.status(400).json({ success: false, message: "Please provide all required fields" });
        }

        // Validate Indian phone number
        if (!/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ success: false, message: "Please provide a valid 10-digit Indian phone number" });
        }

        // 5-minute cooldown spam prevention
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentRequest = await SupportRequest.findOne({
            studentId: user._id,
            createdAt: { $gte: fiveMinutesAgo }
        });

        if (recentRequest) {
            return res.status(429).json({
                success: false,
                message: "You have recently submitted a request. Please wait a few minutes before submitting another one."
            });
        }

        // Create the Support Request
        const supportRequest = await SupportRequest.create({
            studentId: user._id,
            projectId: user.project || null,
            phone,
            type,
            reason
        });

        // Notify Admins
        const admins = await User.find({ role: "Admin" });
        if (admins.length > 0) {
            // Dashboard Notifications
            const notifications = admins.map(admin => ({
                user: admin._id,
                message: `New ${type} Request from ${user.name}`,
                type: "Support Request"
            }));
            await Notification.insertMany(notifications);

            // Async Email Sending (Non-blocking)
            const emailData = getEmailTemplate("SUPPORT_REQUEST", {
                studentName: user.name,
                phone,
                type,
                reason
            });

            if (emailData) {
                admins.forEach(admin => {
                    if (admin.email) {
                        sendEmail({
                            to: admin.email,
                            subject: emailData.subject,
                            html: emailData.html
                        }).catch(err => console.error("Escalation email failed:", err.message));
                    }
                });
            }
        }

        res.status(201).json({
            success: true,
            message: "Your request has been submitted successfully.",
            data: supportRequest
        });
    } catch (error) {
        next(error);
    }
};
