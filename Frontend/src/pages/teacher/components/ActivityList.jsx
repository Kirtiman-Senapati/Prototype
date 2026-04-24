import React, { useState } from 'react';
import { UserPlus, Briefcase, UserCircle, Clock, CheckCircle, FileText, Trash2, AlertTriangle, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { clearActivities } from '../../../store/slices/activitySlice';
import { formatDateTime } from '../../../utils/timeFormat';

const ActivityList = ({ activities }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const dispatch = useDispatch();

    const handleClear = () => {
        dispatch(clearActivities());
    };

    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
        if (diffInSeconds < 172800) return "Yesterday";
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };
    if (!activities || activities.length === 0) {
        return (
            <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-8 text-center text-slate-500">
                No recent activity.
            </div>
        );
    }

    const getActivityIcon = (type) => {
        if (type?.includes('PROPOSAL') || type?.includes('PROJECT') || type?.includes('FILE')) return <FileText size={18} className="text-blue-500" />;
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
                    <div key={activity._id || index} className="flex gap-3 p-4 rounded-xl border border-transparent hover:border-slate-200 hover:shadow-sm transition bg-white mb-2 mx-4 mt-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${getBgColor(activity.priority)}`}>
                            {getActivityIcon(activity.actionType)}
                        </div>

                        <div className="flex-1">
                            <p className="text-[13px] text-slate-800 font-medium leading-relaxed">
                                {renderMessage(activity.message)}
                            </p>

                            {activity.details && (
                                <p className="text-[12.5px] text-slate-500 mt-1 border-l-2 border-slate-200 pl-2">
                                    {activity.details}
                                </p>
                            )}

                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-medium">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold tracking-wider uppercase text-[10px]">
                                    {activity.actionType?.replace(/_/g, " ")}
                                </span>
                                <span>•</span>
                                <span>{formatDateTime(activity.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityList;