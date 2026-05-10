import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAssignedStudents, sendFeedbackData } from "../../store/slices/teacherSlice";
import { axiosInstance } from "../../lib/axios";
import { toast } from "../../utils/toast";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import StudentCard from "./components/StudentCard";
import DashboardHeader from "./components/DashboardHeader";
import { Users, Loader, Search, Filter } from "lucide-react";
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

    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All");

    const filteredGroups = (assignedStudents || []).filter((student) => {
        const project = student.project || {};
        const matchesSearch =
            student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === "All") return true;

        return project.status === filter;
    });

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
                title="Assigned Project Groups" 
                subtitle="Manage tasks and review projects across your assigned groups."
                icon={Users}
            />
            
            {assignedStudents && assignedStudents.length > 0 && (
                <div className="bg-white p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by student or project..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-1 focus:ring-slate-300 transition-colors text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center w-full sm:w-auto gap-2">
                        <Filter className="text-slate-400" size={18} />
                        <select
                            className="w-full sm:w-48 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 cursor-pointer text-sm"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="All">All Projects</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Completed">Completed</option>
                            <option value="Incomplete">Incomplete</option>
                        </select>
                    </div>
                </div>
            )}

            {assignedStudents && assignedStudents.length > 0 ? (
                filteredGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGroups.map((student) => (
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
                        <Users size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">No matches found</h3>
                        <p className="text-sm">Try adjusting your search query or status filter.</p>
                    </div>
                )
            ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No Assigned Project Groups</h3>
                    <p className="text-sm">You currently do not have any groups assigned to your supervision.</p>
                </div>
            )}

            {/* Task Add Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
                        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">Assign Task</h2>
                            <p className="text-sm text-slate-500 mt-1">Project: <span className="font-semibold text-slate-700">{selectedProject.title}</span></p>
                        </div>
                        <form onSubmit={handleAddTask} className="p-6 space-y-4">
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
            {milestoneProject && (() => {
                const currentProject = assignedStudents.find(s => s.project?._id === milestoneProject._id)?.project;
                let unifiedWorkspaceItems = [];
                if (currentProject) {
                    const itemMap = new Map();
                    (currentProject.tasks || []).forEach(t => itemMap.set(t._id.toString(), { ...t, type: 'task' }));
                    (currentProject.milestones || []).forEach(m => itemMap.set(m._id.toString(), { ...m, type: 'phase' }));
                    (currentProject.workspaceItems || []).forEach(wi => itemMap.set(wi._id.toString(), wi));
                    unifiedWorkspaceItems = Array.from(itemMap.values()).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
                }
                
                return (
                <div className="fixed inset-0 z-[40] flex items-start justify-center overflow-y-auto pt-24 pb-6 px-5 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white overflow-hidden rounded-2xl w-full max-w-4xl border border-slate-200 flex flex-col shadow-xl h-[78vh]">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Project Phases</h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">{milestoneProject.title}</p>
                            </div>
                            <button onClick={() => setMilestoneProject(null)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                                <Users size={20} className="hidden" /> {/* Placeholder just to use icon import without error if needed, but here we can just use text or simple X */}
                                ✕
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-white min-h-0">
                            <MilestoneTimeline 
                                milestones={unifiedWorkspaceItems} 
                                role="supervisor" 
                                onAddClick={() => { setSelectedMilestone(null); setIsCreateMilestoneOpen(true); }}
                                onEditClick={(m) => { setSelectedMilestone(m); setIsCreateMilestoneOpen(true); }}
                                onReviewClick={(m) => { setSelectedMilestone(m); setIsReviewMilestoneOpen(true); }}
                            />
                        </div>
                    </div>
                </div>
                );
            })()}

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
                projectId={milestoneProject?._id}
                isSubmitting={isSubmittingMilestone}
            />
        </div>
    );
};

export default AssignedStudents;
