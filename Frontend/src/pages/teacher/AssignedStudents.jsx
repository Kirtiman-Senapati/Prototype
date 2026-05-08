import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAssignedStudents, sendFeedbackData } from "../../store/slices/teacherSlice";
import { axiosInstance } from "../../lib/axios";
import { toast } from "../../utils/toast";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import StudentCard from "./components/StudentCard";
import DashboardHeader from "./components/DashboardHeader";
import { Users, Loader } from "lucide-react";
import FeedbackModal from "../../components/modal/FeedbackModal";
import MilestoneTimeline from "../../components/milestones/MilestoneTimeline";
import CreateMilestoneModal from "../../components/milestones/CreateMilestoneModal";
import ReviewMilestoneModal from "../../components/milestones/ReviewMilestoneModal";

const AssignedStudents = () => {
    const dispatch = useDispatch();
    const { assignedStudents, isLoading } = useSelector((state) => state.teacher);
    const [selectedProject, setSelectedProject] = useState(null);
    const [feedbackStudent, setFeedbackStudent] = useState(null);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const [taskData, setTaskData] = useState({ title: "", description: "", deadline: "" });
    
    // Milestone states
    const [milestoneProject, setMilestoneProject] = useState(null);
    const [isCreateMilestoneOpen, setIsCreateMilestoneOpen] = useState(false);
    const [isReviewMilestoneOpen, setIsReviewMilestoneOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

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

    const handleCreateMilestone = async (data) => {
        setIsSubmittingMilestone(true);
        try {
            if (selectedMilestone) {
                await axiosInstance.patch(`/teacher/project/${milestoneProject._id}/milestone/${selectedMilestone._id}`, data);
                toast.success("Milestone updated successfully");
            } else {
                await axiosInstance.post(`/teacher/project/${milestoneProject._id}/milestone`, data);
                toast.success("Milestone created successfully");
            }
            setIsCreateMilestoneOpen(false);
            setSelectedMilestone(null);
            dispatch(getAssignedStudents());
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save milestone");
        } finally {
            setIsSubmittingMilestone(false);
        }
    };

    const handleReviewMilestone = async (milestoneId, status, remarks) => {
        setIsSubmittingMilestone(true);
        try {
            await axiosInstance.patch(`/teacher/project/${milestoneProject._id}/milestone/${milestoneId}/review`, { status, remarks });
            toast.success(`Milestone ${status.toLowerCase()} successfully`);
            setIsReviewMilestoneOpen(false);
            setSelectedMilestone(null);
            dispatch(getAssignedStudents());
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to review milestone");
        } finally {
            setIsSubmittingMilestone(false);
        }
    };

    if (isLoading && (!assignedStudents || assignedStudents.length === 0)) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader className="animate-spin text-slate-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
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
                            onViewMilestones={() => setMilestoneProject(student.project)}
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
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Task Title</label>
                                <input required className="w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none" placeholder="e.g. Complete Literature Review" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                                <textarea required className="w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none min-h-[100px]" placeholder="Add details about this task..." value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
                                <input required type="date" className="w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none cursor-pointer text-slate-600" value={taskData.deadline} onChange={e => setTaskData({...taskData, deadline: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setSelectedProject(null)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm">Assign Task</button>
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

            {/* View Milestones Modal (Full Timeline) */}
            {milestoneProject && (
                <div className="fixed inset-0 z-[40] flex items-center justify-center pt-10 p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white overflow-hidden rounded-xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Project Phases</h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">{milestoneProject.title}</p>
                            </div>
                            <button onClick={() => setMilestoneProject(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition">
                                <Users size={20} className="hidden" /> {/* Placeholder just to use icon import without error if needed, but here we can just use text or simple X */}
                                Close
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                            <MilestoneTimeline 
                                milestones={assignedStudents.find(s => s.project?._id === milestoneProject._id)?.project?.milestones || []} 
                                role="supervisor" 
                                onAddClick={() => { setSelectedMilestone(null); setIsCreateMilestoneOpen(true); }}
                                onEditClick={(m) => { setSelectedMilestone(m); setIsCreateMilestoneOpen(true); }}
                                onReviewClick={(m) => { setSelectedMilestone(m); setIsReviewMilestoneOpen(true); }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Milestone Modal */}
            <CreateMilestoneModal 
                isOpen={isCreateMilestoneOpen}
                onClose={() => { setIsCreateMilestoneOpen(false); setSelectedMilestone(null); }}
                onSubmit={handleCreateMilestone}
                initialData={selectedMilestone}
            />

            {/* Review Milestone Modal */}
            <ReviewMilestoneModal 
                isOpen={isReviewMilestoneOpen}
                onClose={() => { setIsReviewMilestoneOpen(false); setSelectedMilestone(null); }}
                onSubmit={handleReviewMilestone}
                milestone={selectedMilestone}
                isSubmitting={isSubmittingMilestone}
            />
        </div>
    );
};

export default AssignedStudents;
