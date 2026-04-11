import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAssignedStudents } from "../../store/slices/teacherSlice";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

const AssignedStudents = () => {
    const dispatch = useDispatch();
    const { assignedStudents } = useSelector((state) => state.teacher);
    const [selectedProject, setSelectedProject] = useState(null);

    const [taskData, setTaskData] = useState({ title: "", description: "", deadline: "" });

    useEffect(() => {
        dispatch(getAssignedStudents());
    }, [dispatch]);

    const handleAddTask = (e) => {
        e.preventDefault();
        axiosInstance.post("/teacher/task", { projectId: selectedProject._id, ...taskData })
            .then(() => {
                toast.success("Task assigned successfully");
                setTaskData({ title: "", description: "", deadline: "" });
                setSelectedProject(null);
                dispatch(getAssignedStudents());
            }).catch(() => toast.error("Failed to add task"));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Assigned Students</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedStudents && assignedStudents.map((student) => (
                    <div key={student._id} className="card">
                        <h2 className="font-semibold text-lg text-slate-800">{student.name}</h2>
                        <p className="text-sm text-slate-500">{student.email}</p>
                        <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Project</p>
                            {student.project ? (
                                <div>
                                    <h3 className="font-medium">{student.project.title}</h3>
                                    <p className="text-xs text-slate-500 truncate">{student.project.description}</p>
                                    <span className={`badge badge-${student.project.status.toLowerCase()} mt-2`}>
                                        {student.project.status}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-sm italic text-slate-400">No project submitted</p>
                            )}
                        </div>

                        {student.project && (
                            <div className="mt-6 flex flex-col gap-2">
                                <button className="btn-outline btn-small w-full" onClick={() => setSelectedProject(student.project)}>
                                    Add Task
                                </button>
                                {/* Download logic would be nice here assuming `files` exist on project. We will just list links. */}
                                {student.project.files?.length > 0 && (
                                     <div className="text-sm mt-3 pt-3 border-t">
                                        <p className="font-medium text-slate-600 mb-1">Uploaded Docs:</p>
                                        <ul className="space-y-1">
                                            {student.project.files.map((file, i) => (
                                                 <li key={i}>
                                                     <a href={`http://localhost:4000${file.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{file.filename}</a>
                                                 </li>
                                            ))}
                                        </ul>
                                     </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedProject && (
                <div className="modal-overlay">
                    <div className="modal-content p-6">
                        <h2 className="text-xl font-bold mb-4">Assign Task</h2>
                        <p className="text-sm mb-4">Project: {selectedProject.title}</p>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="label">Task Title</label>
                                <input required className="input" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <textarea required className="input" value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="label">Deadline</label>
                                <input required type="date" className="input" value={taskData.deadline} onChange={e => setTaskData({...taskData, deadline: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setSelectedProject(null)} className="btn-outline">Cancel</button>
                                <button type="submit" className="btn-primary">Add Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignedStudents;
