import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentDashboard, getStudentFeedback, updateTaskStatus } from "../../store/slices/studentSlice";
import { getActivities, addRealtimeActivity } from "../../store/slices/activitySlice";
import { BookOpen, Calendar, MessageSquare, Clock, Bell, Loader, CheckCircle, XCircle, AlertCircle, ArrowRight, Briefcase } from "lucide-react";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { formatDateTime } from "../../utils/timeFormat";
import { toast } from "../../utils/toast";
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
      <div className="bg-white border border-slate-200 rounded-xl px-6 py-5">
        <h1 className="text-lg font-semibold text-slate-800">
          Welcome back, {authUser?.name?.split(' ')[0] || "Student"}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {project ? "Here's your project overview and recent updates." : "Let's submit your academic project proposal to get started."}
        </p>
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
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Project</p>
                    <p className="text-sm font-medium text-slate-800 mt-1 line-clamp-1" title={project.title}>{project.title}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Supervisor</p>
                    <p className="text-sm font-medium text-slate-800 mt-1 line-clamp-1">{project.supervisor?.name || "Unassigned"}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Submission Deadline</p>
                    <p className="text-sm font-medium text-slate-800 mt-1 line-clamp-1">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not Set'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Feedback</p>
                    <p className="text-sm font-medium text-slate-800 mt-1 line-clamp-1">{feedbacks?.length || 0} Messages</p>
                </div>
             </div>

             {/* 🔹 Main Content Grids */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 
                 {/* Project Overview */}
                 <div className="bg-white border border-slate-200 rounded-xl p-5">
                     <div className="flex items-center justify-between mb-4">
                         <h2 className="text-sm font-medium text-slate-800">Project Overview</h2>
                         <div className="flex items-center gap-3">
                             <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                 <span className={`w-2 h-2 rounded-full ${
                                    project.status === 'Completed' ? 'bg-emerald-500' :
                                    project.status === 'Approved' ? 'bg-blue-500' :
                                    project.status === 'Pending' ? 'bg-amber-500' :
                                    'bg-red-500'
                                 }`}></span>
                                 {project.status}
                             </div>
                             {project.supervisor && (
                                 <button 
                                     onClick={() => setIsMessageModalOpen(true)}
                                     className="text-xs border border-slate-200 px-3 py-1 rounded-md text-slate-600 hover:bg-slate-50 transition-colors"
                                 >
                                     Update
                                 </button>
                             )}
                             {project.status === 'Approved' && project.supervisor && (
                                 <button 
                                     onClick={handleCompleteProject}
                                     disabled={isCompletingProject}
                                     className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                 >
                                     {isCompletingProject ? "Completing..." : "Complete"}
                                 </button>
                             )}
                         </div>
                     </div>
                     <p className="text-sm text-slate-600 leading-relaxed max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {project.description}
                     </p>
                 </div>

                 {/* Latest Feedback */}
                 <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                         <h2 className="text-sm font-medium text-slate-800">Latest Feedback</h2>
                     </div>
                     <div className="flex-1">
                        {latestFeedback.length > 0 ? (
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[150px]">
                                 {latestFeedback.map((fb, idx) => (
                                     <div key={idx} className="border-b border-slate-100 pb-3 last:border-0">
                                         <div className="flex justify-between items-start mb-1 gap-2">
                                            <h4 className="text-sm text-slate-800 truncate">{fb.title}</h4>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border shrink-0 ${
                                                fb.type === 'Positive' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' :
                                                fb.type === 'Needs Revision' ? 'text-rose-700 border-rose-200 bg-rose-50' :
                                                'text-slate-600 border-slate-200 bg-slate-50'
                                            }`}>
                                                {fb.type}
                                            </span>
                                         </div>
                                         <p className="text-xs text-slate-600 mb-2 line-clamp-2">{fb.message}</p>
                                         <p className="text-[10px] text-slate-400 uppercase tracking-wide flex justify-between">
                                             <span>{fb.sender?.name || "Unknown"}</span>
                                             <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                                         </p>
                                     </div>
                                 ))}
                             </div>
                        ) : (
                            <div className="text-center text-slate-400 py-6">
                               <p className="text-sm">No recent feedback.</p>
                            </div>
                        )}
                     </div>
                 </div>

                 {/* Assigned Tasks */}
                 <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
                   <div className="flex justify-between items-center mb-4">
                     <h2 className="text-sm font-medium text-slate-800">Assigned Tasks</h2>
                   </div>
                   <div className="flex-1">
                     {project.tasks && project.tasks.length > 0 ? (
                       <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                         {[...project.tasks].sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((task, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                              <div>
                                <p className={`text-sm ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                                {task.deadline && (
                                    <p className="text-xs text-slate-400 mt-1">
                                      Due {new Date(task.deadline).toLocaleDateString()}
                                    </p>
                                )}
                              </div>
                              <button
                                onClick={async () => {
                                  if (task.status === 'Completed' || completingTasks[task._id]) return;
                                  setCompletingTasks(prev => ({ ...prev, [task._id]: true }));
                                  await dispatch(updateTaskStatus({ taskId: task._id, status: 'Completed' }));
                                  setCompletingTasks(prev => ({ ...prev, [task._id]: false }));
                                }}
                                disabled={task.status === 'Completed' || completingTasks[task._id]}
                                className="text-xs border border-slate-200 px-3 py-1 rounded-md hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                              >
                                {task.status === 'Completed' ? "Done" : completingTasks[task._id] ? "..." : "Mark Done"}
                              </button>
                            </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center text-slate-400 py-6">
                         <p className="text-sm">No assigned tasks.</p>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Recent Activity */}
                 <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
                   <div className="flex justify-between items-center mb-4">
                     <h2 className="text-sm font-medium text-slate-800">Recent Activity</h2>
                   </div>
                   <div className="flex-1">
                     {selfActivities.length > 0 ? (
                       <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                         {selfActivities.slice(0, 5).map((act, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <div className="flex-1 pr-4">
                                <p className="text-slate-700 whitespace-pre-wrap">{renderMessage(act.message)}</p>
                              </div>
                              <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                                {formatDateTime(act.createdAt)}
                              </span>
                            </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center text-slate-400 py-6">
                         <p className="text-sm">No recent activities.</p>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Recent Notifications */}
                 <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:col-span-2">
                   <div className="flex justify-between items-center mb-4">
                     <h2 className="text-sm font-medium text-slate-800">Recent Notifications</h2>
                   </div>
                   <div className="flex-1">
                     {sysActivities.length > 0 ? (
                       <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                         {sysActivities.slice(0, 5).map((act, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <div className="flex-1 pr-4">
                                <p className="text-slate-700 leading-snug">{renderMessage(act.message)}</p>
                              </div>
                              <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                                {formatDateTime(act.createdAt)}
                              </span>
                            </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center text-slate-400 py-6">
                         <p className="text-sm">No recent notifications.</p>
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
