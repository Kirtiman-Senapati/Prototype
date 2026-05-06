import React, { useState } from 'react';
import { UserPlus, Briefcase, UserCircle, Clock, CheckCircle, FileText, Trash2, AlertTriangle, Info, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { clearActivities, markActivitiesRead, getActivities } from '../../../store/slices/activitySlice';
import { formatDateTime } from '../../../utils/timeFormat';
import { groupActivitiesByDate } from '../../../utils/groupActivities';

const TeacherActivityList = ({ activities }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const dispatch = useDispatch();
    const { authUser } = useSelector(state => state.auth);

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

    const handleMarkAllRead = async () => {
        const unreadIds = activities
            .filter(act => !act.readBy?.includes(authUser?._id))
            .map(act => act._id);
        
        if (unreadIds.length > 0) {
            await dispatch(markActivitiesRead(unreadIds));
            await dispatch(getActivities());
        }
    };
    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-slate-100 p-6 flex flex-col items-center justify-center text-slate-500 h-64">
                <p>No recent activity</p>
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
        <div className="bg-white rounded-lg  border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-sm font-semibold text-slate-800">
                    Recent Activity
                </h2>
                <div className="flex gap-4">
                     {activities.some(act => !act.readBy?.includes(authUser?._id)) && (
                         <button onClick={handleMarkAllRead} className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                             Mark all read
                         </button>
                     )}
                     <button onClick={handleClear} className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                         Clear
                     </button>
                     {activities.length > 5 && (
                         <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                             {isExpanded ? 'View Less' : 'View All'}
                         </button>
                     )}
                </div>
            </div>
            <div className={`p-6 overflow-y-auto custom-scrollbar flex-1 ${isExpanded ? 'max-h-[500px]' : ''}`}>
                {['Today', 'Yesterday', 'Older'].map(groupName => {
                    const groupKey = groupName.toLowerCase();
                    const groupActs = groupActivitiesByDate(displayActivities)[groupKey];
                    if (!groupActs || groupActs.length === 0) return null;

                    return (
                        <div key={groupName} className="mb-6 last:mb-0">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">{groupName}</h3>
                            <div className="space-y-4">
                                {groupActs.map((activity, index) => {
                                    const isUnread = !activity.readBy?.includes(authUser?._id);
                                    
                                    return (
                                        <div 
                                            key={activity._id || index} 
                                            className="relative flex items-start gap-4 group cursor-pointer"
                                            onClick={() => {
                                                if (isUnread) {
                                                    dispatch(markActivitiesRead([activity._id]));
                                                }
                                            }}
                                        >
                                            <div className={`w-2 h-2 mt-1.5 rounded-full ring-2 ring-white shrink-0 z-10 ${getActivityColor(activity.actionType)}`} />
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-relaxed transition-colors ${isUnread ? 'text-slate-900 font-medium' : 'text-slate-600 font-normal'}`}>
                                                    {renderMessage(activity.message)}
                                                </p>

                                                {activity.details && (
                                                    <p className={`text-xs mt-1 leading-relaxed ${isUnread ? 'text-slate-600' : 'text-slate-500'}`}>
                                                        {activity.details}
                                                    </p>
                                                )}

                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                                        {activity.actionType?.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[10px] text-slate-300">&bull;</span>
                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                        {formatDateTime(activity.createdAt)}
                                                    </span>
                                                    {isUnread && (
                                                        <>
                                                            <span className="text-[10px] text-slate-300">&bull;</span>
                                                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                                                UNREAD
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeacherActivityList;
