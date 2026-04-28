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

const getIconStyle = (act) => {
  switch (act.actionType) {
    case "PROJECT_APPROVED":
    case "TASK_COMPLETED":
      return "bg-emerald-50 text-emerald-600 border border-emerald-100";

    case "PROJECT_REJECTED":
    case "REQUEST_REJECTED":
      return "bg-rose-50 text-rose-600 border border-rose-100";

    case "SUPERVISOR_ASSIGNED":
    case "USER_ADDED":
      return "bg-indigo-50 text-indigo-600 border border-indigo-100";

    case "DEADLINE_SET":
      return "bg-amber-50 text-amber-600 border border-amber-100";

    default:
      return "bg-slate-100 text-slate-600 border border-slate-200";
  }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-7 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-1 text-sm">Stay updated with your project activities.</p>
        </div>
        {stats.unread > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm font-medium bg-white/80 backdrop-blur text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-out flex items-center gap-2"
          >
            <MailOpen size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06)] flex items-center gap-4 hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 ease-out">
          <div className="w-11 h-11 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center shadow-sm shrink-0"><Bell size={20} /></div>
          <div>
            <p className="text-2xl font-semibold text-slate-800 leading-none">{stats.total}</p>
            <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase mt-1">Total</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06)] flex items-center gap-4 hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 ease-out">
          <div className="w-11 h-11 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl flex items-center justify-center shadow-sm shrink-0 relative">
             <MailOpen size={20} />
             {stats.unread > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-800 leading-none">{stats.unread}</p>
            <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase mt-1">Unread</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06)] flex items-center gap-4 hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 ease-out">
          <div className="w-11 h-11 bg-green-50 text-green-600 border border-green-100 rounded-xl flex items-center justify-center shadow-sm shrink-0"><Check size={20} /></div>
          <div>
            <p className="text-2xl font-semibold text-slate-800 leading-none">{stats.read}</p>
            <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase mt-1">Read</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06)] flex items-center gap-4 hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 ease-out">
          <div className="w-11 h-11 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center justify-center shadow-sm shrink-0"><AlertTriangle size={20} /></div>
          <div>
            <p className="text-2xl font-semibold text-slate-800 leading-none">{stats.highPriority}</p>
            <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase mt-1">High Priority</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-transparent mt-4">
        {displayActivities.length > 0 ? (
          <div className="relative flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar pb-6">
            {/* Timeline Line */}
            <div className="absolute left-[20px] top-8 bottom-4 w-[2px] bg-slate-200 hidden md:block z-0"></div>

            <div className="space-y-[18px]">
              {displayActivities.map((act) => {
                const isUnread = !act.readBy?.includes(authUser?._id);
                return (
                  <div 
                    key={act._id} 
                    className="relative md:pl-16 z-10"
                  >
                    <div className="absolute left-[19px] top-4 w-2 h-2 bg-slate-300 rounded-full z-0 hidden md:block"></div>
                    {/* Icon - positioned on timeline on desktop */}
                    <div className={`hidden md:flex absolute left-0 top-1 w-10 h-10 rounded-lg items-center justify-center shrink-0 shadow-[0_1px_1px_rgba(0,0,0,0.04)] ${getIconStyle(act)}`}>
                      {getIconForType(act.actionType)}
                    </div>

                    {/* Card Content */}
                    <div className={`border px-5 py-[18px] rounded-[14px] shadow-sm hover:shadow-md transition-all duration-200 ease-out flex flex-col md:flex-row gap-[14px] items-start relative group
                      ${isUnread ? 'border-slate-200 bg-white' : 'border-slate-200/70 bg-slate-50/40'}
                    `}>
                      {/* Mobile Icon */}
                      <div className={`md:hidden w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-[0_1px_1px_rgba(0,0,0,0.04)] ${getIconStyle(act)}`}>
                        {getIconForType(act.actionType)}
                      </div>

                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-2 gap-[14px]">
                            <p className={`text-[14.5px] leading-[1.5] ${isUnread ? 'font-normal text-slate-800' : 'font-normal text-slate-500'}`}>
                              {act.message}
                            </p>
                            <span className="shrink-0 text-[11px] font-medium text-slate-400 whitespace-nowrap mt-1">
                              {formatTimeAgo(act.createdAt)}
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-medium px-2 py-1 rounded bg-slate-100 text-slate-500 uppercase tracking-wide">
                              By: {act.actor?.name || "System"}
                            </span>
                            
                            {act.priority === 'high' && (
                                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wide flex items-center gap-1">
                                  <AlertTriangle size={12}/> HIGH PRIORITY
                                </span>
                            )}

                            {!isUnread && (
                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                                  <Check size={12} /> Read
                                </span>
                            )}
                            
                            {/* Hover Actions */}
                            {isUnread && (
                                <button 
                                    onClick={() => handleMarkAsRead(act._id)}
                                    className="ml-auto opacity-0 group-hover:opacity-100 text-[11px] font-medium text-blue-600 transition-opacity bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                                >
                                    Mark as read
                                </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
