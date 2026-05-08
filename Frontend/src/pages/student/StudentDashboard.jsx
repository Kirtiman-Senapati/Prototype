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
import StatCard from "./components/StatCard";
import StudentActivityList from './components/StudentActivityList';
import MilestoneTimeline from "../../components/milestones/MilestoneTimeline";
import SubmitMilestoneModal from "../../components/milestones/SubmitMilestoneModal";

import ProjectWorkspace from "../../components/workspace/ProjectWorkspace";

// Component: ProjectOverview
const ProjectOverview = ({ project, onUpdate }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800">Project Overview</h2>
                {project.supervisor && (
                    <button 
                        onClick={onUpdate}
                        className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition-colors uppercase tracking-wide"
                    >
                        Update Supervisor
                    </button>
                )}
            </div>

            {/* Project Status */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <div className="flex items-center gap-2 mb-4">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                        project.status === 'Completed' ? 'bg-slate-400' :
                        project.status === 'Incomplete' ? 'bg-slate-500' :
                        project.status === 'Approved' ? 'bg-slate-600' :
                        project.status === 'Pending' ? 'bg-slate-700' :
                        'bg-slate-800'
                    }`} />
                    {/* TEXT CONTENT */}
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{project.status}</span>
                </div>

                {/* Description */}
                <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                    {project.description}
                </p>
            </div>
        </div>
    );
};

// Component: FeedbackList
const FeedbackList = ({ feedbacks }) => {
    if (!feedbacks || feedbacks.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-800">Latest Feedback</h2>
                </div>
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare size={24} strokeWidth={1.5} className="mb-2 text-slate-300" />
                    <p className="text-[13px] font-medium">No recent feedback</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800">Latest Feedback</h2>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
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
                            <span>{new Date(fb.createdAt).toLocaleDateString("en-GB")}</span>
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
  
  // Milestone & Timeline state
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

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

  const handleMilestoneSubmit = async (milestoneId, file,remarks) => {
      try {
          setIsSubmittingMilestone(true);
          const { axiosInstance } = await import("../../lib/axios");
          const formData = new FormData();

          if (file) formData.append("file", file);
          formData.append("remarks", remarks || "");
          
          await axiosInstance.post(`/student/project/${project._id}/milestone/${milestoneId}/submit`, formData, {
              headers: { "Content-Type": "multipart/form-data" }
          });
          
          toast.success("Milestone submitted successfully!");
          setIsSubmitModalOpen(false);
          setSelectedMilestone(null);
          dispatch(getStudentDashboard());
          dispatch(getActivities());
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to submit milestone");
      } finally {
          setIsSubmittingMilestone(false);
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
}, "refreshData");

useAutoRefresh(() => {
    dispatch(getStudentDashboard());
    dispatch(getStudentFeedback());
    dispatch(getActivities());
}, "newActivity");

  useAutoRefresh((data) => {
      if (data && data.status === "Accepted") toast.success("Great news! Your supervisor request was accepted.");
      else if (data && data.status === "Rejected") toast.error("Your supervisor request was rejected.");
      dispatch(getStudentDashboard());
  }, "requestStatusUpdated");

  useAutoRefresh((data) => {
      if (!data || !data.deadline) return;
      toast.info(<div>A new project deadline has been set.</div>);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
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

  // ----------------------------------------------------
  // BACKWARDS COMPATIBILITY MIGRATION (Unified Workspace)
  // ----------------------------------------------------
  let unifiedWorkspaceItems = [];
  if (project) {
      const itemMap = new Map();
      
      // 1. Old Tasks
      (project.tasks || []).forEach(t => {
          itemMap.set(t._id.toString(), { ...t, type: 'task' });
      });
      
      // 2. Old Milestones
      (project.milestones || []).forEach(m => {
          itemMap.set(m._id.toString(), { ...m, type: 'phase' });
      });
      
      // 3. New Workspace Items (overwrites dual-written old ones by ID)
      (project.workspaceItems || []).forEach(wi => {
          itemMap.set(wi._id.toString(), wi);
      });
      
      unifiedWorkspaceItems = Array.from(itemMap.values()).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  return (
    <div className="space-y-6 pb-10 bg-[#F9FAFB] min-h-screen">
      
      {/* Premium Header Section */}
      <div className="pt-2 pb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {authUser?.name?.split(' ')[0] || "Student"}</h1>
            <p className="text-slate-500 mt-2 font-medium">
                {project ? "Track your progress, tasks and feedback in one place." : "Let's submit your academic project proposal to get started."}
            </p>
        </div>
        {project && (project.status === 'Approved' || project.status === 'Incomplete') && project.supervisor && (
            <div className="flex items-center gap-2 sm:mt-1">
                <button 
                    onClick={() => {
                        if (project.status === 'Incomplete') {
                            toast.error("Project deadline has already passed. You can no longer mark this project as completed. Please contact your administrator for further assistance.");
                            return;
                        }
                        handleCompleteProject();
                    }}
                    disabled={isCompletingProject || project.status === "Completed"}
                    className={`flex items-center justify-center px-4 h-9 text-[13px] font-medium rounded-md active:scale-[0.98] transition-all duration-150 shadow-sm disabled:opacity-50 ${
                        project.status === 'Incomplete' 
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed hover:bg-slate-50' 
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                >
                    {isCompletingProject ? "Completing..." : "Complete Project"}
                </button>
            </div>
        )}
      </div>

      {/* 🟣 NO PROPOSAL STATE */}
      {!project && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-5 shadow-sm">
             <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center shrink-0">
                 <BookOpen size={32} />
             </div>
             <div className="max-w-md mx-auto">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">Submit Your Proposal</h2>
                 <p className="text-slate-500 mt-2 text-[13px] font-medium leading-relaxed">You must submit your academic project proposal details to gain access to the dashboard features.</p>
             </div>
             <button onClick={() => navigate("/dashboard/submit-proposal")} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-lg text-[13px] font-medium transition shadow-sm mt-2 flex items-center gap-2">
                 Get Started <ArrowRight size={16} />
             </button>
          </div>
      )}

      {project && (
          <div className="space-y-6 max-w-full mx-auto">
             
            {/* Dynamic Alerts */}
             {project.status === "Pending" && (
                <div className="bg-white border border-slate-200 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">

                    {/* LEFT ACCENT */}
                    <div className="w-1.5 h-10 bg-amber-400 rounded-full"/>
                     <Clock className="text-amber-500 shrink-0" size={20} />

                     {/* TEXT CONTENT */}
                     <div>
                         <p className="text-sm font-semibold text-slate-800">Project Proposal Pending</p>
                         <p className="text-xs text-slate-500 mt-0.5">Your proposal is reviewing by admins. You can request a supervisor once approved.</p>
                     </div>
                </div>
             )}

             {project.status === "Approved" && !project.supervisor && displayStatus === "No request" && (
            <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    
                    {/* LEFT ACCENT */}
                    <div className="w-1.5 h-10  bg-emerald-400  rounded-full"/>
                    {/* ICON */}
                    <AlertCircle className="text-emerald-500 shrink-0" size={20} />
                    {/* TEXT CONTENT */}
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Proposal Approved </p>
                        <p className="text-xs mt-0.5 text-slate-500 font-medium">Please navigate to the Supervisor page to request a faculty member.</p>
                    </div>
                </div>
                <button onClick={() => navigate("/dashboard/supervisor")} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-medium transition shadow-sm whitespace-nowrap">
                    Go to Supervisors
                </button>
            </div>
            )}

            {/* Supervisor request pending */}

             {displayStatus === "Pending" && (
                <div className="bg-white border border-slate-200 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                    
                    {/* LEFT ACCENT */}
                    <div className="w-1.5 h-10 bg-amber-400 rounded-full" />

                    {/* ICON */}
                    <Clock className="text-amber-500 shrink-0" size={20} />

                    {/* TEXT CONTENT */}
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Supervisor Request Pending</p>
                        <p className="text-xs text-slate-500 mt-0.5">Your request to {latestRequest?.toUser?.name || "a supervisor"} is currently waiting for a response.</p>
                    </div>
                </div>
             )}
             {/* status === Approved but supervisor not assigned */}

             {displayStatus === "Rejected" && (
            <div className="bg-white border border-slate-200 px-6 py-4 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-4">

                    {/* ACCENT */}
                    <div className="w-1.5 h-10 bg-red-400 rounded-full" />

                    {/* ICON */}
                    <XCircle className="text-red-500 shrink-0" size={20} />

                    {/* TEXT */}
                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            Request Rejected
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Your previous supervisor request was rejected. Please request a new supervisor.
                        </p>
                    </div>

                </div>

                {/* BUTTON */}
                <button
                    onClick={() => navigate("/dashboard/supervisor")}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-xs font-medium transition shadow-sm whitespace-nowrap"
                >
                    View Supervisors
                    </button>

            </div>
             )}
             
             {/* 🔹 Core 4-Stat Cards Row (Imported from Admin) */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Project Name" value={project.title} icon={FolderKanban} />
                <StatCard title="Supervisor" value={project.supervisor?.name || "Unassigned"} icon={GraduationCap} />
                <StatCard title="Submission Deadline" value={project.deadline ? new Date(project.deadline).toLocaleDateString("en-GB") : 'Not Set'} icon={Clock} />
                <StatCard title="Feedback Received" value={feedbacks?.length || 0} icon={MessageSquare} />
             </div>

             {/* 🔹 Main Content Grids (Admin Split 60/40) */}
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
                 
                 {/* Left Column (span-3) */}
                 <div className="lg:col-span-3 flex flex-col gap-6">

                     {/* UNIFIED WORKSPACE */}
                     <div className="h-[320px]">
                         <button id="open-timeline-modal-btn" className="hidden" onClick={() => setIsTimelineModalOpen(true)}></button>
                         <ProjectWorkspace 
                             project={project} 
                             workspaceItems={unifiedWorkspaceItems}
                             completingTasks={completingTasks} 
                             onMarkTaskDone={handleMarkTaskDone} 
                             onMilestoneSubmitClick={(m) => { setSelectedMilestone(m); setIsSubmitModalOpen(true); }}
                         />
                     </div>

                     {/* BOTTOM TWO CARDS */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-[260px]">
                         <ProjectOverview project={project} onUpdate={() => setIsMessageModalOpen(true)} />
                         <FeedbackList feedbacks={feedbacks} />
                     </div>

                 </div>

                 {/* Right Column (span-2) */}
                 <div className="lg:col-span-2 flex flex-col gap-6">

                    <div className="h-[260px]">
                         <StudentActivityList
                            activities={selfActivities}
                            title="Your Recent Activity"
                        />
                    </div>

                    <div className="h-[320px]">
                        <StudentActivityList
                            activities={sysActivities}
                            title="System Notifications"
                        />
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
      
      <SubmitMilestoneModal 
          isOpen={isSubmitModalOpen}
          onClose={() => { setIsSubmitModalOpen(false); setSelectedMilestone(null); }}
          onSubmit={handleMilestoneSubmit}
          milestone={selectedMilestone}
          isSubmitting={isSubmittingMilestone}
      />

      {/* View Timeline Modal (Full Unified Workspace Details) */}
      {isTimelineModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center pt-10 p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white overflow-hidden rounded-xl w-full max-w-3xl border border-slate-200 flex flex-col max-h-[90vh] shadow-xl">
                  <div className="flex justify-between items-center p-5 border-b border-slate-100">
                      <div>
                          <h2 className="text-xl font-bold text-slate-800">Workspace Details</h2>
                          <p className="text-xs text-slate-500 font-medium mt-1">Full workflow timeline and submissions</p>
                      </div>
                      <button onClick={() => setIsTimelineModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition text-sm font-semibold">
                          Close
                      </button>
                  </div>
                  <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                      <MilestoneTimeline 
                          milestones={unifiedWorkspaceItems} 
                          role="student" 
                          onSubmitClick={(m) => { setSelectedMilestone(m); setIsSubmitModalOpen(true); setIsTimelineModalOpen(false); }}
                      />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentDashboard;
