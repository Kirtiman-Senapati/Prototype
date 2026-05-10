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
            case "Approved": return <CheckCircle2 size={18} className="text-slate-600" />;
            case "Rejected": return <XCircle size={18} className="text-slate-600" />;
            case "In Review": return <AlertCircle size={18} className="text-slate-500" />;
            case "In Progress": return <Clock size={18} className="text-slate-600" />;
            case "Overdue": return <XCircle size={18} className="text-slate-600" />;
            default: return <Clock size={18} className="text-slate-400" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Approved": return "bg-slate-50 text-slate-700 border-slate-200";
            case "Rejected": return "bg-slate-50 text-slate-700 border-slate-200";
            case "In Review": return "bg-slate-100 text-slate-700 border-slate-200";
            case "In Progress": return "bg-slate-50 text-slate-700 border-slate-200";
            case "Overdue": return "bg-slate-50 text-slate-700 border-slate-200";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="pb-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800">Project Milestones</h2>
                {role !== "student" && (
                    <button 
                        onClick={onAddClick}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 uppercase tracking-wide transition-colors"
                    >
                        + Add Milestone
                    </button>
                )}
            </div>

            <div className="pt-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent hidden">
                    {/* Decorative timeline line (hidden for cleaner stacked cards layout) */}
                </div>

                <div className="flex flex-col gap-4">
                    {milestones.map((m, idx) => {

                        // Dynamic Overdue calculation
                        let displayStatus = m.status;
                        if (m.deadline && m.status !== "Approved" && m.status !== "Completed" && new Date(m.deadline) < new Date(new Date().setHours(0,0,0,0))) {
                            displayStatus = "Overdue";
                        }

                        // Footer text
                        const footerText =
                                displayStatus === "Approved"
                                ? "Milestone approved"
                                : displayStatus === "Rejected"
                                ? "Needs revision"
                                : displayStatus === "In Review"
                                ? "Waiting for review"
                                : "Awaiting submission";
                        return (
                        <div key={m._id || idx} className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(displayStatus)}
                                    <h3 className="text-sm font-bold text-slate-800">{m.title}</h3>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(displayStatus)}`}>
                                    {displayStatus}
                                </span>
                            </div>

                            <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                                {m.description || "No description provided."}
                            </p>

                            <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-medium bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-100 mb-2.5">
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

                            {/* Student Submission Remarks */}
                            {(m.studentRemarks|| m.remarks) && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-2.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                                        Student Update
                                    </p>

                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {m.studentRemarks || m.remarks}
                                </p>
                            </div>
                        )}

                        {/* Teacher/Admin Review */}
                            {displayStatus === "Rejected" && (m.reviewRemarks || m.rejectionReason) && (
                                <div className={`rounded-lg p-3 mb-2.5 border ${
                                    displayStatus === "Approved"
                                        ? "bg-green-50 border-green-200"
                                        : "bg-orange-50 border-orange-200"
                                }`}>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-orange-700 mb-1">
                                       {displayStatus === "Approved"
                                            ? "Approval Remarks"
                                            : "Revision Remarks"}
                                    </p>

                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {m.reviewRemarks || m.rejectionReason}
                                    </p>
                                </div>
                            )}

                            {/* Remarks Section */}
                           {displayStatus === "Rejected" && (m.reviewRemarks || m.rejectionReason) && (
                                <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2.5">
                                    <MessageSquare size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-700 mb-0.5">Review Remarks</p>
                                        <p className="text-[12px] text-slate-600">{m.reviewRemarks || m.rejectionReason}</p>
                                    </div>
                                </div>
                            )}

                            {/* Attached Files */}
                            {m.files && m.files.length > 0 && (
                                <div className="mb-2.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Submitted Files</p>
                                    <div className="flex flex-col gap-2">
                                        {m.files.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                                    <FileText size={16}  className="text-slate-600" />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[12px] font-medium text-slate-800 truncate">
                                                        {file.filename}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                        Submitted File
                                                    </p>
                                                </div>
                                            </div>

                                            <a
                                                href={`http://localhost:4000${file.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 text-[11px] font-semibold border border-slate-200 rounded-md hover:bg-slate-100 transition text-slate-700 shrink-0"
                                            >
                                                View
                                            </a>
                                        </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between gap-3 mt-2.5 pt-2.5 border-t border-slate-100">
    
                                <p className="text-[11px] text-slate-500 font-medium">
                                    {footerText}
                                </p>

                                {role === "student" &&
                                    m.status !== "In Review" &&
                                    m.status !== "Approved" &&
                                    m.status !== "Rejected" && (
                                    <button 
                                        onClick={() => onSubmitClick(m)}
                                        className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 transition"
                                    >
                                        <UploadCloud size={14} />
                                        Submit Work
                                    </button>
                                )}

                                {(role === "supervisor" || role === "admin") && (
                                    <div className="flex items-center gap-2 ml-auto">
            
                                    <button 
                                        onClick={() => onEditClick(m)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded-lg transition"
                                    >
                                        Edit
                                    </button>

                                    {(m.status === "In Review" || m.status === "Pending" || m.status === "In Progress") && (
                                        <button 
                                            onClick={() => onReviewClick(m)}
                                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 transition"
                                        >
                                            Review
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    )})}
                </div>
            </div>
        </div>
    );
};

export default MilestoneTimeline;
