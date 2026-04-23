import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAssignedStudents, sendFeedbackData } from "../../store/slices/teacherSlice";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import StudentCard from "./components/StudentCard";
import DashboardHeader from "./components/DashboardHeader";
import { Users, Loader } from "lucide-react";
import FeedbackModal from "../../components/modal/FeedbackModal";

const AssignedStudents = () => {
    const dispatch = useDispatch();
    const { assignedStudents, isLoading } = useSelector((state) => state.teacher);
    const [selectedProject, setSelectedProject] = useState(null);
    const [feedbackStudent, setFeedbackStudent] = useState(null);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const [taskData, setTaskData] = useState({ title: "", description: "", deadline: "" });

    const { authUser } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getAssignedStudents());
    }, [dispatch]);

    useAutoRefresh(() => {
        dispatch(getAssignedStudents());
    });

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

    const handleSendFeedback = async ({ title, type, message }) => {
        setIsSubmittingFeedback(true);
        try {
            await dispatch(sendFeedbackData({
                studentId: feedbackStudent._id,
                title,
                type,
                message
            })).unwrap();
            setFeedbackStudent(null);
        } catch (error) {
            // Error handled by redux
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    if (isLoading && (!assignedStudents || assignedStudents.length === 0)) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <DashboardHeader 
                title="Assigned Students" 
                subtitle="Manage tasks and review projects across your assigned mentees."
                icon={Users}
            />
            
            {assignedStudents && assignedStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignedStudents.map((student) => (
                        <StudentCard 
                            key={student._id} 
                            student={student} 
                            onAddTask={() => setSelectedProject(student.project)} 
                            onAddFeedback={() => setFeedbackStudent(student)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No Assigned Students</h3>
                    <p className="text-sm">You currently do not have any students assigned to your supervision.</p>
                </div>
            )}

            {/* Task Add Modal */}
            {selectedProject && (
                <div className="modal-overlay">
                    <div className="modal-content p-6 border border-slate-200 rounded-xl shadow-xl max-w-md w-full">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Assign Task</h2>
                            <p className="text-sm text-slate-500 mt-1">Project: <span className="font-semibold text-slate-700">{selectedProject.title}</span></p>
                        </div>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="label text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Task Title</label>
                                <input required className="input w-full p-2.5 border border-slate-200 rounded-lg text-sm" placeholder="e.g. Complete Literature Review" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="label text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                                <textarea required className="input w-full p-2.5 border border-slate-200 rounded-lg text-sm min-h-[100px]" placeholder="Add details about this task..." value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="label text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Deadline</label>
                                <input required type="date" className="input w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-600" value={taskData.deadline} onChange={e => setTaskData({...taskData, deadline: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setSelectedProject(null)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm">Assign Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <FeedbackModal 
                isOpen={!!feedbackStudent} 
                onClose={() => setFeedbackStudent(null)}
                onSubmit={handleSendFeedback}
                isSubmitting={isSubmittingFeedback}
                studentName={feedbackStudent?.name}
            />
        </div>
    );
};

export default AssignedStudents;
