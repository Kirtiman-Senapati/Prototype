import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { updateProjectStatusAdmin, sendFeedbackAdminData, assignTaskAdminData } from "../../store/slices/adminSlice";
import { FolderKanban, Clock, CheckCircle2, XCircle, Search, Filter, Eye, Download, FileText, MonitorPlay, Archive, File, User, Briefcase, Calendar, X, MessageSquare, Plus, CheckCircle } from "lucide-react";
import { toast } from "../../utils/toast";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import FeedbackModal from "../../components/modal/FeedbackModal";
import MilestoneTimeline from "../../components/milestones/MilestoneTimeline";
import CreateMilestoneModal from "../../components/milestones/CreateMilestoneModal";
import ReviewMilestoneModal from "../../components/milestones/ReviewMilestoneModal";

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
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [taskData, setTaskData] = useState({ title: "", description: "", deadline: "" });
    const [groupData, setGroupData] = useState({ groupName: "", memberEmails: "" });
    const [pendingInvites, setPendingInvites] = useState([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
    const [studentFeedbacks, setStudentFeedbacks] = useState([]);
    const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
    
    // Milestone states
    const [isCreateMilestoneOpen, setIsCreateMilestoneOpen] = useState(false);
    const [isReviewMilestoneOpen, setIsReviewMilestoneOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

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
        setProjects((prevProjects) =>
            prevProjects.map((prevProject) =>
                prevProject._id === updatedProject.projectId
                    ? {
                        ...prevProject,
                        status: updatedProject.status ?? prevProject.status,
                        deadline: updatedProject.deadline ?? prevProject.deadline,
                        supervisor: updatedProject.supervisor ?? prevProject.supervisor,
                    }
                    : prevProject
            )
        );

        // fallback sync
        setTimeout(() => {
            fetchProjects();
        }, 300);

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

    const fetchProjects = useCallback(() => {
        setIsLoading(true);
        axiosInstance.get("/admin/projects")
            .then(res => {
                setProjects(res.data.projects);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);


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
        if (type === "Report") return <FileText className={`text-slate-800 ${className}`} />;
        if (type === "Presentation") return <MonitorPlay className={`text-slate-800 ${className}`} />;
        if (type === "Code") return <Archive className={`text-slate-800 ${className}`} />;
        return <File className={`text-slate-800 ${className}`} />;
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
            if (res.project) {
                setSelectedProject(prev => ({ ...prev, tasks: res.project.tasks, workspaceItems: res.project.workspaceItems }));
            }
            // Refresh global list to keep state consistent
            fetchProjects();
        } catch (error) {
            // Error managed by Redux
        } finally {
            setIsSubmittingTask(false);
        }
    };

    const fetchPendingInvites = async (projectId) => {
        try {
            const res = await axiosInstance.get(`/admin/project/${projectId}`);
            if (res.data.pendingInvites) {
                setPendingInvites(res.data.pendingInvites);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isGroupModalOpen && selectedProject) {
            fetchPendingInvites(selectedProject._id);
        }
    }, [isGroupModalOpen, selectedProject]);

    const handleUpdateGroupName = async (e) => {
        e.preventDefault();
        setIsSubmittingGroup(true);
        try {
            const res = await axiosInstance.patch(`/admin/project/${selectedProject._id}/group-name`, {
                groupName: groupData.groupName
            });
            toast.success("Group name updated successfully");
            if (res.data.success) {
                setSelectedProject(prev => ({ ...prev, groupName: groupData.groupName }));
                fetchProjects();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update group name");
        } finally {
            setIsSubmittingGroup(false);
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setIsSubmittingGroup(true);
        try {
            await axiosInstance.post(`/admin/project/${selectedProject._id}/invite`, { email: inviteEmail });
            toast.success("Invitation sent successfully");
            setInviteEmail("");
            fetchPendingInvites(selectedProject._id);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send invite");
        } finally {
            setIsSubmittingGroup(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            await axiosInstance.delete(`/admin/project/${selectedProject._id}/member/${userId}`);
            toast.success("Member removed");
            setSelectedProject(prev => ({
                ...prev,
                members: prev.members.filter(m => m._id !== userId)
            }));
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove member");
        }
    };

    const handleCancelInvite = async (inviteId) => {
        if (!window.confirm("Cancel this invitation?")) return;
        try {
            await axiosInstance.delete(`/admin/project/${selectedProject._id}/invite/${inviteId}`);
            toast.success("Invitation cancelled");
            fetchPendingInvites(selectedProject._id);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel invite");
        }
    };

    const handleResendInvite = async (inviteId) => {
        try {
            await axiosInstance.post(`/admin/project/${selectedProject._id}/invite/${inviteId}/resend`);
            toast.success("Invitation resent");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resend invite");
        }
    };

    const handleCreateMilestone = async (data) => {
        setIsSubmittingMilestone(true);
        try {
            if (selectedMilestone) {
                await axiosInstance.patch(`/admin/project/${selectedProject._id}/milestone/${selectedMilestone._id}`, data);
                toast.success("Milestone updated successfully");
            } else {
                await axiosInstance.post(`/admin/project/${selectedProject._id}/milestone`, data);
                toast.success("Milestone created successfully");
            }
            setIsCreateMilestoneOpen(false);
            setSelectedMilestone(null);
            fetchProjects();
            // Optional: update selectedProject's milestones by re-fetching or optimistic update
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save milestone");
        } finally {
            setIsSubmittingMilestone(false);
        }
    };

    const handleReviewMilestone = async (milestoneId, status, remarks) => {
        setIsSubmittingMilestone(true);
        try {
            await axiosInstance.patch(`/admin/project/${selectedProject._id}/milestone/${milestoneId}/review`, { status, remarks });
            toast.success(`Milestone ${status.toLowerCase()} successfully`);
            setIsReviewMilestoneOpen(false);
            setSelectedMilestone(null);
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to review milestone");
        } finally {
            setIsSubmittingMilestone(false);
        }
    };

    // Filter Logic
    const cleanProjects = projects.filter(p => p.student && typeof p.student === "object" && p.student._id);

    const isDatePassed = (dateString) => {
        if (!dateString) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadline = new Date(dateString);
        deadline.setHours(0, 0, 0, 0);

        return deadline < today;
    };

    const getDeadlineStyle = (project) => {

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
        const leaderMatch = p.student?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const titleMatch = p.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const groupMatch = p.groupName?.toLowerCase().includes(searchTerm.toLowerCase());
        const memberMatch = p.members?.some(m => m?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSearch = leaderMatch || titleMatch || groupMatch || memberMatch;

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

            {/* Main Projects Table / Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-[11px] tracking-wide uppercase border-b border-slate-200">
                                <th className="py-5 px-6 font-semibold">Project Title</th>
                                <th className="py-5 px-6 font-semibold">Student</th>
                                <th className="py-5 px-6 font-semibold">Supervisor</th>
                                <th className="py-5 px-6 font-semibold text-center">Status</th>
                                <th className="py-5 px-6 font-semibold">Deadline</th>
                                <th className="py-5 px-6 font-semibold">Progress</th>
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
                                            {proj.groupName && <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block border border-slate-200">{proj.groupName}</span>}
                                            <p className="text-xs text-slate-500 line-clamp-1 mt-1 leading-relaxed" title={proj.description}>{proj.description}</p>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${proj.student ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-500'}`}>
                                                    {proj.student?.name?.charAt(0) || "D"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {proj.student?.name || <span className="text-red-500 italic">Deleted User</span>}
                                                        {proj.members?.length > 0 && <span className="text-[10px] ml-1.5 text-slate-400 font-bold uppercase">(Leader)</span>}
                                                    </span>
                                                    {proj.members?.length > 0 && (
                                                        <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                                            +{proj.members.length} Member{proj.members.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className="text-sm font-medium text-slate-600">{proj.supervisor?.name || <span className="text-slate-400 italic">Unassigned</span>}</span>
                                        </td>
                                        <td className="py-5 px-6 text-center align-middle">
                                            <div className="flex items-center justify-center gap-2 text-sm text-slate-700 font-medium">
                                                <span className={`w-2 h-2 rounded-full ${proj.status === 'Completed' ? 'bg-green-600' :
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
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col gap-1.5 w-24">
                                                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                                                    <span>{proj.progress || 0}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                                                    <div 
                                                        className="bg-slate-600 h-1.5 rounded-full transition-all duration-500 ease-out" 
                                                        style={{ width: `${proj.progress || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedProject(proj)}
                                                    className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition"
                                                    title="View Details"
                                                >
                                                    View
                                                </button>
                                                {proj.status === "Pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(proj._id, "Approved")}
                                                            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition"
                                                            title="Approve Proposal"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(proj._id, "Rejected")}
                                                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-slate-200 rounded-md hover:bg-red-50/80 hover:border-red-50/80 transition"
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

                {/* Mobile Card View */}
                <div className="block md:hidden flex flex-col divide-y divide-slate-100">
                    {filteredProjects.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-slate-50/50">
                            <FolderKanban size={32} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-medium text-slate-600">No projects found.</p>
                        </div>
                    ) : (
                        filteredProjects.map(proj => (
                            <div key={proj._id} className="p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="pr-2">
                                        <h3 className="text-[14px] font-bold text-slate-900 leading-tight line-clamp-2">{proj.title}</h3>
                                        {proj.groupName && <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md mt-1 mb-1 inline-block border border-slate-200">{proj.groupName}</span>}
                                        <p className="text-xs text-slate-500 mt-1 font-medium">
                                            {proj.student?.name || <span className="text-red-500 italic">Deleted User</span>}
                                            {proj.members?.length > 0 && <span className="ml-1 text-[10px] text-slate-400 font-bold"> (+{proj.members.length})</span>}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 px-2.5 py-1 text-[10px] uppercase font-bold rounded-full border ${
                                        proj.status === 'Completed' ? 'bg-green-50 text-slate-800 border-slate-500' :
                                        proj.status === 'Approved' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                        proj.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                        proj.status === 'Incomplete' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {proj.status === 'Approved' ? 'Active' : proj.status}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                    <div className="flex items-center gap-1.5">
                                        <Briefcase size={12} className="text-slate-400" />
                                        <span className="font-medium">{proj.supervisor?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} className="text-slate-400" />
                                        <span className={`font-medium ${getDeadlineStyle(proj).text}`}>
                                            {proj.deadline ? new Date(proj.deadline).toLocaleDateString("en-GB") : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                                    <div className="flex flex-col gap-1.5 w-1/2">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Progress</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-slate-600 h-1.5 rounded-full" style={{ width: `${Math.min(proj.progress || 0, 100)}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500">{Math.min(proj.progress || 0, 100)}%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSelectedProject(proj)} className="text-[11px] font-bold text-slate-700 border border-slate-200 bg-white px-3 py-1.5 rounded-md hover:bg-slate-50 shadow-sm transition-all">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/*  PROJECT DETAILS MODAL */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white overflow-hidden rounded-xl w-full max-w-5xl border border-slate-200 flex flex-col max-h-[85vh] shadow-xl">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
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
                                        onClick={() => {
                                            setGroupData({
                                                groupName: selectedProject.groupName || "",
                                                memberEmails: selectedProject.members?.map(m => m.email).join(", ") || ""
                                            });
                                            setIsGroupModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <User size={16} />
                                        Group
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
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                            {/* BASIC INFO */}
                            <div className="relative">
                                <div className="absolute top-0 right-0">
                                    <div className="px-3 py-1 text-xs font-medium bg-slate-900 text-white rounded-full shadow-sm">
                                        {selectedProject.status}
                                    </div>
                                </div>
                                <h4 className="text-2xl font-bold text-slate-900 tracking-tight pr-24">{selectedProject.title}</h4>
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
                                {/* Team */}
                                <div>
                                    <div className="flex items-center justify-between mb-3 pl-1">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Team Information</h3>
                                        {selectedProject.groupName && (
                                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{selectedProject.groupName}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3 pt-1">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${selectedProject.student ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-500'}`}>
                                                {selectedProject.student?.name?.charAt(0) || "D"}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-md font-bold text-slate-800 flex items-center gap-2 truncate">
                                                    {selectedProject.student?.name || <span className="text-red-500 italic">Deleted User</span>}
                                                    {selectedProject.members?.length > 0 && <span className="text-[9px] uppercase tracking-wide bg-slate-800 text-white px-1.5 py-0.5 rounded shadow-sm">Leader</span>}
                                                </span>
                                                <span className="text-xs font-medium text-slate-500 truncate">{selectedProject.student?.email || "No email available"}</span>
                                            </div>
                                        </div>
                                        {selectedProject.members?.map((member, idx) => (
                                            <div key={idx} className="flex items-center gap-4 ml-4">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-slate-50 text-slate-500 border border-slate-200">
                                                    {member?.name?.charAt(0) || "M"}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-bold text-slate-700 truncate">{member?.name || "Unknown Member"}</span>
                                                </div>
                                            </div>
                                        ))}
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
                                        const itemMap = new Map();
                                        (selectedProject.tasks || []).forEach(t => itemMap.set(t._id.toString(), { ...t, type: 'task' }));
                                        (selectedProject.workspaceItems || []).forEach(wi => itemMap.set(wi._id.toString(), wi));
                                        const tasks = Array.from(itemMap.values()).filter(i => i.type === 'task');
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
                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {[...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).map((t, i) => (
                                                            <div key={i} className="bg-white border border-slate-100 rounded-2xl px-4 py-3 hover:bg-slate-50/80 transition-all">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <p className={`text-[15px] font-semibold line-clamp-1 ${t.status === "Completed" ? "text-slate-600" : "text-slate-800"}`}>{t.title}</p>

                                                                    {/*Status badge */}
                                                                    <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold shrink-0">
                                                                        {t.status}
                                                                    </div>
                                                                </div>

                                                                {/* task status by student  */}
                                                                <p className="flex justify-between items-center mt-2">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                                        By {t.assignedByName || (t.assignedByRole === "admin" ? "Admin" : "Supervisor")}
                                                                    </span>
                                                                    {t.status === "Completed" && t.completedAt ? (
                                                                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Done {new Date(t.completedAt).toLocaleDateString("en-GB")}</span>
                                                                    ) : t.deadline ? (
                                                                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Due {new Date(t.deadline).toLocaleDateString("en-GB")}</span>
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
                            
                            {/* MILESTONES (Phase-wise Task Management) */}
                            <div className="pt-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                                    <FolderKanban size={15} className="text-slate-500" /> Project Phases
                                </h3>
                                <div className="h-[400px]">
                                    {(() => {
                                        const itemMap = new Map();
                                        (selectedProject.tasks || []).forEach(t => itemMap.set(t._id.toString(), { ...t, type: 'task' }));
                                        (selectedProject.milestones || []).forEach(m => itemMap.set(m._id.toString(), { ...m, type: 'phase' }));
                                        (selectedProject.workspaceItems || []).forEach(wi => itemMap.set(wi._id.toString(), wi));
                                        const unifiedWorkspaceItems = Array.from(itemMap.values()).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
                                        return (
                                        <MilestoneTimeline 
                                            milestones={unifiedWorkspaceItems} 
                                            role="admin" 
                                            onAddClick={() => { setSelectedMilestone(null); setIsCreateMilestoneOpen(true); }}
                                            onEditClick={(m) => { setSelectedMilestone(m); setIsCreateMilestoneOpen(true); }}
                                            onReviewClick={(m) => { setSelectedMilestone(m); setIsReviewMilestoneOpen(true); }}
                                        />
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* FILES SECTION */}
                            <div className="pt-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                                    <Archive size={15} className="text-slate-500" /> Uploaded Files
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

                                    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                                            <table className="min-w-[900px] w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50/50 uppercase text-[11px] font-medium text-slate-500 tracking-wide">
                                                        <th className="py-4 px-6">File Name</th>
                                                        <th className="py-4 px-6">Type</th>
                                                        <th className="py-4 px-6">Uploaded On</th>
                                                        <th className="py-4 px-6 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedProject.files.map((file, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                                                        {getFileIcon(file.type, "text-slate-600")}
                                                                    </div>
                                                                    <span className="font-semibold text-[13px] text-slate-800 truncate max-w-[200px] md:max-w-xs">{file.filename}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className="text-[12px] font-bold text-slate-500 uppercase">{file.type}</span>
                                                            </td>
                                                            <td className="py-4 px-6 text-[13px] text-slate-500 font-medium">
                                                                {new Date(file.uploadedAt).toLocaleDateString("en-GB")}
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <button
                                                                    onClick={() => handleDownload(file.url, file.filename)}
                                                                    className="text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 text-[12px] font-semibold py-2 px-4 rounded-md transition-colors"
                                                                >
                                                                    Download
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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
                                                        <span className={`w-1.5 h-1.5 rounded-full ${fb.type === 'Positive' ? 'bg-emerald-500' :
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

            {/* Group Management Modal */}
            {isGroupModalOpen && selectedProject && (
                <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="modal-content bg-white p-6 border border-slate-200 rounded-xl shadow-xl max-w-md w-full">
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><User className="text-slate-600" /> Manage Group</h2>
                                <p className="text-sm text-slate-500 mt-1">Project: <span className="font-semibold text-slate-700">{selectedProject.title}</span></p>
                            </div>
                            <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1"><X size={20} /></button>
                        </div>
                        <div className="space-y-6">
                            {/* Group Name Section */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Group Name</label>
                                <form onSubmit={handleUpdateGroupName} className="flex gap-2">
                                    <input className="flex-1 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none" placeholder="e.g. Alpha Team" value={groupData.groupName} onChange={e => setGroupData({ ...groupData, groupName: e.target.value })} />
                                    <button type="submit" disabled={isSubmittingGroup || groupData.groupName === selectedProject.groupName} className="px-4 py-2 rounded-md text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        Update
                                    </button>
                                </form>
                            </div>

                            {/* Active Members */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Active Members</label>
                                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                                    {/* Leader */}
                                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                                {selectedProject.student?.name?.charAt(0) || "L"}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700 leading-none">{selectedProject.student?.name || "Unknown"}</span>
                                                <span className="text-[10px] text-slate-500 mt-0.5">{selectedProject.student?.email}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Leader</span>
                                    </div>
                                    
                                    {/* Members */}
                                    {selectedProject.members && selectedProject.members.length > 0 ? (
                                        selectedProject.members.map(member => (
                                            <div key={member._id} className="flex justify-between items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold border border-slate-200">
                                                        {member.name?.charAt(0) || "M"}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-700 leading-none">{member.name}</span>
                                                        <span className="text-[10px] text-slate-500 mt-0.5">{member.email}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveMember(member._id)} className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                                                    Remove
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-4 text-center text-xs font-medium text-slate-400 italic">No additional members</div>
                                    )}
                                </div>
                            </div>

                            {/* Pending Invites */}
                            {pendingInvites && pendingInvites.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pending Invites</label>
                                    <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                                        {pendingInvites.map(invite => (
                                            <div key={invite._id} className="flex justify-between items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                                                        ?
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-600 leading-none">{invite.email}</span>
                                                        <span className="text-[10px] text-orange-500 font-semibold mt-0.5">Pending Approval</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleResendInvite(invite._id)} className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                                                        Resend
                                                    </button>
                                                    <button onClick={() => handleCancelInvite(invite._id)} className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Invite New Member */}
                            <div className="pt-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Invite Member</label>
                                <form onSubmit={handleInviteMember} className="flex gap-2">
                                    <input type="email" required className="flex-1 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none" placeholder="student@university.edu" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                                    <button type="submit" disabled={isSubmittingGroup || !inviteEmail} className="px-4 py-2 rounded-md text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        Send Invite
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Add Modal for Admin */}
            {isTaskModalOpen && selectedProject && (
                <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="modal-content bg-white p-6 border border-slate-200 rounded-xl shadow-xl max-w-md w-full">
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Plus className="text-slate-600" /> Assign Task</h2>
                                <p className="text-sm text-slate-500 mt-1">Project: <span className="font-semibold text-slate-700">{selectedProject.title}</span></p>
                            </div>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAssignTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Task Title</label>
                                <input required className="w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none" placeholder="e.g. Complete Literature Review" value={taskData.title} onChange={e => setTaskData({ ...taskData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                                <textarea required className="w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none min-h-[100px]" placeholder="Add details about this task..." value={taskData.description} onChange={e => setTaskData({ ...taskData, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
                                <input required type="date" className="w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none cursor-pointer text-slate-600" value={taskData.deadline} onChange={e => setTaskData({ ...taskData, deadline: e.target.value })} />
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

export default ProjectsPage;