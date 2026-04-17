import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentDashboard, getAvailableSupervisors, requestSupervisor } from "../../store/slices/studentSlice";
import { BookOpen, User, Calendar, MessageSquare, Clock, Bell, Loader, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { project, notifications, requests, isLoading, supervisors } = useSelector((state) => state.student);
  const { authUser } = useSelector((state) => state.auth);
  // Modal State for Supervisor Request
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    dispatch(getStudentDashboard());
    dispatch(getAvailableSupervisors());
  }, [dispatch]);
  // Real-Time Socket Connection
  useEffect(() => {
    if (!authUser?._id) return;
    
    // Connect to Backend Socket
    const socket = io("http://localhost:4000", {
        query: { userId: authUser._id }
    });
    socket.on("requestStatusUpdated", (data) => {
        if (data.status === "Accepted") {
            toast.success("Great news! Your supervisor request was accepted.");
        } else if (data.status === "Rejected") {
            toast.error("Your supervisor request was rejected. You can request another supervisor.");
        }
        dispatch(getStudentDashboard());
    });
    return () => {
        socket.disconnect();
    };
  }, [authUser, dispatch]);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }
  // Derive Status
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
  // Action Handlers
  const handleOpenModal = (id) => {
    setSelectedTeacherId(id);
    setTitle(project?.title || "");
    setIsModalOpen(true);
  };
  const handleRequest = (e) => {
    e.preventDefault();
    dispatch(requestSupervisor({ teacherId: selectedTeacherId, title, description }))
      .then((res) => {
        if (!res.error) {
            setIsModalOpen(false);
            dispatch(getStudentDashboard()); // Refresh immediately for ui updates
        }
      });
  };
  // Helpers
  const nextDeadlineTask = project?.tasks?.filter(t => t.status !== "Completed" && t.deadline).sort((a,b) => new Date(a.deadline) - new Date(b.deadline))[0];
  const nextDeadlineText = nextDeadlineTask ? new Date(nextDeadlineTask.deadline).toLocaleDateString() : "N/A";
  
  const recentFeedbackTask = project?.tasks?.filter(t => t.feedback).sort((a,b) => new Date(b.deadline || Date.now()) - new Date(a.deadline || Date.now()))[0];
  const recentFeedbackText = recentFeedbackTask ? recentFeedbackTask.feedback.substring(0, 30) + "..." : "No feedback yet";
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 🚀 Welcome Banner - Always visible */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-10 text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10 flex justify-between items-center">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome back, {authUser?.name?.split(' ')[0] || "Student"}!</h1>
                <p className="mt-2 text-blue-100 text-lg font-medium opacity-90">
                    {displayStatus === "Accepted" ? "Here's your project overview and recent updates." : "Let's get you set up with a supervisor."}
                </p>
            </div>
        </div>
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>
      {/* 🔄 Dynamic State Rendering */}
      {/* 🟣 NO PROPOSAL STATE */}
      {displayStatus === "No Proposal" && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[300px]">
             <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                 <BookOpen size={40} />
             </div>
             <div className="max-w-md mx-auto">
                 <h2 className="text-2xl font-bold text-slate-800">Submit Your Proposal First</h2>
                 <p className="text-slate-600 mt-2">You must submit your academic project proposal details before you can browse and request a supervisor.</p>
             </div>
             <button onClick={() => navigate("/dashboard/submit-proposal")} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition shadow-md mt-2 flex items-center gap-2">
                 Submit Project Proposal <ArrowRight size={18} />
             </button>
          </div>
      )}
      
      {/* 🔴 REJECTED STATE */}
      {displayStatus === "Rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                 <XCircle size={32} />
             </div>
             <div className="flex-1 text-center md:text-left">
                 <h2 className="text-xl font-bold text-red-800">Request Rejected</h2>
                 <p className="text-red-700 mt-1">Unfortunately, your previous supervisor request was rejected. The supervisor might be full or unavailable. Please browse and request another supervisor.</p>
             </div>
             <button onClick={() => {}} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm mt-4 md:mt-0 whitespace-nowrap">
                 Try Again
             </button>
          </div>
      )}
      {/* 🟡 PENDING STATE */}
      {displayStatus === "Pending" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                 <Clock size={32} />
             </div>
             <div className="flex-1 text-center md:text-left">
                 <h2 className="text-xl font-bold text-amber-800">Request Pending</h2>
                 <p className="text-amber-700 mt-1">Your request to <span className="font-semibold">{latestRequest?.toUser?.name || "a supervisor"}</span> is currently pending. You will be notified instantly once they respond.</p>
             </div>
          </div>
      )}
      {/* ⚪ NO REQUEST or REJECTED (Show Supervisors) */}
      {(displayStatus === "No request" || displayStatus === "Rejected") && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-bold text-slate-800">Available Supervisors</h2>
                 <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">{supervisors?.length || 0} Faculty Members</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {supervisors && supervisors.length > 0 ? (
                     supervisors.map((teacher) => (
                        <div key={teacher._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-8 -mt-8 rounded-full opacity-50 transition-transform group-hover:scale-150 duration-500"></div>
                            
                            <div className="flex items-start justify-between relative z-10 mb-4">
                               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                                   {teacher.name.charAt(0)}
                               </div>
                            </div>
                            
                            <div className="relative z-10 flex-1">
                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{teacher.name}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{teacher.email}</p>
                                
                                <div className="mt-4">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Expertise Fields</p>
                                   <div className="flex flex-wrap gap-1.5">
                                      {teacher.experties && teacher.experties.length > 0 ? teacher.experties.map((exp, idx) => (
                                          <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md font-medium border border-slate-200">{exp}</span>
                                      )) : <span className="text-xs text-slate-400 italic">No expertise specified</span>}
                                   </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
                                <button 
                                    onClick={() => handleOpenModal(teacher._id)}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                                >
                                    Request Supervisor <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                     ))
                 ) : (
                     <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                         <User size={48} className="opacity-20 mb-3" />
                         <p>No supervisors available at the moment.</p>
                     </div>
                 )}
              </div>
          </div>
      )}
      {/* 🟢 ACCEPTED STATE (Main Dashboard) */}
      {displayStatus === "Accepted" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* 🔹 Core Cards: Supervisor & Project */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Supervisor Card */}
                 <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                     <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Current Supervisor</h2>
                         </div>
                         <span className="bg-green-100 text-green-700 border border-green-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                             <CheckCircle size={12} /> Assigned
                         </span>
                     </div>
                     
                     <div className="flex flex-col sm:flex-row gap-5 items-start">
                         <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
                             {project?.supervisor?.name?.charAt(0) || "S"}
                         </div>
                         <div className="flex flex-col">
                             <h3 className="text-xl font-bold text-slate-800">{project?.supervisor?.name || "N/A"}</h3>
                             {project?.supervisor?.department && (
                                <span className="mt-1 text-sm text-indigo-600 font-medium inline-block">{project.supervisor.department}</span>
                             )}
                             <div className="mt-4 flex flex-col space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-16 text-slate-400 text-xs uppercase font-bold">Email</span>
                                    <span className="text-slate-700 font-medium">{project?.supervisor?.email || "N/A"}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm mt-1">
                                    <span className="w-16 text-slate-400 text-xs uppercase font-bold mt-0.5">Expertise</span>
                                    <div className="flex flex-wrap gap-1 flex-1">
                                        {project?.supervisor?.experties && project.supervisor.experties.length > 0 ? (
                                            project.supervisor.experties.map((exp, idx) => (
                                                <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 border border-slate-200 rounded">{exp}</span>
                                            ))
                                        ) : (
                                            <span className="text-slate-500 italic">Not specified</span>
                                        )}
                                    </div>
                                </div>
                             </div>
                         </div>
                     </div>
                 </div>
                 {/* Project Details Card */}
                 <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative h-full flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                         <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Project Details</h2>
                         <span className="bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                             {project?.status || "Approved"}
                         </span>
                     </div>
                     <div className="flex-1 flex flex-col space-y-4">
                         <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Title</p>
                             <p className="font-bold text-lg text-slate-800 leading-tight">{project?.title || "N/A"}</p>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deadline</p>
                                <p className="font-medium text-slate-800">{project?.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set yet'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created On</p>
                                <p className="font-medium text-slate-800">{project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                         </div>
                         <div className="flex-1 min-h-0 relative">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                             <div className="max-h-[80px] overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-sm text-slate-600 leading-relaxed">{project?.description || "No description provided."}</p>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
             {/* Secondary Stats Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upcoming Deadlines */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-indigo-500"/> Upcoming Deadlines</h2>
                  </div>
                  <div className="flex-1">
                    {project?.tasks && project.tasks.filter(t => t.deadline && t.status !== "Completed").length > 0 ? (
                      <div className="space-y-3">
                        {project.tasks.filter(t => t.deadline && t.status !== "Completed").sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((task, i) => (
                           <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 transition hover:bg-slate-100">
                             <div>
                                  <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                  <p className="text-xs text-slate-500 font-medium mt-0.5">{new Date(task.deadline).toLocaleDateString()}</p>
                             </div>
                             <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold shadow-sm ${task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>{task.status}</span>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 h-full py-6">
                        <CheckCircle size={32} className="mb-2 opacity-30 text-green-500" />
                        <p className="text-sm font-medium">No pending deadlines. Great job!</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Recent Notifications & Feedback */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Bell size={18} className="text-amber-500"/> Recent Activity</h2>
                  </div>
                  <div className="flex-1">
                    {notifications && notifications.length > 0 ? (
                      <div className="space-y-3">
                        {notifications.map((notif, i) => (
                           <div key={i} className="flex gap-3 items-start border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                             <div className="bg-blue-50 text-blue-600 p-2 rounded-full shrink-0 mt-0.5 shadow-sm">
                               <Bell size={14} />
                             </div>
                             <div>
                               <p className="text-sm text-slate-800 font-medium">{notif.message}</p>
                               <p className="text-[11px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{new Date(notif.createdAt).toLocaleDateString()}</p>
                             </div>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 h-full py-6">
                        <MessageSquare size={32} className="mb-2 opacity-20 text-slate-400" />
                        <p className="text-sm font-medium">No recent activity.</p>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </div>
      )}
      {/* 🚀 Modal Content for Supervisor Request */}
      {isModalOpen && !project?.supervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Request Supervisor</h2>
            <form onSubmit={handleRequest} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Project Title</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50/50" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter your proposed project title"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Proposal Message</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors min-h-[120px] resize-none bg-slate-50/50 hover:bg-white" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Explain why you want this supervisor and briefly describe your project..." 
                  required 
                />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2">
                    Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentDashboard;
