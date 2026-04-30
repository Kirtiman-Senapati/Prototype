import React, { useState } from 'react';
import { UserPlus, Briefcase, UserCircle, Clock, CheckCircle, FileText, Trash2, AlertTriangle, Info, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { clearActivities } from '../../../store/slices/activitySlice';
import { formatDateTime } from '../../../utils/timeFormat';

const ActivityList = ({ activities }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const dispatch = useDispatch();

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

    const handleClear = () => {
        dispatch(clearActivities());
    };
    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-full">
                <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <p className="text-[13px] font-medium">No recent activity</p>
                </div>
            </div>
        );
    }

    const getActivityColor = (type) => {
        if (type?.includes('COMPLETED') || type?.includes('ACCEPTED')) 
            return 'bg-emerald-500/80';
    
        if (type?.includes('ASSIGNED') || type?.includes('ADDED')) 
            return 'bg-indigo-500/80';
    
        if (type?.includes('UPDATED') || type?.includes('SET')) 
            return 'bg-amber-500/80';
    
        if (type?.includes('REJECTED') || type?.includes('DELETED')) 
            return 'bg-rose-500/80';
    
        return 'bg-slate-400';
    };

    const displayActivities = isExpanded ? activities : activities.slice(0, 5);

    const renderMessage = (text) => {
        if (!text) return null;
        // Strip emojis and leading spaces/punctuation sometimes left by emoji removal
        const cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').replace(/^[:\s\-]+/, '').trim();
        const parts = cleanText.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
        );
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-full">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-sm font-semibold text-slate-800">
                    Recent Activity
                </h2>
                <div className="flex gap-4">
                     <button onClick={handleClear} className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
                         Clear
                     </button>
                     {activities.length > 5 && (
                         <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                             {isExpanded ? 'View Less' : 'View All'}
                         </button>
                     )}
                </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                <div className="space-y-5">
                    {displayActivities.map((activity, index) => (
                        <div key={activity._id || index} className="relative flex items-start gap-4">
                            <div className={`w-2 h-2 mt-1.5 rounded-full ring-2 ring-white shadow-sm shrink-0 z-10 ${getActivityColor(activity.actionType)}`} />
                            
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                                    {renderMessage(activity.message)}
                                </p>

                                {activity.details && (
                                    <p className="text-xs text-slate-500 mt-1 truncate">
                                        {activity.details}
                                    </p>
                                )}

                                <div className="mt-1.5 flex items-center gap-2">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                        {activity.actionType?.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] text-slate-300">&bull;</span>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {formatDateTime(activity.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActivityList;
