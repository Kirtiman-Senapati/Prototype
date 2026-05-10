import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAvailableSupervisors, requestSupervisor, getStudentDashboard } from "../../store/slices/studentSlice";
import { toast } from "../../utils/toast";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { ArrowRight, CheckCircle, User, BookOpen, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SupervisorPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { supervisors, project, authUser, requests } = useSelector((state) => state.student);
  
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(getAvailableSupervisors());
    if (!project) {
        dispatch(getStudentDashboard());
    }
  }, [dispatch, project]);

  useAutoRefresh((data) => {
      if (data && data.status === "Accepted") {
          toast.success("Great news! Your supervisor request was accepted.");
          navigate("/dashboard");
      } else if (data && data.status === "Rejected") {
          toast.error("Your supervisor request was rejected. You can request another supervisor.");
      }
      dispatch(getStudentDashboard());
  }, "requestStatusUpdated");

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
            dispatch(getStudentDashboard());
        }
      });
  };

  return (
    <div className="space-y-8 pb-10">
      {project?.supervisor ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Current Supervisor</h2>
                   </div>
                   <span className="px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 bg-slate-100 text-slate-700">
                        Assigned
                   </span>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-5 items-start">
                   <div className="w-16 h-16 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl font-semibold border border-slate-200">
                       {project.supervisor.name.charAt(0)}
                   </div>
                   <div className="flex flex-col">
                       <h3 className="text-xl font-bold text-slate-800">{project.supervisor.name}</h3>
                       {project.supervisor.department && (
                          <span className="mt-1 text-sm text-slate-600 font-medium">{project.supervisor.department}</span>
                       )}
                       <div className="mt-4 flex flex-col space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                              <span className="w-16 text-slate-400 text-xs uppercase font-bold">Email</span>
                              <span className="text-slate-700 font-medium">{project.supervisor.email}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm mt-1">
                              <span className="w-16 text-slate-400 text-xs uppercase font-bold mt-0.5">Expertise</span>
                              <div className="flex flex-wrap gap-1 flex-1">
                                  {project.supervisor.experties && project.supervisor.experties.length > 0 ? (
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
           <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative h-full flex flex-col hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                   <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Project Details</h2>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                       project.status === 'Approved' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                       project.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                       project.status === 'Incomplete' ? 'bg-slate-100 text-slate-500 border-slate-300 border-dashed' :
                       'bg-slate-100 text-slate-700 border-slate-200'
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
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Submission Deadline</p>
                          <p className="font-medium text-slate-800">{project.deadline ? new Date(project.deadline).toLocaleDateString('en-GB') : 'Not set yet'}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created On</p>
                          <p className="font-medium text-slate-800">{project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-GB') : 'N/A'}</p>
                      </div>
                   </div>
                   <div className="flex-1 min-h-0 relative">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                       <div className="max-h-[80px] overflow-y-auto pr-2 custom-scrollbar">
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">{project.description || "No description provided."}</p>
                       </div>
                   </div>
               </div>
           </div>
        </div>
      ) : !project ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[300px]">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                 <BookOpen size={38} className="text-slate-600" />
             </div>
             <div className="max-w-md mx-auto">
                 <h2 className="text-2xl font-bold text-slate-800">Submit Your Proposal First</h2>
                 <p className="text-slate-600 mt-2">You must submit your academic project proposal details before you can browse and request a supervisor.</p>
             </div>
             <button onClick={() => navigate("/dashboard/submit-proposal")} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition shadow-md mt-4 flex items-center gap-2">
                 Submit Project Proposal <ArrowRight size={18} />
             </button>
          </div>
      ) : project.status === "Incomplete" ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[300px]">
             <div className="mb-3">
                 <AlertTriangle size={40} className="w-8 h-8 text-slate-500"/>
             </div>
             <div className="max-w-md mx-auto">
                 <h2 className="text-2xl font-bold text-slate-800">Project Incomplete</h2>
                 <p className="text-slate-600 mt-2">You missed the submission deadline, and your project has been marked as incomplete. You cannot request a supervisor.</p>
             </div>
          </div>
      ) : project.status !== "Approved" ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[300px]">
             <div className="mb-3">
                 <Clock size={40} className="w-8 h-8 text-amber-500"/>
             </div>
             <div className="max-w-md mx-auto">
                 <h2 className="text-2xl font-bold text-slate-800">Proposal Pending Approval</h2>
                 <p className="text-slate-600 mt-2">Your project proposal is currently pending. You can request a supervisor once your proposal has been approved by an admin.</p>
             </div>
          </div>
      ) : (
        <>
          <div className="bg-slate-950 rounded-xl p-6 md:p-8 text-white relative mb-8">
            <div className="relative z-10">
                <h1 className="text-2xl font-bold tracking-tight">Available Supervisors</h1>
                <p className="mt-2 text-slate-400 text-sm">
                    Browse and request a supervisor for your approved project.
                </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {supervisors && supervisors.length > 0 ? (
                     supervisors.map((teacher) => {
                        const hasSentRequest = requests?.some(req => 
                            req.type === "Supervisor" && 
                            req.toUser?._id === teacher._id && 
                            req.status === "Pending"
                        );

                        return (
                            <div key={teacher._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm 
                            hover:bg-slate-50 hover:shadow-md transition-all duration-200 
                            group flex flex-col h-full relative overflow-hidden">
                                
                                
                                <div className="flex items-start justify-between relative z-10 mb-4">
                                   <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold border border-slate-200">
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
                                    {hasSentRequest ? (
                                        <button 
                                            disabled
                                            className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-500 py-2.5 rounded-xl font-medium cursor-not-allowed border border-slate-200"
                                        >
                                            <Clock size={16} /> Request Sent
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleOpenModal(teacher._id)}
                                            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                                        >
                                            Request Supervisor <ArrowRight size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                     })
                 ) : (
                     <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                         <User size={48} className="opacity-20 mb-3" />
                         <p>No supervisors available at the moment.</p>
                     </div>
                 )}
          </div>
        </>
      )}
      {/* 🚀 Modal Content for Supervisor Request */}
      {isModalOpen && !project?.supervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Request Supervisor</h2>
            <form onSubmit={handleRequest} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase text-slate-400 mb-1.5 font-bold">Project Title</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-colors bg-white text-slate-800 text-sm" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter your proposed project title"
                  required 
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase text-slate-400 mb-1.5 font-bold">Proposal Message</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-colors min-h-[120px] resize-none bg-white text-slate-800 text-sm hover:bg-slate-50/50" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Explain why you want this supervisor and briefly describe your project..." 
                  required 
                />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm">
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

export default SupervisorPage;