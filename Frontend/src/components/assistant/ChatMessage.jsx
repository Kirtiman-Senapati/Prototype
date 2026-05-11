import React from "react";
import { User, HelpCircle } from "lucide-react";

const ChatMessage = ({ message }) => {
    const isUser = message.role === "user";
    
    // Strip basic markdown that AI might accidentally send
    const cleanContent = message.content.replace(/\*\*/g, "").replace(/#/g, "");

    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-3`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"}`}>
                {isUser ? <User size={14} /> : <HelpCircle size={14} />}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-[13px] ${
                isUser 
                ? "bg-slate-800 text-white rounded-tr-sm" 
                : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            }`}>
                <p className="whitespace-pre-wrap leading-[1.5]">
                    {cleanContent}
                </p>
            </div>
        </div>
    );
};

export default ChatMessage;
