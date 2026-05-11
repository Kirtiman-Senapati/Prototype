import { handleAssistantQuery } from "../services/assistantService.js";

export const chatWithAssistant = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const reply = await handleAssistantQuery(message, req.user);

        res.status(200).json({
            success: true,
            reply
        });
    } catch (error) {
        next(error);
    }
};
