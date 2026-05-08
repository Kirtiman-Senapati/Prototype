import React, { useState } from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';

const ReviewMilestoneModal = ({ isOpen, onClose, onSubmit, milestone, isSubmitting }) => {
    const [remarks, setRemarks] = useState("");

    const handleSubmit = (e, status) => {
        e.preventDefault();
        onSubmit(milestone._id, status, remarks);
    };

    if (!isOpen || !milestone) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Review Milestone</h2>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">{milestone.title}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5 space-y-5">
                    <div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Review the submission for <span className="font-semibold text-slate-800">{milestone.title}</span>. You can either approve this phase to calculate towards overall progress, or reject it for revision.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Review Remarks / Feedback</label>
                        <textarea 
                            value={remarks} 
                            onChange={(e) => setRemarks(e.target.value)} 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition outline-none text-sm min-h-[100px] resize-none" 
                            placeholder="Provide feedback on the submission..." 
                        />
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button" 
                            onClick={(e) => handleSubmit(e, "Rejected")}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 rounded-xl text-rose-700 font-medium bg-rose-50 hover:bg-rose-100 border border-rose-200 active:scale-[0.98] transition flex justify-center items-center gap-1.5 text-sm disabled:opacity-70"
                        >
                            <XCircle size={16} /> Reject
                        </button>
                        <button 
                            type="button" 
                            onClick={(e) => handleSubmit(e, "Approved")}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 rounded-xl text-emerald-700 font-medium bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 active:scale-[0.98] transition flex justify-center items-center gap-1.5 text-sm disabled:opacity-70"
                        >
                            <CheckCircle2 size={16} /> Approve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewMilestoneModal;
