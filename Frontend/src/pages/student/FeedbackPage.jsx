import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentFeedback } from "../../store/slices/studentSlice";
import { MessageSquare, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { toast } from "react-toastify";

const FeedbackPage = () => {
  const dispatch = useDispatch();
  const { feedbacks, isLoading } = useSelector((state) => state.student);

  useEffect(() => {
    dispatch(getStudentFeedback());
  }, [dispatch]);

  const totalFeedback = feedbacks?.length || 0;
  const positiveCount = feedbacks?.filter(f => f.type === 'Positive').length || 0;
  const revisionCount = feedbacks?.filter(f => f.type === 'Needs Revision').length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header Profile section style */}
      <div className="bg-white border text-center md:text-left border-slate-200 p-8 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Feedback Timeline</h1>
        <p className="text-slate-500 mt-1">Track and review all evaluations from your supervisors and administrators.</p>
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="flex flex-col items-center md:items-start p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><MessageSquare size={14}/> Total</span>
                <span className="text-2xl font-black text-slate-700">{totalFeedback}</span>
            </div>
            <div className="flex flex-col items-center md:items-start p-4 bg-green-50 rounded-xl border border-green-100">
                <span className="text-[11px] font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><CheckCircle size={14}/> Positive</span>
                <span className="text-2xl font-black text-green-700">{positiveCount}</span>
            </div>
            <div className="flex flex-col items-center md:items-start p-4 bg-red-50 rounded-xl border border-red-100">
                <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><AlertCircle size={14}/> Revise</span>
                <span className="text-2xl font-black text-red-700">{revisionCount}</span>
            </div>
        </div>
      </div>

      {isLoading && (!feedbacks || feedbacks.length === 0) ? (
        <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks && feedbacks.length > 0 ? (
              feedbacks.map((f, i) => (
                 <div key={f._id || i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6">
                    {/* Timestamp Sidebar */}
                    <div className="md:w-[150px] shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-1">
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                            {new Date(f.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                            {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <div className="md:mt-auto hidden md:flex items-center gap-1 text-[10px] uppercase font-bold text-slate-300">
                            <Calendar size={12}/> {new Date(f.createdAt).getFullYear()}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <h3 className="font-bold text-lg text-slate-800">{f.title}</h3>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${
                                f.type === 'Positive' ? 'bg-green-50 text-green-700 border-green-200' :
                                f.type === 'Needs Revision' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                                {f.type}
                            </span>
                        </div>
                        
                        <p className="text-[15px] leading-relaxed text-slate-600 mb-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                            {f.message}
                        </p>

                        <div className="flex items-center gap-2.5 mt-auto">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                                {f.sender?.name ? f.sender.name.substring(0, 2).toUpperCase() : '?'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">{f.sender?.name || "Unknown"}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                    f.senderRole === "Admin" ? "text-purple-600" : "text-blue-500"
                                }`}>
                                    {f.senderRole}
                                </span>
                            </div>
                        </div>
                    </div>
                 </div>
              ))
          ) : (
              <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-slate-200 border-dashed">
                  <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">No Feedback Yet</h3>
                  <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">You haven't received any feedback from your supervisors or administrators yet.</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;

