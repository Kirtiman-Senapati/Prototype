import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAvailableSupervisors, requestSupervisor, getStudentDashboard } from "../../store/slices/studentSlice";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { ArrowRight, CheckCircle, User, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
const SupervisorPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { supervisors, project, authUser } = useSelector((state) => state.student);
  
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
  // Real-Time Socket Connection
  useEffect(() => {
    if (!authUser?._id) return;
    
    const socket = io("http://localhost:4000", {
        query: { userId: authUser._id }
    });
    socket.on("requestStatusUpdated", (data) => {
        if (data.status === "Accepted") {
            toast.success("Great news! Your supervisor request was accepted.");
            navigate("/dashboard");
        } else if (data.status === "Rejected") {
            toast.error("Your supervisor request was rejected. You can request another supervisor.");
        }
        dispatch(getStudentDashboard());
    });
    return () => {
        socket.disconnect();
    };
  }, [authUser, dispatch, navigate]);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {project?.supervisor ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                       {project.supervisor.name.charAt(0)}
                   </div>
                   <div className="flex flex-col">
                       <h3 className="text-xl font-bold text-slate-800">{project.supervisor.name}</h3>
                       {project.supervisor.department && (
                          <span className="mt-1 text-sm text-indigo-600 font-medium inline-block">{project.supervisor.department}</span>
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
        </div>
      ) : !project ? (
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
      ) : (
        <>
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg overflow-hidden relative mb-8">
            <div className="relative z-10">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Available Supervisors</h1>
                <p className="mt-2 text-slate-300 text-md font-medium opacity-90">
                    Browse and request a supervisor for your project.
                </p>
            </div>
            {/* Decorative background shape */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl"></div>
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
        </>
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
export default SupervisorPage;