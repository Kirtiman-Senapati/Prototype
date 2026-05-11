import React, { useState } from 'react';
import { CheckSquare, FolderKanban, ChevronRight, FileText, UploadCloud, MessageSquare } from 'lucide-react';

// Unified Project Workspace Component
const ProjectWorkspace = ({ project, workspaceItems = [], completingTasks, onMarkTaskDone, onMilestoneSubmitClick }) => {
    
    // Sort items by deadline
    const sortedItems = [...workspaceItems].sort((a,b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    });

    if (!sortedItems || sortedItems.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[280px] overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div>
                        <h2 className="text-[17px] font-semibold text-slate-900">Project Milestones</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Active Milestones</p>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <FolderKanban size={28} />
                    <p className="mt-2 text-sm font-medium">No milestones yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden h-full">
            {/* Unified Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-white flex justify-between items-center">
                <div>
                    <h2 className="text-[17px] font-semibold text-slate-900">Milestones</h2>
                </div>
                <button 
                    onClick={() => document.getElementById('open-timeline-modal-btn')?.click()}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                    View All
                </button>
            </div>

            <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-white">
                        <tr className="border-b border-slate-100">
                            <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Milestone</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Type</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Deadline</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Status</th>
                            <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] text-right">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedItems.map((item) => {
                            const isTask = item.type === "task";
                            const isPhase = item.type === "phase";
                            
                            // Dynamic Overdue calculation
                            let displayStatus = item.status;
                            if (item.deadline && item.status !== "Approved" && item.status !== "Completed" && new Date(item.deadline) < new Date(new Date().setHours(0,0,0,0))) {
                                displayStatus = "Overdue";
                            }

                            // Submittable checking
                            const canSubmit = isPhase && (displayStatus === "Pending" || displayStatus === "In Progress" || displayStatus === "Rejected");
                            const canComplete = isTask && displayStatus !== "Completed";

                            return (
                                <tr key={item._id} className="hover:bg-slate-50/70 transition-colors group bg-white">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            {isTask ? (
                                                <CheckSquare size={16} className={`shrink-0 ${displayStatus === 'Completed' ? 'text-slate-300' : 'text-slate-500'}`} />
                                            ) : (
                                                <FolderKanban size={16} className={`shrink-0 ${displayStatus === 'Approved' ? 'text-slate-300' : 'text-slate-500'}`} />
                                            )}
                                            <div className="min-w-0">
                                                <h3 className={`text-[13px] font-semibold leading-snug truncate transition-colors ${
                                                    (displayStatus === 'Completed' || displayStatus === 'Approved') 
                                                        ? 'text-slate-400 line-through' 
                                                        : 'text-slate-800'
                                                }`}>
                                                    {item.title}
                                                </h3>
                                                <div className="text-[10px] font-normal text-slate-500 mt-0">
                                                    Assigned by {item.assignedByName || (item.assignedByRole === 'admin' ? 'Admin' : 'Supervisor')}
                                                </div>
                                                {(item.files?.length > 0 || item.remarks || item.rejectionReason || item.feedback) && (
                                                    <div className="flex gap-2 mt-1">
                                                        {item.files?.length > 0 && <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500"><FileText size={10} /> {item.files.length}</span>}
                                                        {(item.remarks || item.rejectionReason || item.feedback) && <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500"><MessageSquare size={10} /> Feedback</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                                            isTask ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`text-[12px] font-medium ${displayStatus === 'Overdue' ? 'text-red-500' : 'text-slate-500'}`}>
                                            {item.deadline ? new Date(item.deadline).toLocaleDateString("en-GB") : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`text-[11px] font-medium uppercase tracking-wide ${
                                            (displayStatus === 'Completed' || displayStatus === 'Approved') ? 'text-slate-400' :
                                            displayStatus === 'Overdue' ? 'text-red-600' :
                                            displayStatus === 'Rejected' ? 'text-orange-600' :
                                            'text-slate-700'
                                        }`}>
                                            {displayStatus}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        {isTask && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onMarkTaskDone(item)}
                                                    disabled={!canComplete || completingTasks[item._id]}
                                                    className={`text-[11px] font-medium uppercase tracking-wide px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
                                                        displayStatus === 'Completed' ? 'text-slate-400 bg-transparent' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                                                    }`}
                                                >
                                                    {displayStatus === 'Completed' ? "Done" : completingTasks[item._id] ? "..." : "Mark Done"}
                                                </button>
                                            </div>
                                        )}
                                        
                                        {isPhase && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        // Use the unified timeline modal
                                                        document.getElementById('open-timeline-modal-btn')?.click();
                                                    }}
                                                    className="flex items-center justify-end gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                                                >
                                                    View <ChevronRight size={12} strokeWidth={1.8} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectWorkspace;
