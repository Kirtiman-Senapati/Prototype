import { knowledgeBase } from "../utils/knowledgeBase.js";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini SDK lazily to avoid crashing if env is missing at startup
let ai = null;

// Layer 3: Escalation Keywords
const escalationKeywords = [
    "deadline over", "deadline expired", "extend deadline", "change deadline", "missed deadline",
    "project incomplete", "help incomplete", "cannot complete",
    "abuse", "idiot", "stupid", "fuck", "shit" // Basic filter placeholder
];

const escalationMessage = "Recommended Actions:\n\n• Contact your supervisor immediately\n• Review the submission policy\n• Prepare justification documents\n• Request a deadline discussion\n\nIf you require administrator support, please provide your contact number.";

export const handleAssistantQuery = async (query, user) => {
    try {
        const lowerQuery = query.toLowerCase();

        // 1. LAYER 3: Human Escalation Check (Overrides everything)
        const needsEscalation = escalationKeywords.some(keyword => lowerQuery.includes(keyword));
        if (needsEscalation) {
            // In a full implementation, you could trigger a mail notification to the admin here.
            return escalationMessage;
        }

        // 2. LAYER 1: Manual Knowledge Base Check
        let bestMatch = null;
        let maxOverlap = 0;

        for (const item of knowledgeBase) {
            const overlapCount = item.keywords.filter(keyword => lowerQuery.includes(keyword)).length;
            if (overlapCount > maxOverlap) {
                maxOverlap = overlapCount;
                bestMatch = item;
            }
        }

        if (bestMatch && maxOverlap > 0) {
            return bestMatch.answer;
        }

        // 3. LAYER 2: Gemini AI Fallback
        if (!process.env.GEMINI_API_KEY) {
            return "I couldn't find an answer in my predefined knowledge base, and my AI fallback is currently disabled. Please contact your administrator.";
        }

        if (!ai) {
            ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }

        const systemPrompt = `You are a professional Academic Support Assistant for a university project monitoring system.
Your sole purpose is to help students with academic queries such as project ideas, report formatting, tech stack suggestions, and presentation guidelines.
CRITICAL INSTRUCTIONS FOR TONE AND FORMATTING:
1. NEVER use markdown symbols like **bold** or # headings. Use plain text only.
2. Provide answers in extremely concise, readable lists using the bullet character '•'.
3. Use a formal institutional tone. Do not say "Please consider the following academic steps...", say "Recommended actions:" or "Required format:".
4. Keep the entire response under 60 words.
If the query is completely unrelated to academics or projects, politely refuse and remind them you are an academic assistant.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.2 // keep it focused, deterministic and strict
            }
        });

        return response.text;

    } catch (error) {
        console.error("Assistant Service Error:", error);
        return "I am experiencing technical difficulties. Please contact your administrator for further assistance.";
    }
};
