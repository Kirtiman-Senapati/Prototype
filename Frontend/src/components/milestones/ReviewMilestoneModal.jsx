import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Send, MessageCircle } from 'lucide-react';
import { toast } from '../../utils/toast';
import { useSelector } from "react-redux";

const ReviewMilestoneModal = ({ isOpen, onClose, onSubmit, milestone, projectId, isSubmitting }) => {
    const [remarks, setRemarks] = useState("");
    const [commentText, setCommentText] = useState("");
    const [isCommenting, setIsCommenting] = useState(false);
    
    const authUser = useSelector((state) => state.auth.authUser);
    useEffect(() => {
        if (!isOpen) {
            setRemarks("");
            setCommentText("");
        }
    }, [isOpen]);

    const handleSubmit = (e, status) => {
        e.preventDefault();
        onSubmit(milestone._id, status, remarks);
        setRemarks("");
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !projectId) return;

        setIsCommenting(true);
        try {

            const { axiosInstance } = await import("../../lib/axios");
            const rolePath = authUser?.role?.toLowerCase() === "supervisor" ? "teacher" : authUser?.role?.toLowerCase();

            await axiosInstance.post(
                `/${rolePath}/project/${projectId}/milestone/${milestone._id}/comment`,
                { message: commentText }
            );

            toast.success("Comment added");
            setCommentText("");

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to add comment"
            );

        } finally {

            setIsCommenting(false);
        }
    };

    if (!isOpen || !milestone) return null;

    // Combine legacy fields and new comments into a unified array if needed, but the backend now tracks comments.
    const hasLegacyRemarks = milestone.studentRemarks || milestone.reviewRemarks;
    const comments = milestone?.comments || [];

    const hasComments = comments.length > 0;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MessageCircle className="text-slate-500" size={20} />
                            Milestone Discussion
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mt-1">{milestone.title}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Timeline / Chat Area */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white space-y-4">
                    {/* Legacy Fallback */}
                    {!hasComments && hasLegacyRemarks && (
                        <div className="space-y-4">
                            {milestone.studentRemarks && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-slate-700">Student</span>
                                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Legacy</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{milestone.studentRemarks}</p>
                                </div>
                            )}
                            {milestone.reviewRemarks && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-slate-700">Reviewer</span>
                                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Legacy</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{milestone.reviewRemarks}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* New Timeline Comments */}
                    {hasComments && (
                        <div className="space-y-4">
                            {comments.map((comment, index) => (
                                <div key={comment._id || index} className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800">{comment.name}</span>
                                            <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{comment.role}</span>
                                            {comment.actionType && comment.actionType !== "COMMENT" && (
                                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                    comment.actionType === 'APPROVED' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' :
                                                    comment.actionType === 'REJECTED' ? 'text-red-600 bg-red-50 border border-red-100' :
                                                    'text-blue-600 bg-blue-50 border border-blue-100'
                                                }`}>
                                                    {comment.actionType}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {comment.createdAt
                                                ? `${new Date(comment.createdAt).toLocaleDateString('en-GB')} • ${new Date(comment.createdAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}`
                                                : 'Now'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{comment.message}</p>
                                </div>
                            ))}
                            
                        </div>
                    )}

                    {!hasComments && !hasLegacyRemarks && (
                        <div className="text-center py-8 text-slate-400 text-sm italic">
                            No discussion history for this milestone yet.
                        </div>
                    )}
                </div>

                {/* Comment Input */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <form onSubmit={handleComment} className="flex gap-2">
                        <input 
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Type a comment..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition outline-none"
                        />
                        <button 
                            type="submit" 
                            disabled={isCommenting || !commentText.trim()}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold"
                        >
                            <Send size={16} /> Post
                        </button>
                    </form>
                </div>

                {/* Review Action Panel (Only if not approved/rejected) */}
                <div className="p-5 border-t border-slate-200 bg-white">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Final Decision</label>
                    <div className="flex gap-2 mb-3">
                        <textarea 
                            value={remarks} 
                            onChange={(e) => setRemarks(e.target.value)} 
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition outline-none text-sm min-h-[44px] resize-none" 
                            placeholder="Optional remarks before decision..." 
                        />
                    </div>
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={(e) => handleSubmit(e, "Rejected")}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 rounded-xl text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-[0.98] transition flex justify-center items-center gap-2 text-sm disabled:opacity-70"
                        >
                            <XCircle size={16} /> Request Revision
                        </button>
                        <button 
                            type="button" 
                            onClick={(e) => handleSubmit(e, "Approved")}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition flex justify-center items-center gap-2 text-sm disabled:opacity-70"
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
