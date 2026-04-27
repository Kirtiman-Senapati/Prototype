import React, { useState } from "react";
import { X } from "lucide-react";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-lg border border-slate-200 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-slate-900">Send feedback</h2>
                        {studentName && <p className="text-sm text-slate-500 mt-1">Reviewing <span className="font-semibold text-slate-700">{studentName}</span></p>}
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="px-6 py-5 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Feedback Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none"
                                placeholder="e.g., Code Review for Milestone 1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Feedback Type</label>
                            <div className="space-y-2">
                                {["Positive", "Needs Revision", "General"].map((option) => (
                                    <label
                                        key={option}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer transition
                                            ${type === option 
                                            ? "border-slate-900 bg-slate-50 text-slate-900" 
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={option}
                                            checked={type === option}
                                            onChange={(e) => setType(e.target.value)}
                                            className="accent-slate-900"
                                        />
                                        <span className="text-sm font-medium">{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                            <textarea
                                required
                                rows="4"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none resize-none custom-scrollbar"
                                placeholder="Write your detailed feedback here..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mt-auto">
                        <div className="text-xs text-slate-400">
                            This feedback will be visible to the student.
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md px-4 py-2 text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !title || !message}
                                className={`bg-slate-900 hover:bg-slate-800 text-white rounded-md px-4 py-2 text-sm transition-all flex items-center justify-center gap-2 ${(isSubmitting || !title || !message) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Send Feedback</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
