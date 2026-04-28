import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentDashboard, getStudentFeedback, updateTaskStatus } from "../../store/slices/studentSlice";
import { getActivities, addRealtimeActivity } from "../../store/slices/activitySlice";
import { BookOpen, Clock, Loader, XCircle, AlertCircle, ArrowRight, FolderKanban, GraduationCap, MessageSquare, CheckSquare } from "lucide-react";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { formatDateTime } from "../../utils/timeFormat";
import { toast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";
import MessageModal from "./components/MessageModal";
import StatCard from "../admin/components/StatCard";
import ActivityList from "../admin/components/ActivityList";

// Component: TasksList (Mirrors Admin ProjectList)
const TasksList = ({ tasks, completingTasks, onMarkDone }) => {
    if (!tasks || tasks.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[300px]">
                <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-800">Assigned Tasks</h2>
                </div>
                <div className="p-10 flex flex-col items-center justify-center text-slate-500 flex-1">
                    <div className="mb-3 text-slate-300">
                        <CheckSquare size={32} strokeWidth={1.5} />
                    </div>
                    <p className="text-[13px] font-medium">No assigned tasks</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800">Assigned Tasks</h2>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{tasks.length} Total</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Task Name</th>
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Deadline</th>
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[...tasks].sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((task) => (
                            <tr key={task._id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-5 py-4">
                                    <h3 className={`text-sm font-semibold leading-snug line-clamp-1 transition-colors ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-blue-600'}`}>{task.title}</h3>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-xs text-slate-500 font-medium">
                                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <button
                                        onClick={() => onMarkDone(task)}
                                        disabled={task.status === 'Completed' || completingTasks[task._id]}
                                        className={`text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${task.status === 'Completed' ? 'text-slate-400 bg-transparent' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
                                    >
                                        {task.status === 'Completed' ? "Done" : completingTasks[task._id] ? "..." : "Mark Done"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Component: ProjectOverview
const ProjectOverview = ({ project, onUpdate }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800">Project Overview</h2>
                {project.supervisor && (
                    <button 
                        onClick={onUpdate}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wide"
                    >
                        Update Supervisor
                    </button>
                )}
            </div>
            <div className="p-5 flex-1">
                <div className="flex items-center gap-2 mb-4">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                        project.status === 'Completed' ? 'bg-emerald-500' :
                        project.status === 'Approved' ? 'bg-indigo-500' :
                        project.status === 'Pending' ? 'bg-amber-500' :
                        'bg-rose-500'
                    }`} />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{project.status}</span>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                    {project.description}
                </p>
            </div>
        </div>
    );
};

// Component: NotificationList
const NotificationList = ({ notifications, title = "System Notifications" }) => {
    const renderMessage = (text) => {
        if (!text) return null;
        const cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').replace(/^[:\s\-]+/, '').trim();
        const parts = cleanText.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
        );
    };

    if (!notifications || notifications.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[400px]">
                <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                </div>
                <div className="p-6 flex flex-col items-center justify-center text-slate-500 flex-1">
                    <p className="text-[13px]">No recent notifications</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[400px]">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-5">
                    {notifications.map((activity, index) => (
                        <div key={activity._id || index} className="relative flex items-start gap-4">
                            <div className="w-2 h-2 mt-1.5 rounded-full ring-2 ring-white shadow-sm shrink-0 z-10 bg-indigo-500/80" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                                    {renderMessage(activity.message)}
                                </p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                        {activity.actionType?.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] text-slate-300">•</span>
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

// Component: FeedbackList
const FeedbackList = ({ feedbacks }) => {
    if (!feedbacks || feedbacks.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[200px]">
                <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-800">Latest Feedback</h2>
                </div>
                <div className="p-10 flex flex-col items-center justify-center text-slate-500 flex-1">
                    <MessageSquare size={24} strokeWidth={1.5} className="mb-2 text-slate-300" />
                    <p className="text-[13px] font-medium">No recent feedback</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[300px]">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-sm font-semibold text-slate-800">Latest Feedback</h2>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                {feedbacks.map((fb, idx) => (
                    <div key={idx} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="text-[13px] font-semibold text-slate-800">{fb.title}</h4>
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${
                                fb.type === 'Positive' ? 'text-emerald-600' :
                                fb.type === 'Needs Revision' ? 'text-rose-600' :
                                'text-slate-500'
                            }`}>
                                {fb.type}
                            </span>
                        </div>
                        <p className="text-[13px] text-slate-600 mt-1">{fb.message}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-2 flex justify-between">
                            <span>{fb.sender?.name || "Unknown"}</span>
                            <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { project, requests, feedbacks, isLoading } = useSelector((state) => state.student);
  const { activities } = useSelector((state) => state.activity);
  const { authUser } = useSelector((state) => state.auth);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [completingTasks, setCompletingTasks] = useState({});
  const [isCompletingProject, setIsCompletingProject] = useState(false);

  const handleCompleteProject = async () => {
      try {
          setIsCompletingProject(true);
          const { axiosInstance } = await import("../../lib/axios");
          await axiosInstance.put(`/student/complete-project/${project._id}`);
          toast.success("Project marked as completed successfully! 🎉");
          dispatch(getStudentDashboard());
          dispatch(getActivities());
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to mark project as completed");
      } finally {
          setIsCompletingProject(false);
      }
  };

  const handleMarkTaskDone = async (task) => {
      if (task.status === 'Completed' || completingTasks[task._id]) return;
      setCompletingTasks(prev => ({ ...prev, [task._id]: true }));
      await dispatch(updateTaskStatus({ taskId: task._id, status: 'Completed' }));
      setCompletingTasks(prev => ({ ...prev, [task._id]: false }));
  };

  useEffect(() => {
    dispatch(getStudentDashboard());
    dispatch(getStudentFeedback());
    dispatch(getActivities());
  }, [dispatch]);

  // Real-Time Auto Refresh via Global Socket
  useAutoRefresh(() => {
    dispatch(getStudentDashboard());
    dispatch(getStudentFeedback());
    dispatch(getActivities());
  });

  useAutoRefresh((data) => {
      if (data && data.status === "Accepted") toast.success("Great news! Your supervisor request was accepted.");
      else if (data && data.status === "Rejected") toast.error("Your supervisor request was rejected.");
      dispatch(getStudentDashboard());
  }, "requestStatusUpdated");

  useAutoRefresh((data) => {
      if (!data || !data.deadline) return;
      toast.info(<div>A new project deadline has been set.</div>, { icon: "📅" });
      dispatch(getStudentDashboard());
  }, "deadlineUpdated");

  useAutoRefresh((data) => {
      if (data && data.status === "Approved") toast.success("Your project proposal was APPROVED.");
      else if (data && data.status === "Rejected") toast.error("Your project proposal was REJECTED.");
      dispatch(getStudentDashboard());
  }, "projectStatusUpdated");

  useAutoRefresh(() => {
      toast.success("Supervisor directly assigned!");
      dispatch(getStudentDashboard());
  }, "supervisorAssignedAdmin");

  useAutoRefresh((activity) => {
      dispatch(addRealtimeActivity(activity));
  }, "newActivity");

  useAutoRefresh(() => {
      toast.info("You just received new feedback!", { icon: "💬" });
      dispatch(getStudentFeedback());
  }, "newFeedback");

  if (isLoading && !project) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  let displayStatus = "No request";
  let latestRequest = null;
  
  if (project?.supervisor) {
      displayStatus = "Accepted";
  } else if (!project) {
      displayStatus = "No Proposal";
  } else if (requests && requests.length > 0) {
      const supervisorRequests = requests.filter(r => r.type === "Supervisor");
      if (supervisorRequests.length > 0) {
          latestRequest = [...supervisorRequests].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          if (latestRequest.status === "Pending") displayStatus = "Pending";
          else if (latestRequest.status === "Rejected") displayStatus = "Rejected";
      }
  }

  const selfActivities = activities?.filter(a => {
      const actorId = (a.actor?._id || a.actor)?.toString();
      return actorId === authUser?._id?.toString();
  }) || [];

  const sysActivities = activities?.filter(a => {
      const actorId = (a.actor?._id || a.actor)?.toString();
      return actorId !== authUser?._id?.toString();
  }) || [];

  return (
    <div className="space-y-8 pb-10 bg-[#F9FAFB] min-h-screen px-4 sm:px-6 lg:px-8">
      
      {/* Premium Header Section */}
      <div className="pt-2 pb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {authUser?.name?.split(' ')[0] || "Student"}</h1>
            <p className="text-slate-500 mt-2 font-medium">
                {project ? "Track your progress, tasks and feedback in one place." : "Let's submit your academic project proposal to get started."}
            </p>
        </div>
        {project && project.status === 'Approved' && project.supervisor && (
            <div className="flex items-center gap-2 sm:mt-1">
                <button 
                    onClick={handleCompleteProject}
                    disabled={isCompletingProject}
                    className="flex items-center justify-center px-4 h-9 text-[13px] font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all duration-150 shadow-sm disabled:opacity-50"
                >
                    {isCompletingProject ? "Completing..." : "Complete Project"}
                </button>
            </div>
        )}
      </div>

      {/* 🟣 NO PROPOSAL STATE */}
      {!project && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-5 shadow-sm">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                 <BookOpen size={32} />
             </div>
             <div className="max-w-md mx-auto">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">Submit Your Proposal</h2>
                 <p className="text-slate-500 mt-2 text-[13px] font-medium leading-relaxed">You must submit your academic project proposal details to gain access to the dashboard features.</p>
             </div>
             <button onClick={() => navigate("/dashboard/submit-proposal")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-[13px] font-medium transition shadow-sm mt-2 flex items-center gap-2">
                 Get Started <ArrowRight size={16} />
             </button>
          </div>
      )}

      {/* 🟢 PROJECT EXISTS STATE (Main Dashboard) */}
      {project && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
             
             {/* Dynamic Alerts */}
             {project.status === "Pending" && (
                 <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
                     <Clock className="text-amber-500 shrink-0" size={20} />
                     <div>
                         <p className="text-[13px] font-bold">Project Proposal Pending</p>
                         <p className="text-xs mt-0.5 opacity-90 font-medium">Your proposal is reviewing by admins. You can request a supervisor once approved.</p>
                     </div>
                 </div>
             )}

             {project.status === "Approved" && !project.supervisor && displayStatus === "No request" && (
                 <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-6 py-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                     <div className="flex items-center gap-4">
                        <AlertCircle className="text-indigo-500 shrink-0" size={20} />
                        <div>
                            <p className="text-[13px] font-bold">Proposal Approved!</p>
                            <p className="text-xs mt-0.5 opacity-90 font-medium">Please navigate to the Supervisor page to request a faculty member.</p>
                        </div>
                     </div>
                     <button onClick={() => navigate("/dashboard/supervisor")} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-medium transition shadow-sm whitespace-nowrap">
                         Go to Supervisors
                     </button>
                 </div>
             )}

             {displayStatus === "Pending" && (
                 <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
                     <Clock className="text-blue-500 shrink-0 animate-pulse" size={20} />
                     <div>
                         <p className="text-[13px] font-bold">Supervisor Request Pending</p>
                         <p className="text-xs mt-0.5 opacity-90 font-medium">Your request to {latestRequest?.toUser?.name || "a supervisor"} is currently waiting for a response.</p>
                     </div>
                 </div>
             )}

             {displayStatus === "Rejected" && (
                 <div className="bg-rose-50 border border-rose-200 text-rose-800 px-6 py-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                     <div className="flex items-center gap-4">
                        <XCircle className="text-rose-500 shrink-0" size={20} />
                        <div>
                            <p className="text-[13px] font-bold">Request Rejected</p>
                            <p className="text-xs mt-0.5 opacity-90 font-medium">Your previous supervisor request was rejected. Please request a new supervisor.</p>
                        </div>
                     </div>
                     <button onClick={() => navigate("/dashboard/supervisor")} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg text-xs font-medium transition shadow-sm whitespace-nowrap">
                         View Supervisors
                     </button>
                 </div>
             )}
             
             {/* 🔹 Core 4-Stat Cards Row (Imported from Admin) */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Project Name" value={project.title} icon={FolderKanban} />
                <StatCard title="Supervisor" value={project.supervisor?.name || "Unassigned"} icon={GraduationCap} />
                <StatCard title="Submission Deadline" value={project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not Set'} icon={Clock} />
                <StatCard title="Feedback Received" value={feedbacks?.length || 0} icon={MessageSquare} />
             </div>

             {/* 🔹 Main Content Grids (Admin Split 60/40) */}
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 
                 {/* Left Column (span-3) */}
                 <div className="lg:col-span-3 space-y-6 flex flex-col">
                     <ProjectOverview project={project} onUpdate={() => setIsMessageModalOpen(true)} />
                     <FeedbackList feedbacks={feedbacks} />
                     <TasksList 
                         tasks={project.tasks} 
                         completingTasks={completingTasks} 
                         onMarkDone={handleMarkTaskDone} 
                     />
                 </div>

                 {/* Right Column (span-2) */}
                 <div className="lg:col-span-2 space-y-6 flex flex-col">
                     <div className="flex-1 min-h-[300px]">
                        <ActivityList activities={selfActivities} />
                     </div>
                     <div className="flex-1 min-h-[300px]">
                        <NotificationList notifications={sysActivities} title="System Notifications" />
                     </div>
                 </div>
                 
             </div>
          </div>
      )}

      <MessageModal 
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          supervisorName={project?.supervisor?.name}
          projectId={project?._id}
      />
    </div>
  );
};

export default StudentDashboard;
