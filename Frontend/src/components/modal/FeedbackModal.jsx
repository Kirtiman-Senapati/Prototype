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
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-slate-900">Send feedback</h2>
                        {studentName && <p className="text-sm text-slate-500">Reviewing <span className="font-medium text-slate-700">{studentName}</span></p>}
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors mt-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Feedback Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none transition-all text-sm"
                            placeholder="e.g., Code Review for Milestone 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Feedback Type</label>
                        <div className="space-y-2">
                            {["Positive", "Needs Revision", "General"].map((option) => (
                                <label
                                    key={option}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                        <textarea
                            required
                            rows="4"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 outline-none transition-all resize-none custom-scrollbar text-sm"
                            placeholder="Write your detailed feedback here..."
                        ></textarea>
                    </div>

                    {/* Footer / Actions */}
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between pt-5 mt-2 border-t border-slate-100 gap-4 sm:gap-0">
                        <div className="text-xs text-slate-400">
                            This feedback will be visible to the student.
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 bg-transparent transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !title || !message}
                                className="px-5 py-2.5 rounded-md bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
