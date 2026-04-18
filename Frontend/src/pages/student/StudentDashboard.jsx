import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentDashboard } from "../../store/slices/studentSlice";
import { BookOpen, Calendar, MessageSquare, Clock, Bell, Loader, CheckCircle, XCircle, AlertCircle, ArrowRight, Briefcase } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { project, notifications, requests, isLoading } = useSelector((state) => state.student);
  const { authUser } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getStudentDashboard());
  }, [dispatch]);

  // Real-Time Socket Connection
  useEffect(() => {
    if (!authUser?._id) return;
    
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

    socket.on("deadlineUpdated", (data) => {
        toast.info(<div>A new absolute project deadline has been set:<br/><strong className="text-sm mt-1 block">{new Date(data.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>, {
            icon: "📅",
            autoClose: 6000,
            className: "border-l-4 border-blue-500"
        });
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

  // Derive Status for Supervisor Request Notifications
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
             
             {/* 🔹 Core Cards: Supervisor & Project */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Supervisor Card */}
                 <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
                     <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Current Supervisor</h2>
                         </div>
                         <span className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm ${project.supervisor ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                             {project.supervisor ? <><CheckCircle size={12} /> Assigned</> : <><Clock size={12} /> Unassigned</>}
                         </span>
                     </div>
                     
                     {project.supervisor ? (
                         <div className="flex flex-col sm:flex-row gap-5 items-start">
                             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
                                 {project.supervisor?.name?.charAt(0) || "S"}
                             </div>
                             <div className="flex flex-col">
                                 <h3 className="text-xl font-bold text-slate-800">{project.supervisor?.name || "N/A"}</h3>
                                 {project.supervisor?.department && (
                                    <span className="mt-1 text-sm text-indigo-600 font-medium inline-block">{project.supervisor.department}</span>
                                 )}
                                 <div className="mt-4 flex flex-col space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="w-16 text-slate-400 text-xs uppercase font-bold">Email</span>
                                        <span className="text-slate-700 font-medium">{project.supervisor?.email || "N/A"}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm mt-1">
                                        <span className="w-16 text-slate-400 text-xs uppercase font-bold mt-0.5">Expertise</span>
                                        <div className="flex flex-wrap gap-1 flex-1">
                                            {project.supervisor?.experties && project.supervisor.experties.length > 0 ? (
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
                     ) : (
                         <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-6">
                            <Briefcase size={40} className="mb-3 opacity-20" />
                            <p className="font-medium text-slate-600">No Supervisor Assigned</p>
                            <p className="text-sm mt-1 max-w-sm text-center">Once an admin assigns you one or a faculty member accepts your request, they will appear here.</p>
                         </div>
                     )}
                 </div>

                 {/* Project Details Card */}
                 <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative h-full flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                         <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Project Details</h2>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                             project.status === 'Approved' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                             project.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                             'bg-red-100 text-red-700 border-red-200'
                         }`}>
                             {project.status || "Approved"}
                         </span>
                     </div>
                     <div className="flex-1 flex flex-col space-y-4">
                         <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Title</p>
                             <p className="font-bold text-lg text-slate-800 leading-tight">{project.title || "N/A"}</p>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deadline</p>
                                <p className="font-medium text-slate-800">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set yet'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created On</p>
                                <p className="font-medium text-slate-800">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                         </div>
                         <div className="flex-1 min-h-0 relative">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                             <div className="max-h-[80px] overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-sm text-slate-600 leading-relaxed">{project.description || "No description provided."}</p>
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
                    {project.tasks && project.tasks.filter(t => t.deadline && t.status !== "Completed").length > 0 ? (
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
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
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
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
    </div>
  );
};

export default StudentDashboard;
