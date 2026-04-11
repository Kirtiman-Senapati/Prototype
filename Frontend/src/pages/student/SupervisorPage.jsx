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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Available Supervisors</h1>
        <p className="text-slate-500 mt-1">Browse and request a supervisor for your project.</p>
      </div>

      {project?.supervisor && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex flex-col justify-center">
            <h3 className="font-bold text-emerald-700">Supervisor Already Assigned</h3>
            <p className="text-sm mt-1 text-emerald-600 font-medium">You have successfully been assigned to a supervisor. You cannot request a new one.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supervisors && supervisors.map((teacher) => (
          <div key={teacher._id} className="card flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-lg text-slate-800">{teacher.name}</h2>
              <p className="text-sm text-slate-500">{teacher.email}</p>
              
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.experties && teacher.experties.length > 0 ? teacher.experties.map((exp, idx) => (
                    <span key={idx} className="badge bg-blue-50 text-blue-700">{exp}</span>
                  )) : <span className="text-sm text-slate-500">Not specified</span>}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => handleOpenModal(teacher._id)}
              className="btn-primary w-full mt-6 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-500"
              disabled={project?.supervisor}
            >
              {project?.supervisor ? "Already Assigned" : "Request Supervisor"}
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
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
