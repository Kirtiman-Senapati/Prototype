import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAvailableSupervisors, requestSupervisor, getStudentDashboard } from "../../store/slices/studentSlice";
import { toast } from "react-toastify";

const SupervisorPage = () => {
  const dispatch = useDispatch();
  const { supervisors, project } = useSelector((state) => state.student);
  
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

  const handleOpenModal = (id) => {
    setSelectedTeacherId(id);
    setTitle(project?.title || "");
    setIsModalOpen(true);
  };

  const handleRequest = (e) => {
    e.preventDefault();
    dispatch(requestSupervisor({ teacherId: selectedTeacherId, title, description }))
      .then((res) => {
        if (!res.error) setIsModalOpen(false);
      });
  };

  return (
    <div className="space-y-6">
      {project?.supervisor ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
               <h2 className="text-lg font-bold text-slate-800">Current Supervisor</h2>
               <span className="badge badge-approved text-xs px-2 py-0.5 shadow-sm border border-green-200 bg-green-50 text-green-600">Assigned</span>
            </div>
            
            <div className="card w-full shadow-sm border border-slate-200">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex gap-4 items-start">
                       <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                          {project.supervisor.name.charAt(0)}
                       </div>
                       <div>
                           <h2 className="font-semibold text-lg text-slate-800 leading-tight">{project.supervisor.name}</h2>
                           {project.supervisor.department && (
                               <span className="bg-blue-600 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm inline-block mt-1">
                                   {project.supervisor.department}
                               </span>
                           )}
                           <p className="text-sm text-slate-500 mt-3 font-medium text-[13px]">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Email</span>
                              {project.supervisor.email}
                           </p>
                       </div>
                   </div>
                   
                   <div className="md:max-w-xs xl:max-w-md">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 md:text-right">Expertise</p>
                       <div className="flex flex-wrap md:justify-end gap-2">
                           {project.supervisor.experties && project.supervisor.experties.length > 0 ? (
                               project.supervisor.experties.map((exp, idx) => (
                                   <span key={idx} className="text-[14px] text-slate-800 font-medium">{exp}</span>
                               ))
                           ) : (
                               <span className="text-sm text-slate-500 italic">Not specified</span>
                           )}
                       </div>
                   </div>
               </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">Project Details</h2>
            </div>
            <div className="card shadow-sm border border-slate-200 p-6 max-w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">PROJECT TITLE</p>
                        <p className="text-base font-bold text-slate-800">{project.title}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">DEADLINE</p>
                        <p className="text-sm font-bold text-slate-800">
                           {project.deadline ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'}) : '10th December 2027'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">STATUS</p>
                        <div className="mt-1">
                            <span className="badge badge-approved text-xs px-2.5 py-0.5 shadow-sm bg-green-50 text-green-600 border border-green-200">{project.status || 'Approved'}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">CREATED</p>
                        <p className="text-sm font-medium text-slate-700">
                            {project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'}) : '9th January 2026'}
                        </p>
                    </div>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">DESCRIPTION</p>
                   <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{project.description}</p>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Available Supervisors</h1>
            <p className="text-slate-500 mt-1">Browse and request a supervisor for your project.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supervisors && supervisors.map((teacher) => (
              <div key={teacher._id} className="card flex flex-col justify-between">
                <div>
                  <h2 className="font-semibold text-lg text-slate-800">{teacher.name}</h2>
                  <p className="text-sm text-slate-500">{teacher.email}</p>
                  
                  <div className="mt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.experties && teacher.experties.length > 0 ? teacher.experties.map((exp, idx) => (
                        <span key={idx} className="text-sm text-slate-700">{exp}</span>
                      )) : <span className="text-sm text-slate-500">Not specified</span>}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleOpenModal(teacher._id)}
                  className="btn-primary w-full mt-6"
                >
                  Request Supervisor
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && !project?.supervisor && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <h2 className="text-xl font-bold mb-4">Request Supervisor</h2>
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="label">Project Title</label>
                <input 
                  type="text" 
                  className="input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="label">Message / Description</label>
                <textarea 
                  className="input min-h-[100px]" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Why do you want this supervisor?" 
                  required 
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPage;