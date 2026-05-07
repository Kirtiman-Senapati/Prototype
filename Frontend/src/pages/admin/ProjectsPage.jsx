import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { updateProjectStatusAdmin, sendFeedbackAdminData, assignTaskAdminData } from "../../store/slices/adminSlice";
import { FolderKanban, Clock, CheckCircle2, XCircle, Search, Filter, Eye, Download, FileText, MonitorPlay, Archive, File, User, Briefcase, Calendar, X, MessageSquare, Plus, CheckCircle } from "lucide-react";
import { toast } from "../../utils/toast";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import FeedbackModal from "../../components/modal/FeedbackModal";

const ProjectsPage = () => {
    const dispatch = useDispatch();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI States
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All");
    const [selectedProject, setSelectedProject] = useState(null); // For modal
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskData, setTaskData] = useState({ title: "", description: "", deadline: "" });
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [studentFeedbacks, setStudentFeedbacks] = useState([]);
    const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
    const { authUser } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!selectedProject?.student?._id) return;
        setIsLoadingFeedbacks(true);
        axiosInstance.get(`/feedback/student/${selectedProject.student._id}`)
            .then(res => setStudentFeedbacks(res.data.feedbacks || []))
            .catch(() => toast.error("Failed to load feedback history"))
            .finally(() => setIsLoadingFeedbacks(false));
    }, [selectedProject?.student?._id]);

    useEffect(() => {
        fetchProjects();
    }, []);

    // Auto-refresh when project data updates
    useAutoRefresh(() => {
        fetchProjects();
    }, "adminDashboardUpdate");


    // Auto-refresh when project data updates
    useAutoRefresh((updatedProject) => {
    setProjects((prev) =>
        prev.map((p) =>
            p._id === updatedProject.projectId
                ? {
                      ...p,
                      status: updatedProject.status ?? p.status,
                      deadline: updatedProject.deadline ?? p.deadline,
                      supervisor: updatedProject.supervisor ?? p.supervisor,
                  }
                : p
        )
    );

    setSelectedProject((prev) => {
        if (!prev || prev._id !== updatedProject.projectId) return prev;

        return {
            ...prev,
            status: updatedProject.status ?? prev.status,
            deadline: updatedProject.deadline ?? prev.deadline,
            supervisor: updatedProject.supervisor ?? prev.supervisor,
        };
    });
}, "projectUpdated");

    const fetchProjects = () => {
        axiosInstance.get("/admin/projects")
            .then(res => {
                setProjects(res.data.projects);
                setIsLoading(false);
                
                // If a project modal is currently open, instantly refresh its inner detailed state
                setSelectedProject(prev => {
                    if (!prev) return null;
                    const updated = res.data.projects.find(p => p._id === prev._id);
                    return updated || prev;
                });
            })
            .catch(() => setIsLoading(false));
    };

    const handleStatusUpdate = (projectId, status) => {
        dispatch(updateProjectStatusAdmin({ id: projectId, status }))
            .unwrap()
            .then((res) => {
                setProjects(projects.map(p => p._id === projectId ? { ...p, status: res.project.status } : p));
                if (selectedProject && selectedProject._id === projectId) {
                    setSelectedProject({ ...selectedProject, status: res.project.status });
                }
            });
    };

    const handleDownload = async (fileUrl, originalFilename) => {
        try {
            const toastId = toast.loading("Downloading file...");
            const response = await fetch(`http://localhost:4000${fileUrl}`);
            if (!response.ok) throw new Error("Download failed");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = originalFilename; 
            
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 500);
            
            toast.update(toastId, { render: "File downloaded successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to download file");
        }
    };

    const getFileIcon = (type, className = "") => {
        if (type === "Report") return <FileText className={`text-blue-500 ${className}`} />;
        if (type === "Presentation") return <MonitorPlay className={`text-amber-500 ${className}`} />;
        if (type === "Code") return <Archive className={`text-purple-500 ${className}`} />;
        return <File className={`text-slate-500 ${className}`} />;
    };

    const handleSendFeedback = async ({ title, type, message }) => {
        setIsSubmittingFeedback(true);
        try {
            await dispatch(sendFeedbackAdminData({
                studentId: selectedProject.student._id,
                title,
                type,
                message
            })).unwrap();
            setIsFeedbackModalOpen(false);
            
            // Refresh local feedback history instantly
            const res = await axiosInstance.get(`/feedback/student/${selectedProject.student._id}`);
            setStudentFeedbacks(res.data.feedbacks || []);
        } catch (error) {
            // Toast handles error
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        setIsSubmittingTask(true);
        try {
            const res = await dispatch(assignTaskAdminData({ projectId: selectedProject._id, ...taskData })).unwrap();
            setTaskData({ title: "", description: "", deadline: "" });
            setIsTaskModalOpen(false);
            // Refresh detailed project local state (merge tasks to preserve populated fields like student/supervisor)
            if (res.project && res.project.tasks) {
                setSelectedProject(prev => ({ ...prev, tasks: res.project.tasks }));
            }
            // Refresh global list to keep state consistent
            fetchProjects();
        } catch (error) {
            // Error managed by Redux
        } finally {
            setIsSubmittingTask(false);
        }
    };

    // Filter Logic
    const cleanProjects = projects.filter(p => p.student && typeof p.student === "object" && p.student._id);

    const isDatePassed = (dateString) => 
    {
        if (!dateString) return false;

        const today = new Date();
        today.setHours(0,0,0,0);

        const deadline = new Date(dateString);
        deadline.setHours(0,0,0,0);

        return deadline < today;
    };

    const getDeadlineStyle = (project) => 
    {

        // Completed project = professional green
        if (project.status === "Completed") {
            return {
                dot: "bg-green-600",
                text: "text-slate-800",
            };
        }

        // Incomplete project = neutral gray
        if (project.status === "Incomplete") {
            return {
                dot: "bg-slate-500",
                text: "text-slate-600",
            };
        }

        // Expired deadline = red
        if (isDatePassed(project.deadline)) {
            return {
                dot: "bg-red-500",
                text: "text-red-600",
            };
        }

        // Normal upcoming deadline
        return {
            dot: "bg-slate-400",
            text: "text-slate-700",
        };
    };

    const filteredProjects = cleanProjects.filter(p => {
        const matchesSearch = p.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.title?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        if (filter === "All") return true;
        return p.status === filter;
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-900 text-white rounded-xl shadow-sm">
                    <FolderKanban size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">All System Projects</h1>
                    <p className="text-slate-500 mt-1">Review and monitor all student projects across the platform.</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by project title or student name..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors"
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
                        <option value="Rejected">Rejected</option>
                        <option value="Completed">Completed</option>
                        <option value="Incomplete">Incomplete</option>
                    </select>
                </div>
            </div>

            {/* Main Projects Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-[11px] tracking-wide uppercase border-b border-slate-200">
                                <th className="py-5 px-6 font-semibold">Project Title</th>
                                <th className="py-5 px-6 font-semibold">Student</th>
                                <th className="py-5 px-6 font-semibold">Supervisor</th>
                                <th className="py-5 px-6 font-semibold text-center">Status</th>
                                <th className="py-5 px-6 font-semibold">Deadline</th>
                                <th className="py-5 px-6 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500 bg-slate-50/50">
                                        <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-lg font-medium text-slate-600">No projects found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map(proj => (
                                    <tr key={proj._id} className="group transition hover:bg-slate-50/80 border-l-2 border-transparent hover:border-slate-300">
                                        <td className="py-5 px-6 w-1/4">
                                            <p className="text-[15px] font-semibold text-slate-900 group-hover:text-slate-950 line-clamp-1" title={proj.title}>{proj.title}</p>
                                            <p className="text-xs text-slate-500 line-clamp-1 mt-1 leading-relaxed" title={proj.description}>{proj.description}</p>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${proj.student ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-500'}`}>
                                                    {proj.student?.name?.charAt(0) || "D"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">{proj.student?.name || <span className="text-red-500 italic">Deleted User</span>}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className="text-sm font-medium text-slate-600">{proj.supervisor?.name || <span className="text-slate-400 italic">Unassigned</span>}</span>
                                        </td>
                                        <td className="py-5 px-6 text-center align-middle">
                                            <div className="flex items-center justify-center gap-2 text-sm text-slate-700 font-medium">
                                                <span className={`w-2 h-2 rounded-full ${
                                                    proj.status === 'Completed' ? 'bg-green-600' :
                                                    proj.status === 'Approved' ? 'bg-slate-700' :
                                                    proj.status === 'Rejected' ? 'bg-red-500' :
                                                    proj.status === 'Incomplete' ? 'bg-slate-500' :
                                                    'bg-amber-500'
                                                }`} />
                                                {proj.status}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-2">
                                                {/* //TODO: Change color when date is passed  */}
                                                <span className={`w-1.5 h-1.5 rounded-full ${getDeadlineStyle(proj).dot}`} />

                                                {/* //TODO: Change text color when date is passed  */}
                                                <span className={`text-sm font-medium ${getDeadlineStyle(proj).text}`}>
                                                    {proj.deadline ? new Date(proj.deadline).toLocaleDateString("en-GB") : 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => setSelectedProject(proj)}
                                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition"
                                                    title="View Details"
                                                >
                                                    View
                                                </button>
                                                {proj.status === "Pending" && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(proj._id, "Approved")}
                                                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 transition"
                                                            title="Approve Proposal"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(proj._id, "Rejected")}
                                                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-slate-200 rounded-md hover:bg-red-50 hover:border-red-200 transition"
                                                            title="Reject Proposal"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  PROJECT DETAILS MODAL */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10 rounded-t-xl">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                        <FolderKanban size={20} /> 
                                    </div>
                                    Project Details
                                </h2>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsFeedbackModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <MessageSquare size={16} />
                                        Feedback
                                    </button>
                                    <button 
                                        onClick={() => setIsTaskModalOpen(true)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Plus size={16} />
                                        Task
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedProject(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Modal Body (Scrollable) */}
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10">
                            
                            {/* BASIC INFO */}
                            <div className="relative">
                                <div className="absolute top-0 right-0">
                                    <div className="px-3 py-1 text-xs font-medium bg-slate-900 text-white rounded-full shadow-sm">
                                        {selectedProject.status}
                                    </div>
                                </div>
                                <h4 className="text-3xl font-semibold text-slate-900 tracking-tight pr-24">{selectedProject.title}</h4>
                                <div className="mt-2 flex items-center gap-3 text-sm mb-6">
                                    <span className="text-slate-500">Project</span>
                                    <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                    <span className="text-slate-600 font-medium">
                                        {selectedProject.student?.name || "Deleted User"}
                                    </span>
                                </div>
                                
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-6">Description</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6">{selectedProject.description}</p>
                                
                                <div className="flex items-center gap-2 text-sm text-slate-700 inline-flex py-1">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="font-semibold text-slate-500">Deadline:</span>
                                    <span className="font-bold">{selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString("en-GB") : 'Not Set'}</span>
                                </div>
                            </div>

                            {/* IDENTITIES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Student */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Student Information</h3>
                                    <div className="flex items-center gap-4 pt-1">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${selectedProject.student ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-500'}`}>
                                            {selectedProject.student?.name?.charAt(0) || "D"}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-lg font-bold text-slate-800 truncate">{selectedProject.student?.name || <span className="text-red-500 italic">Deleted User</span>}</span>
                                            <span className="text-sm font-medium text-slate-500 truncate">{selectedProject.student?.email || "No email available"}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Supervisor */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Supervisor Assignment</h3>
                                    <div className="flex items-center gap-4 pt-1 h-[56px]">
                                        {selectedProject.supervisor ? (
                                            <>
                                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl shrink-0">
                                                    {selectedProject.supervisor.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-lg font-bold text-slate-800 truncate">{selectedProject.supervisor.name}</span>
                                                    <span className="text-sm font-medium text-slate-500 truncate">{selectedProject.supervisor.email}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200 border-dashed shrink-0">
                                                    <Briefcase size={20} />
                                                </div>
                                                <span className="text-slate-500 italic font-medium">Not Assigned Yet</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* TASK TRACKING & PROGRESS */}
                            <div className="pt-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                                    <CheckCircle size={14} className="text-slate-500" /> Task Progress
                                </h3>
                                <div className="mt-2">
                                    {(() => {
                                        const tasks = selectedProject.tasks || [];
                                        const totalTasks = tasks.length;
                                        const completedTasks = tasks.filter(t => t.status === "Completed").length;
                                        const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                                        
                                        return (
                                            <div className="flex flex-col gap-4 bg-slate-50 p-5 rounded-xl">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">Completion Status</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{completedTasks} of {totalTasks} tasks completed</p>
                                                    </div>
                                                    <span className="text-3xl font-semibold text-slate-900">{taskProgress}%</span>
                                                </div>
                                                
                                                {/* Progress Bar (SaaS Feel) */}
                                                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className="bg-slate-900 h-3 rounded-full transition-all duration-1000 ease-out" 
                                                        style={{ width: `${taskProgress}%` }}
                                                    ></div>
                                                </div>
                                                
                                                {totalTasks > 0 ? (
                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {[...tasks].sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((t, i) => (
                                                            <div key={i} className="flex flex-col gap-1.5 py-3 pl-4 border-l-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 transition-colors bg-white">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <p className={`text-sm font-bold line-clamp-1 ${t.status === "Completed" ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800"}`}>{t.title}</p>
                                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium shrink-0">
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                                            t.status === 'Completed' ? 'bg-emerald-500' :
                                                                            'bg-slate-400'
                                                                        }`} />
                                                                        {t.status}
                                                                    </div>
                                                                </div>
                                                                <p className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                                                                    <span>By: {t.assignedByRole === "admin" ? "Admin" : "Supervisor"}</span>
                                                                    {t.status === "Completed" && t.completedAt ? (
                                                                        <span className="text-emerald-600">Done {new Date(t.completedAt).toLocaleDateString("en-GB")}</span>
                                                                    ) : t.deadline ? (
                                                                        <span>Due {new Date(t.deadline).toLocaleDateString("en-GB")}</span>
                                                                    ) : null}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 text-center py-6 text-slate-400 text-sm font-medium">
                                                        No tasks assigned yet.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* FILES SECTION */}
                            <div className="pt-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                                    <Archive size={14} className="text-slate-500" /> Uploaded Files
                                </h3>
                                
                                {!selectedProject.files || selectedProject.files.length === 0 ? (
                                    <div className="py-8 flex flex-col items-center justify-center text-slate-500">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <File size={28} className="text-slate-300" />
                                        </div>
                                        <p className="text-base font-bold text-slate-700 mb-1">No files uploaded yet</p>
                                        <p className="text-sm font-medium text-slate-400">Student has not attached any project files.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <th className="py-4 px-6">File Name</th>
                                                        <th className="py-4 px-6">Type</th>
                                                        <th className="py-4 px-6">Uploaded On</th>
                                                        <th className="py-4 px-6 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedProject.files.map((file, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    {getFileIcon(file.type, "shrink-0 w-8 h-8 p-1.5 bg-white border border-slate-100 rounded-md shadow-sm")}
                                                                    <span className="text-sm font-bold text-slate-800 truncate max-w-[200px] md:max-w-xs">{file.filename}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">{file.type}</span>
                                                            </td>
                                                            <td className="py-4 px-6 text-sm font-medium text-slate-500">
                                                                {new Date(file.uploadedAt).toLocaleDateString("en-GB")}
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <button 
                                                                    onClick={() => handleDownload(file.url, file.filename)}
                                                                    className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors px-4 py-2 rounded-lg text-xs font-medium"
                                                                >
                                                                    <Download size={14} /> Download
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* FEEDBACK HISTORY TIMELINE */}
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-4 pl-1">
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={14} className="text-emerald-500" /> Feedback Timeline
                                    </h3>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Total: {studentFeedbacks.length}</span>
                                </div>
                                
                                {isLoadingFeedbacks ? (
                                    <div className="flex justify-center p-8">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : studentFeedbacks.length > 0 ? (
                                    <div className="space-y-3">
                                        {studentFeedbacks.map((fb, idx) => (
                                            <div key={idx} className="py-4 border-b border-slate-100 last:border-0 relative group">
                                                <div className="absolute top-4 right-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            fb.type === 'Positive' ? 'bg-emerald-500' :
                                                            fb.type === 'Needs Revision' ? 'bg-red-500' :
                                                            'bg-slate-400'
                                                        }`} />
                                                        {fb.type}
                                                    </div>
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-800 pr-20">{fb.title}</h4>
                                                <p className="text-sm text-slate-600 mt-2 mb-3">{fb.message}</p>
                                                
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/60">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-700 flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                                                            {fb.sender?.name || "Unknown"}
                                                            <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md self-start sm:self-auto">
                                                                {fb.senderRole}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {new Date(fb.createdAt).toLocaleDateString('en-GB')} • {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 flex flex-col items-center justify-center text-center">
                                        <MessageSquare size={24} className="text-slate-300 mb-2" />
                                        <p className="text-sm font-bold text-slate-600">No Feedback Provided</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">This student hasn't received any feedback on this project yet.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                        
                        {/* Modal Footer (Optional, mostly for actions if pending) */}
                        {selectedProject.status === "Pending" && (
                            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
                                <button 
                                    onClick={() => {
                                        handleStatusUpdate(selectedProject._id, "Rejected");
                                    }}
                                    className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-transparent transition"
                                >
                                    Reject Proposal
                                </button>
                                <button 
                                    onClick={() => {
                                        handleStatusUpdate(selectedProject._id, "Approved");
                                    }}
                                    className="px-6 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition shadow-sm"
                                >
                                    Approve Proposal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <FeedbackModal 
                isOpen={isFeedbackModalOpen} 
                onClose={() => setIsFeedbackModalOpen(false)}
                onSubmit={handleSendFeedback}
                isSubmitting={isSubmittingFeedback}
                studentName={selectedProject?.student?.name}
            />

            {/* Task Add Modal for Admin */}
            {isTaskModalOpen && selectedProject && (
                <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="modal-content bg-white p-6 border border-slate-200 rounded-xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Plus className="text-slate-600" /> Assign Task</h2>
                                <p className="text-sm text-slate-500 mt-1">Project: <span className="font-semibold text-slate-700">{selectedProject.title}</span></p>
                            </div>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleAssignTask} className="space-y-4">
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
                                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                                <button type="submit" disabled={isSubmittingTask} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                                    {isSubmittingTask && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                    Assign Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;