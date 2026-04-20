import React, { useState } from "react";
import { X, Send, AlertCircle, CheckCircle, MessageSquare } from "lucide-react";

const FeedbackModal = ({ isOpen, onClose, onSubmit, isSubmitting, studentName }) => {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("General");
    const [message, setMessage] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ title, type, message });
        
        // Reset form on submit
        setTimeout(() => {
            setTitle("");
            setType("General");
            setMessage("");
        }, 300);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Send Feedback</h2>
                        {studentName && <p className="text-sm text-slate-500 mt-1">To: <span className="font-semibold text-slate-700">{studentName}</span></p>}
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Feedback Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder="e.g., Code Review for Milestone 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Feedback Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${type === 'Positive' ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                                <input type="radio" name="type" value="Positive" checked={type === 'Positive'} onChange={(e) => setType(e.target.value)} className="sr-only" />
                                <CheckCircle size={20} className={type === 'Positive' ? 'text-green-600' : 'text-slate-400'} />
                                <span className="text-sm font-medium">Positive</span>
                            </label>
                            <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${type === 'Needs Revision' ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                                <input type="radio" name="type" value="Needs Revision" checked={type === 'Needs Revision'} onChange={(e) => setType(e.target.value)} className="sr-only" />
                                <AlertCircle size={20} className={type === 'Needs Revision' ? 'text-red-500' : 'text-slate-400'} />
                                <span className="text-sm font-medium">Needs Rev</span>
                            </label>
                            <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${type === 'General' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                                <input type="radio" name="type" value="General" checked={type === 'General'} onChange={(e) => setType(e.target.value)} className="sr-only" />
                                <MessageSquare size={20} className={type === 'General' ? 'text-blue-500' : 'text-slate-400'} />
                                <span className="text-sm font-medium">General</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                        <textarea
                            required
                            rows="4"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none custom-scrollbar"
                            placeholder="Write your detailed feedback here..."
                        ></textarea>
                    </div>

                    {/* Footer / Actions */}
                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title || !message}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Send Feedback</span>
                                    <Send size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
