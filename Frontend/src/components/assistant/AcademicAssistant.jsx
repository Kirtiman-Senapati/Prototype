import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HelpCircle, User, Minimize2, Maximize2, X, Send, Minus } from "lucide-react";
import { toggleAssistant, addMessage, sendMessage, clearHistory } from "../../store/slices/assistantSlice";
import ChatMessage from "./ChatMessage";
import SupportRequestModal from "../modal/SupportRequestModal";

const AcademicAssistant = () => {
    const dispatch = useDispatch();
    const { isOpen, messages, isLoading } = useSelector((state) => state.assistant);
    const [input, setInput] = useState("");
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    if (!isOpen) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput(""); // Clear input early for better UX

        // Add user message to UI immediately
        dispatch(addMessage({
            id: Date.now(),
            role: "user",
            content: userMessage
        }));

        // Trigger backend processing
        dispatch(sendMessage(userMessage));
    };

    return (
        <>
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 ease-in-out w-full sm:w-[380px] h-[100dvh] sm:h-[550px] sm:max-h-[85vh] rounded-none sm:rounded-2xl bg-white shadow-xl border border-slate-200 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-slate-700/50">
                <div className="flex items-center gap-2.5">
                    <HelpCircle size={18} className="text-slate-300" />
                    <h3 className="font-medium text-sm tracking-wide">Academic Support Assistant</h3>
                </div>
                <div className="flex items-center text-slate-400">
                    <button 
                        onClick={() => dispatch(toggleAssistant())} 
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Minimize"
                    >
                        <Minus size={18} />
                    </button>
                    <button 
                        onClick={() => dispatch(toggleAssistant())} 
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-1"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div 
                className="flex-1 overflow-y-auto p-4 bg-slate-50/50 scroll-smooth"
                style={{ scrollbarWidth: 'thin' }}
            >
                {messages.map((msg) => (
                    <ChatMessage 
                        key={msg.id} 
                        message={msg} 
                        onOpenSupportModal={() => setIsSupportModalOpen(true)}
                    />
                ))}
                
                {isLoading && (
                    <div className="flex gap-2 mb-3 items-center">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <HelpCircle size={12} className="text-slate-700" />
                        </div>
                        <div className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 rounded-tl-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-medium">Thinking</span>
                            <div className="flex items-center gap-0.5">
                                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="px-3 pb-2 pt-1 flex flex-wrap gap-1.5 bg-slate-50/50">
                {['Project Ideas', 'Report Format', 'PPT Structure', 'Deadline Help'].map(topic => (
                    <button
                        key={topic}
                        onClick={() => {
                            dispatch(addMessage({ id: Date.now(), role: "user", content: topic }));
                            dispatch(sendMessage(topic));
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                    >
                        {topic}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-1.5 bg-white border-t border-slate-100 flex-shrink-0">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask your academic project question..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-900 text-white disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
                    >
                        <Send size={16} className={input.trim() && !isLoading ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                        Project guidance and support system
                    </span>
                </div>
            </div>
        </div>
        
        <SupportRequestModal 
            isOpen={isSupportModalOpen} 
            onClose={() => setIsSupportModalOpen(false)} 
        />
        </>
    );
};

export default AcademicAssistant;
