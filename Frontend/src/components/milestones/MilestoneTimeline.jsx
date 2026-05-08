import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, FileText, UploadCloud, MessageSquare } from 'lucide-react';

const MilestoneTimeline = ({ 
    milestones, 
    onAddClick, 
    onEditClick, 
    onSubmitClick, 
    onReviewClick,
    role = "student" // "student", "supervisor", "admin"
}) => {
    
    if (!milestones || milestones.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                    <FileText size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-800">No Milestones Found</p>
                <p className="text-xs text-slate-500 mt-1">There are no phase-wise milestones assigned yet.</p>
                {role !== "student" && (
                    <button 
                        onClick={onAddClick}
                        className="mt-4 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-800 transition"
                    >
                        Add Milestone
                    </button>
                )}
            </div>
        );
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case "Approved": return <CheckCircle2 size={18} className="text-emerald-500" />;
            case "Rejected": return <XCircle size={18} className="text-rose-500" />;
            case "In Review": return <AlertCircle size={18} className="text-blue-500" />;
            case "In Progress": return <Clock size={18} className="text-amber-500" />;
            case "Overdue": return <XCircle size={18} className="text-rose-600" />;
            default: return <Clock size={18} className="text-slate-400" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Rejected": return "bg-rose-50 text-rose-700 border-rose-200";
            case "In Review": return "bg-blue-50 text-blue-700 border-blue-200";
            case "In Progress": return "bg-amber-50 text-amber-700 border-amber-200";
            case "Overdue": return "bg-rose-50 text-rose-700 border-rose-200";
            default: return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800">Project Milestones</h2>
                {role !== "student" && (
                    <button 
                        onClick={onAddClick}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-wide transition-colors"
                    >
                        + Add Milestone
                    </button>
                )}
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent hidden">
                    {/* Decorative timeline line (hidden for cleaner stacked cards layout) */}
                </div>

                <div className="flex flex-col gap-4">
                    {milestones.map((m, idx) => (
                        <div key={m._id || idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:-translate-y-[1px] transition-all shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(m.status)}
                                    <h3 className="text-sm font-bold text-slate-800">{m.title}</h3>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(m.status)}`}>
                                    {m.status}
                                </span>
                            </div>

                            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                                {m.description || "No description provided."}
                            </p>

                            <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                                <div>
                                    <span className="text-slate-400 uppercase tracking-wide mr-1">Due:</span>
                                    <span className="text-slate-700">{m.deadline ? new Date(m.deadline).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                {m.completedAt && (
                                    <div>
                                        <span className="text-slate-400 uppercase tracking-wide mr-1">Completed:</span>
                                        <span className="text-slate-700">{new Date(m.completedAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Remarks Section */}
                            {(m.reviewRemarks || m.rejectionReason) && (
                                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                                    <MessageSquare size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-700 mb-0.5">Review Remarks</p>
                                        <p className="text-[12px] text-slate-600">{m.reviewRemarks || m.rejectionReason}</p>
                                    </div>
                                </div>
                            )}

                            {/* Attached Files */}
                            {m.files && m.files.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Submitted Files</p>
                                    <div className="flex flex-col gap-1">
                                        {m.files.map((file, i) => (
                                            <a 
                                                key={i} 
                                                href={`http://localhost:5000${file.url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[12px] text-blue-600 hover:underline flex items-center gap-1 truncate max-w-full"
                                            >
                                                <FileText size={12} />
                                                {file.filename}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 justify-end">
                                {role === "student" && (m.status === "Pending" || m.status === "In Progress" || m.status === "Rejected") && (
                                    <button 
                                        onClick={() => onSubmitClick(m)}
                                        className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 transition shadow-sm"
                                    >
                                        <UploadCloud size={14} /> Submit Work
                                    </button>
                                )}

                                {(role === "supervisor" || role === "admin") && (
                                    <>
                                        <button 
                                            onClick={() => onEditClick(m)}
                                            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 transition"
                                        >
                                            Edit
                                        </button>
                                        {(m.status === "In Review" || m.status === "Pending" || m.status === "In Progress") && (
                                            <button 
                                                onClick={() => onReviewClick(m)}
                                                className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 transition shadow-sm"
                                            >
                                                Review
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MilestoneTimeline;
