import React from "react";
import { User, HelpCircle } from "lucide-react";

const ChatMessage = ({ message }) => {
    const isUser = message.role === "user";

    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"}`}>
                {isUser ? <User size={16} /> : <HelpCircle size={16} />}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                isUser 
                ? "bg-slate-800 text-white rounded-tr-sm" 
                : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            }`}>
                <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                </p>
            </div>
        </div>
    );
};

export default ChatMessage;
