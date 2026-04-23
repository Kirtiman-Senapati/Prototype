import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentDashboard, getStudentFeedback, updateTaskStatus } from "../../store/slices/studentSlice";
import { getActivities, addRealtimeActivity } from "../../store/slices/activitySlice";
import { BookOpen, Calendar, MessageSquare, Clock, Bell, Loader, CheckCircle, XCircle, AlertCircle, ArrowRight, Briefcase } from "lucide-react";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { formatDateTime } from "../../utils/timeFormat";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import MessageModal from "./components/MessageModal";
const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { project, notifications, requests, feedbacks, isLoading } = useSelector((state) => state.student);
  const { activities } = useSelector((state) => state.activity);
  const { authUser } = useSelector((state) => state.auth);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
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

  useEffect(() => {
    dispatch(getStudentDashboard());
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
      if (data && data.status === "Accepted") {
          toast.success("Great news! Your supervisor request was accepted.");
      } else if (data && data.status === "Rejected") {
          toast.error("Your supervisor request was rejected. You can request another supervisor.");
      }
      dispatch(getStudentDashboard());
  }, "requestStatusUpdated");

  useAutoRefresh((data) => {
      if (!data || !data.deadline) return;
      toast.info(<div>A new absolute project deadline has been set:<br/><strong className="text-sm mt-1 block">{new Date(data.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>, {
          icon: "📅",
          autoClose: 6000,
          className: "border-l-4 border-blue-500"
      });
      dispatch(getStudentDashboard());
  }, "deadlineUpdated");

  useAutoRefresh((data) => {
      if (data && data.status === "Approved") {
          toast.success("Congratulations! Your project proposal was APPROVED by an admin.", { autoClose: 6000 });
      } else if (data && data.status === "Rejected") {
          toast.error("Your project proposal was REJECTED. You must submit a new proposal.", { autoClose: 8000 });
      }
      dispatch(getStudentDashboard());
  }, "projectStatusUpdated");

  useAutoRefresh(() => {
      toast.success("An admin has directly assigned a supervisor to your project!", { icon: "🎓", autoClose: 6000 });
      dispatch(getStudentDashboard());
  }, "supervisorAssignedAdmin");

  useAutoRefresh((activity) => {
      dispatch(addRealtimeActivity(activity));
  }, "newActivity");

  useAutoRefresh(() => {
      toast.info("You just received new feedback!", { icon: "💬" });
      dispatch(getStudentFeedback());
  }, "newFeedback");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // Derive Status for Supervisor Request Notifications
  let displayStatus = "No request";
  let latestRequest = null;
  
  const latestFeedback = feedbacks && feedbacks.length > 0 ? [...feedbacks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3) : [];

  const renderMessage = (text) => {
      if (!text) return null;
      const parts = text.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
      );
  };
  
  const selfActivities = activities?.filter(a => {
      const actorId = (a.actor?._id || a.actor)?.toString();
      return actorId === authUser?._id?.toString();
  }) || [];

  const sysActivities = activities?.filter(a => {
      const actorId = (a.actor?._id || a.actor)?.toString();
      return actorId !== authUser?._id?.toString();
  }) || [];

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 🚀 Welcome Banner - Always visible */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-10 text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10 flex justify-between items-center">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome back, {authUser?.name?.split(' ')[0] || "Student"}!</h1>
                <p className="mt-2 text-blue-100 text-lg font-medium opacity-90">
                    {project ? "Here's your project overview and recent updates." : "Let's submit your academic project proposal to get started."}
                </p>
            </div>
        </div>
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      {/* 🟣 NO PROPOSAL STATE */}
      {!project && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[300px]">
             <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                 <BookOpen size={40} />
             </div>
             <div className="max-w-md mx-auto">
                 <h2 className="text-2xl font-bold text-slate-800">Submit Your Proposal First</h2>
                 <p className="text-slate-600 mt-2">You must submit your academic project proposal details to gain access to the dashboard features.</p>
             </div>
             <button onClick={() => navigate("/dashboard/submit-proposal")} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition shadow-md mt-2 flex items-center gap-2">
                 Submit Project Proposal <ArrowRight size={18} />
             </button>
          </div>
      )}

      {/* 🟢 PROJECT EXISTS STATE (Main Dashboard) */}
      {project && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Dynamic Alerts based on status */}
             {project.status === "Pending" && (
                 <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
                     <Clock className="text-amber-500 shrink-0" size={24} />
                     <div>
                         <p className="font-bold">Project Proposal Pending Approval</p>
                         <p className="text-sm mt-0.5 opacity-90">Your proposal is reviewing by admins. You can request a supervisor once approved.</p>
                     </div>
                 </div>
             )}

             {project.status === "Approved" && !project.supervisor && displayStatus === "No request" && (
                 <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
                     <AlertCircle className="text-blue-500 shrink-0" size={24} />
                     <div className="flex-1">
                         <p className="font-bold">Proposal Approved!</p>
                         <p className="text-sm mt-0.5 opacity-90">Please navigate to the Supervisor page to request a faculty member.</p>
                     </div>
                     <button onClick={() => navigate("/dashboard/supervisor")} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap">
                         Go to Supervisors
                     </button>
                 </div>
             )}

             {displayStatus === "Pending" && (
                 <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
                     <Clock className="text-amber-500 shrink-0 animate-pulse" size={24} />
                     <div>
                         <p className="font-bold">Supervisor Request Pending</p>
                         <p className="text-sm mt-0.5 opacity-90">Your request to {latestRequest?.toUser?.name || "a supervisor"} is currently waiting for a response.</p>
                     </div>
                 </div>
             )}

             {displayStatus === "Rejected" && (
                 <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
                     <XCircle className="text-red-500 shrink-0" size={24} />
                     <div className="flex-1">
                         <p className="font-bold">Request Rejected</p>
                         <p className="text-sm mt-0.5 opacity-90">Your previous supervisor request was rejected. Please request a new supervisor.</p>
                     </div>
                     <button onClick={() => navigate("/dashboard/supervisor")} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap">
                         View Supervisors
                     </button>
                 </div>
             )}
             
             {/* 🔹 Core 4-Stat Cards Row */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Project</p>
                    <p className="font-bold text-slate-800 line-clamp-1" title={project.title}>{project.title}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Supervisor</p>
                    <p className="font-bold text-slate-800 line-clamp-1">{project.supervisor?.name || "Unassigned"}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Submission Deadline</p>
                    <p className="font-bold text-slate-800 line-clamp-1">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not Set'}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Feedback</p>
                    <p className="font-bold text-slate-800 line-clamp-1">{feedbacks?.length || 0} Messages</p>
                </div>
             </div>

             {/* 🔹 Main Content Grids */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 
                 {/* Project Overview */}
                 <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                         <h2 className="font-bold text-slate-800 flex items-center gap-2"><Briefcase size={18} className="text-blue-500"/> Project Overview</h2>
                         <div className="flex items-center gap-2">
                             <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border shadow-sm ${
                                 project.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                 project.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                 'bg-red-50 text-red-700 border-red-200'
                             }`}>
                                 {project.status}
                             </span>
                             {project.supervisor && (
                                 <button 
                                     onClick={() => setIsMessageModalOpen(true)}
                                     className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                     title="Send Message/Update to Supervisor"
                                 >
                                     <MessageSquare size={14} /> Update
                                 </button>
                             )}
                             {project.status === 'Approved' && project.supervisor && (
                                 <button 
                                     onClick={handleCompleteProject}
                                     disabled={isCompletingProject}
                                     className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                     title="Mark your project as completed"
                                 >
                                     {isCompletingProject ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />} 
                                     {isCompletingProject ? "Completing..." : "Mark as Completed"}
                                 </button>
                             )}
                         </div>
                     </div>
                     <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[150px]">
                         <p className="text-sm text-slate-600 leading-relaxed font-medium">{project.description}</p>
                     </div>
                 </div>

                 {/* Latest Feedback */}
                 <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                         <h2 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare size={18} className="text-emerald-500"/> Latest Feedback</h2>
                     </div>
                     <div className="flex-1">
                        {latestFeedback.length > 0 ? (
                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[150px]">
                                 {latestFeedback.map((fb, idx) => (
                                     <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative group">
                                         {/* Badge */}
                                         <div className="absolute top-4 right-4">
                                             <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border ${
                                                 fb.type === 'Positive' ? 'bg-green-50 text-green-700 border-green-200' :
                                                 fb.type === 'Needs Revision' ? 'bg-red-50 text-red-700 border-red-200' :
                                                 'bg-blue-50 text-blue-700 border-blue-200'
                                             }`}>
                                                 {fb.type}
                                             </span>
                                         </div>
                                         <h4 className="text-sm font-bold text-slate-800 mb-1 pr-16 truncate">{fb.title}</h4>
                                         <p className="text-xs text-slate-600 font-medium mb-3 line-clamp-2">{fb.message}</p>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2 flex justify-between">
                                             <span>{fb.sender?.name || "Unknown"}</span>
                                             <span>{new Date(fb.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                         </p>
                                     </div>
                                 ))}
                             </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 h-full py-6">
                               <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                  <MessageSquare size={24} className="text-slate-400 opacity-50" />
                               </div>
                               <p className="text-sm font-medium">No recent feedback.</p>
                            </div>
                        )}
                     </div>
                 </div>

                 {/* Assigned Tasks */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                     <h2 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-indigo-500"/> Assigned Tasks</h2>
                     <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">{project.tasks?.length || 0} Total</span>
                   </div>
                   <div className="flex-1">
                     {project.tasks && project.tasks.length > 0 ? (
                       <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                         {[...project.tasks].sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((task, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 transition hover:bg-slate-100 group">
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={async () => {
                                    if (task.status === 'Completed' || completingTasks[task._id]) return;
                                    setCompletingTasks(prev => ({ ...prev, [task._id]: true }));
                                    await dispatch(updateTaskStatus({ taskId: task._id, status: 'Completed' }));
                                    setCompletingTasks(prev => ({ ...prev, [task._id]: false }));
                                  }}
                                  className={`shrink-0 flex items-center justify-center transition-colors ${task.status === 'Completed' ? 'text-green-500' : 'text-slate-300 hover:text-green-500 cursor-pointer'} ${completingTasks[task._id] ? 'opacity-50 pointer-events-none' : ''}`}
                                  title={task.status === 'Completed' ? 'Completed' : 'Mark as Complete'}
                                  disabled={task.status === 'Completed' || completingTasks[task._id]}
                                >
                                  {task.status === 'Completed' ? <CheckCircle size={22} className="fill-green-50" /> : <div className="w-[20px] h-[20px] rounded-full border-2 border-current group-hover:border-green-500 group-hover:bg-green-50 flex items-center justify-center" />}
                                </button>
                                <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-0.5 mt-0.5">
                                         <p className={`text-sm font-bold leading-tight ${task.status === 'Completed' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{task.title}</p>
                                         <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm border ${task.assignedByRole === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>By {task.assignedByRole === 'admin' ? 'Admin' : 'Supervisor'}</span>
                                     </div>
                                     {task.deadline && (
                                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                             {task.status === 'Completed' && task.completedAt ? (
                                                 <span className="text-green-600">Completed on {new Date(task.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                             ) : (
                                                 <>Due {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(task.deadline).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</>
                                             )}
                                         </p>
                                     )}
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold shadow-sm ${
                                  task.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                                  task.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                                  'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>{task.status}</span>
                            </div>
                         ))}
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center text-slate-400 h-full py-6">
                         <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle size={24} className="text-green-500" />
                         </div>
                         <p className="text-sm font-medium">No assigned tasks. Great job!</p>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Recent Activity */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                     <h2 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-purple-500"/> Recent Activity</h2>
                   </div>
                   <div className="flex-1">
                     {selfActivities.length > 0 ? (
                       <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                         {selfActivities.slice(0, 5).map((act, i) => (
                            <div key={i} className="flex gap-3 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                              <div className={`p-2 rounded-full shrink-0 shadow-sm mt-0.5 text-white bg-purple-500`}>
                                <Clock size={14} />
                              </div>
                              <div>
                                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{renderMessage(act.message)}</p>
                                {act.details && (
                                    <p className="text-[12.5px] text-slate-500 mt-1 border-l-2 border-slate-200 pl-2">
                                        {act.details}
                                    </p>
                                )}
                                <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-bold tracking-wider">
                                    {formatDateTime(act.createdAt)}
                                </p>
                              </div>
                            </div>
                         ))}
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center text-slate-400 h-full py-6">
                         <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <Clock size={24} className="text-slate-400 opacity-50" />
                         </div>
                         <p className="text-sm font-medium">No recent activities.</p>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Recent Notifications */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:col-span-2 hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                     <h2 className="font-bold text-slate-800 flex items-center gap-2"><Bell size={18} className="text-amber-500"/> Recent Notifications</h2>
                   </div>
                   <div className="flex-1">
                     {sysActivities.length > 0 ? (
                       <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                         {sysActivities.slice(0, 5).map((act, i) => (
                            <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                              <div className="bg-amber-50 text-amber-600 p-2.5 rounded-full shrink-0 mt-0.5 shadow-sm border border-amber-100">
                                <Bell size={16} />
                              </div>
                              <div className="pt-0.5">
                                <p className="text-sm text-slate-800 font-medium leading-snug">{renderMessage(act.message)}</p>
                                {act.details && (
                                    <p className="text-[12.5px] text-slate-500 mt-1 border-l-2 border-slate-200 pl-2">
                                        {act.details}
                                    </p>
                                )}
                                <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-bold tracking-wider">
                                    {formatDateTime(act.createdAt)}
                                </p>
                              </div>
                            </div>
                         ))}
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center text-slate-400 h-full py-8">
                         <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <MessageSquare size={24} className="text-slate-400 opacity-50" />
                         </div>
                         <p className="text-sm font-medium">No recent notifications.</p>
                       </div>
                     )}
                   </div>
                 </div>
                 
             </div>
          </div>
      )}

      {/* Include Message Modal */}
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
