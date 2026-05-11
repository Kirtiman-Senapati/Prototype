import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Send, HelpCircle, Minimize2, Maximize2 } from "lucide-react";
import { toggleAssistant, addMessage, sendMessage, clearHistory } from "../../store/slices/assistantSlice";
import ChatMessage from "./ChatMessage";

const AcademicAssistant = () => {
    const dispatch = useDispatch();
    const { isOpen, messages, isLoading } = useSelector((state) => state.assistant);
    const [input, setInput] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
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
        <div className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 ease-in-out ${
            isExpanded 
            ? "w-full sm:w-[600px] h-full sm:h-[700px] rounded-none sm:rounded-2xl" 
            : "w-full sm:w-[420px] h-[500px] rounded-t-2xl sm:rounded-2xl"
        } bg-white shadow-xl border border-slate-200 flex flex-col overflow-hidden`}>
            
            {/* Header */}
            <div className="bg-slate-800 text-white p-4 flex items-center justify-between flex-shrink-0 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <HelpCircle size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Academic Assistant</h3>
                        <p className="text-[10px] text-slate-300 font-medium tracking-wide uppercase">Academic Support System</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button 
                        onClick={() => dispatch(toggleAssistant())} 
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 scroll-smooth">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                
                {isLoading && (
                    <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <HelpCircle size={16} className="text-slate-700" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 rounded-tl-sm flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask your academic project question..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
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
    );
};

export default AcademicAssistant;
