import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getActivities, markActivitiesRead, addRealtimeActivity } from "../../store/slices/activitySlice";
import { Bell, Check, Clock, AlertTriangle, FileText, CheckCircle, Trash2, MailOpen, UserPlus, Info } from "lucide-react";
import useAutoRefresh from "../../hooks/useAutoRefresh";

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const getIconForType = (type) => {
  switch (type) {
    case 'PROPOSAL_SUBMITTED':
    case 'PROJECT_APPROVED':
    case 'PROJECT_REJECTED':
      return <FileText size={18} />;
    case 'TASK_COMPLETED':
    case 'REQUEST_ACCEPTED':
      return <CheckCircle size={18} />;
    case 'SUPERVISOR_ASSIGNED':
    case 'USER_ADDED':
    case 'NEW_USER_REGISTERED':
      return <UserPlus size={18} />;
    case 'TASK_ASSIGNED':
    case 'DEADLINE_SET':
      return <Clock size={18} />;
    case 'REQUEST_REJECTED':
    case 'USER_DELETED':
      return <Trash2 size={18} />;
    default:
      return <Info size={18} />;
  }
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { activities, isLoading } = useSelector((state) => state.activity);
  const { authUser } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getActivities());
  }, [dispatch]);

  useAutoRefresh((activity) => {
    dispatch(addRealtimeActivity(activity));
  }, "newActivity");

  const stats = useMemo(() => {
    let unreadCount = 0;
    let highPriorityCount = 0;
    
    // Fallback empty array if activities is undefined
    const validActivities = activities || [];

    validActivities.forEach((act) => {
      const isUnread = !act.readBy?.includes(authUser._id);
      if (isUnread) unreadCount++;
      if (act.priority === "high") highPriorityCount++;
    });

    return {
      total: validActivities.length,
      unread: unreadCount,
      read: validActivities.length - unreadCount,
      highPriority: highPriorityCount,
    };
  }, [activities, authUser]);

  const handleMarkAsRead = (id) => {
    dispatch(markActivitiesRead([id]));
    // Optimistically update local UI by re-fetching. In a more advanced implementation, 
    // you would update the specific item in the redux state directly.
    setTimeout(() => { dispatch(getActivities()); }, 300);
  };

  const handleMarkAllAsRead = () => {
    dispatch(markActivitiesRead());
    setTimeout(() => { dispatch(getActivities()); }, 300);
  };

  // Safe fallback
  const displayActivities = activities || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header section WhatsApp Web style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Stay updated with your project activities.</p>
        </div>
        {stats.unread > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm font-bold bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2"
          >
            <MailOpen size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 transition hover:-translate-y-1">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Bell size={20} /></div>
          <div>
            <p className="text-2xl font-black text-slate-800 leading-none">{stats.total}</p>
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-1">Total</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 transition hover:-translate-y-1">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 relative">
             <MailOpen size={20} />
             {stats.unread > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 leading-none">{stats.unread}</p>
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-1">Unread</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 transition hover:-translate-y-1">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0"><Check size={20} /></div>
          <div>
            <p className="text-2xl font-black text-slate-800 leading-none">{stats.read}</p>
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-1">Read</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 transition hover:-translate-y-1">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0"><AlertTriangle size={20} /></div>
          <div>
            <p className="text-2xl font-black text-slate-800 leading-none">{stats.highPriority}</p>
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-1">High Priority</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {displayActivities.length > 0 ? (
          <div className="divide-y divide-slate-100 flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar">
            {displayActivities.map((act) => {
              const isUnread = !act.readBy?.includes(authUser?._id);
              return (
                <div 
                  key={act._id} 
                  className={`p-5 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start transition duration-300 relative group
                    ${isUnread ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'bg-white hover:bg-slate-50'}
                  `}
                >
                  {/* Left accent border if unread */}
                  {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                  
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm border
                    ${act.priority === 'high' ? 'bg-red-50 text-red-500 border-red-100' : 
                      isUnread ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                  `}>
                    {getIconForType(act.actionType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 w-full relative">
                     <div className="flex justify-between items-start mb-1 gap-2">
                        <p className={`text-base leading-snug font-medium ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                          {act.message}
                        </p>
                        <span className="shrink-0 text-xs font-bold text-slate-400 whitespace-nowrap">
                          {formatTimeAgo(act.createdAt)}
                        </span>
                     </div>
                     
                     <div className="flex flex-wrap items-center mt-3 gap-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                          By: {act.actor?.name || "System"}
                        </span>
                        
                        {act.priority === 'high' && (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-red-100 text-red-700 border border-red-200 uppercase tracking-widest flex items-center gap-1">
                              <AlertTriangle size={12}/> HIGH PRIORITY
                            </span>
                        )}

                        {!isUnread && (
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                               <Check size={14} /> Read
                            </span>
                        )}
                        
                        {/* Hover Actions */}
                        {isUnread && (
                            <button 
                                onClick={() => handleMarkAsRead(act._id)}
                                className="ml-auto opacity-0 group-hover:opacity-100 text-xs font-bold text-blue-600 transition-opacity bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 absolute -bottom-1 md:bottom-auto md:top-8 right-2"
                            >
                                Mark as read
                            </button>
                        )}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
             <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
                <Bell size={32} className="text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-700 mb-1">No Notifications Yet</h3>
             <p className="text-slate-500 font-medium">When you get updates, they'll show up here.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;
