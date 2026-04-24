import React, { useState } from 'react';
import { UserPlus, Briefcase, UserCircle, Clock, CheckCircle, FileText, Trash2, AlertTriangle, Info, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { clearActivities } from '../../../store/slices/activitySlice';

const ActivityList = ({ activities }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const dispatch = useDispatch();

    const formatDate = (dateValue) => {
        const date = new Date(dateValue);
        return `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    };

    const handleClear = () => {
        dispatch(clearActivities());
    };
    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-slate-500 h-64">
                <p>No recent activity</p>
            </div>
        );
    }

    const getActivityIcon = (type) => {
        if (type?.includes('PROPOSAL') || type?.includes('PROJECT')) return <FileText size={18} className="text-blue-500" />;
        if (type?.includes('ACCEPTED') || type?.includes('COMPLETED')) return <CheckCircle size={18} className="text-emerald-500" />;
        if (type?.includes('REJECTED') || type?.includes('DELETED')) return <Trash2 size={18} className="text-red-500" />;
        if (type?.includes('ADDED') || type?.includes('REGISTERED')) return <UserPlus size={18} className="text-purple-500" />;
        if (type?.includes('ASSIGNED')) return <Briefcase size={18} className="text-indigo-500" />;
        return <Info size={18} className="text-slate-500" />;
    };

    const getBgColor = (priority) => {
        if (priority === 'high') return 'bg-red-50 border-red-100';
        if (priority === 'medium') return 'bg-amber-50 border-amber-100';
        return 'bg-slate-50 border-slate-100';
    };

    const displayActivities = isExpanded ? activities : activities.slice(0, 5);

    const renderMessage = (text) => {
        if (!text) return null;
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center sticky top-0 z-10">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    Recent Activity
                </h2>
                <div className="flex gap-3">
                     <button onClick={handleClear} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider">
                         Clear
                     </button>
                     {activities.length > 5 && (
                         <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider flex items-center">
                             {isExpanded ? 'View Less' : 'View All'} {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14} />}
                         </button>
                     )}
                </div>
            </div>
            <div className={`divide-y divide-slate-100 overflow-y-auto custom-scrollbar flex-1 ${isExpanded ? 'max-h-[500px]' : ''}`}>
                {displayActivities.map((activity, index) => (
                    <div key={activity._id || index} className="p-5 flex gap-4 items-start hover:bg-slate-50 transition-colors group">
                        <div className={`p-2.5 rounded-full mt-0.5 border ${getBgColor(activity.priority)}`}>
                            {getActivityIcon(activity.actionType)}
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-700 font-medium text-[13px] whitespace-pre-wrap leading-relaxed">{renderMessage(activity.message)}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shadow-sm ${
                                    activity.actionType?.includes("ACCEPTED") || activity.actionType?.includes("COMPLETED") || activity.actionType?.includes("APPROVED") ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    activity.actionType?.includes("REJECTED") || activity.actionType?.includes("DELETED") ? "bg-red-50 text-red-700 border-red-200" :
                                    "bg-blue-50 text-blue-700 border-blue-200"
                                }`}>
                                    {activity.actionType?.split('_').join(' ')}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400">
                                    {formatDate(activity.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityList;
