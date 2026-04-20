import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { updateProjectStatusAdmin, sendFeedbackAdminData } from "../../store/slices/adminSlice";
import { FolderKanban, Clock, CheckCircle2, XCircle, Search, Filter, Eye, Download, FileText, MonitorPlay, Archive, File, User, Briefcase, Calendar, X, MessageSquare } from "lucide-react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
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
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
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

    useEffect(() => {
        if (!authUser?._id) return;
        
        const socket = io("http://localhost:4000", {
            query: { userId: authUser._id }
        });

        socket.on("adminDashboardUpdate", () => {
            fetchProjects();
        });

        return () => {
            socket.disconnect();
        };
    }, [authUser]);

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
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
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

    // Filter Logic
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.title?.toLowerCase().includes(searchTerm.toLowerCase());
        
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
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center w-full sm:w-auto gap-2">
                    <Filter className="text-slate-400" size={18} />
                    <select 
                        className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer text-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="All">All Projects</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Main Projects Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="py-4 px-6 font-semibold">Project Title</th>
                                <th className="py-4 px-6 font-semibold">Student</th>
                                <th className="py-4 px-6 font-semibold">Supervisor</th>
                                <th className="py-4 px-6 font-semibold text-center">Status</th>
                                <th className="py-4 px-6 font-semibold">Deadline</th>
                                <th className="py-4 px-6 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500 bg-slate-50/50">
                                        <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-lg font-medium text-slate-600">No projects found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map(proj => (
                                    <tr key={proj._id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-4 px-6 w-1/4">
                                            <p className="text-sm font-bold text-slate-800 line-clamp-1" title={proj.title}>{proj.title}</p>
                                            <p className="text-xs text-slate-500 line-clamp-1 mt-1" title={proj.description}>{proj.description}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-xs">
                                                    {proj.student?.name?.charAt(0) || "U"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">{proj.student?.name || "Unknown"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm font-medium text-slate-600">{proj.supervisor?.name || <span className="text-slate-400 italic">Unassigned</span>}</span>
                                        </td>
                                        <td className="py-4 px-6 text-center align-middle">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                                                proj.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                proj.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                proj.status === 'Completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                            }`}>
                                                {proj.status === 'Pending' && <Clock size={12} />}
                                                {proj.status === 'Approved' && <CheckCircle2 size={12} />}
                                                {proj.status === 'Completed' && <CheckCircle2 size={12} />}
                                                {proj.status === 'Rejected' && <XCircle size={12} />}
                                                {proj.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                                            {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => setSelectedProject(proj)}
                                                    className="px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 rounded-md transition-all flex items-center gap-1.5 shadow-sm"
                                                    title="View Details"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                                {proj.status === "Pending" && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(proj._id, "Approved")}
                                                            className="px-3 py-1.5 text-xs font-bold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 rounded-md transition-all shadow-sm"
                                                            title="Approve Proposal"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(proj._id, "Rejected")}
                                                            className="px-3 py-1.5 text-xs font-bold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 rounded-md transition-all shadow-sm"
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

            {/* 🚀 PROJECT DETAILS MODAL */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10 rounded-t-2xl">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <FolderKanban size={20} /> 
                                    </div>
                                    Project Details
                                </h2>
                                <button 
                                    onClick={() => setIsFeedbackModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all"
                                >
                                    <MessageSquare size={16} />
                                    Feedback
                                </button>
                            </div>
                            <button 
                                onClick={() => setSelectedProject(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Modal Body (Scrollable) */}
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                            
                            {/* BASIC INFO */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
                                <div className="absolute top-6 right-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
                                            selectedProject.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                            selectedProject.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            selectedProject.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        {selectedProject.status}
                                    </span>
                                </div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Title</h3>
                                <h4 className="text-2xl font-extrabold text-slate-800 mb-4 pr-24 leading-snug">{selectedProject.title}</h4>
                                
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-6">Description</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedProject.description}</p>
                                
                                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 inline-flex px-4 py-2 rounded-xl border border-slate-200">
                                    <Calendar size={16} className="text-indigo-500" />
                                    <span className="font-semibold text-slate-500">Deadline:</span>
                                    <span className="font-bold">{selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'Not Set'}</span>
                                </div>
                            </div>

                            {/* IDENTITIES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Student */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Student Information</h3>
                                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl shrink-0 border border-blue-200 shadow-sm">
                                            {selectedProject.student?.name?.charAt(0) || "U"}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-lg font-bold text-slate-800 truncate">{selectedProject.student?.name || "Unknown"}</span>
                                            <span className="text-sm font-medium text-slate-500 truncate">{selectedProject.student?.email}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Supervisor */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Supervisor Assignment</h3>
                                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-indigo-200 transition-colors h-[98px]">
                                        {selectedProject.supervisor ? (
                                            <>
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl shrink-0 border border-indigo-200 shadow-sm">
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

                            {/* FILES SECTION */}
                            <div className="pt-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                                    <Archive size={14} className="text-blue-500" /> Uploaded Files
                                </h3>
                                
                                {!selectedProject.files || selectedProject.files.length === 0 ? (
                                    <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-slate-500 shadow-sm">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                            <File size={28} className="text-slate-300" />
                                        </div>
                                        <p className="text-base font-bold text-slate-700 mb-1">No files uploaded yet</p>
                                        <p className="text-sm font-medium text-slate-400">Student has not attached any project files.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
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
                                                                {new Date(file.uploadedAt).toLocaleDateString()}
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <button 
                                                                    onClick={() => handleDownload(file.url, file.filename)}
                                                                    className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:shadow-md"
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
                                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group hover:border-emerald-200 transition-colors">
                                                <div className="absolute top-4 right-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border ${
                                                         fb.type === 'Positive' ? 'bg-green-50 text-green-700 border-green-200' :
                                                         fb.type === 'Needs Revision' ? 'bg-red-50 text-red-700 border-red-200' :
                                                         'bg-blue-50 text-blue-700 border-blue-200'
                                                     }`}>
                                                         {fb.type}
                                                     </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-800 pr-20">{fb.title}</h4>
                                                <p className="text-sm text-slate-600 mt-2 mb-3 bg-white p-3 rounded-lg border border-slate-100">{fb.message}</p>
                                                
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/60">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-700 flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                                                            {fb.sender?.name || "Unknown"}
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md self-start sm:self-auto ${
                                                                fb.senderRole === "Admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                                            }`}>
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
                                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                        <MessageSquare size={24} className="text-slate-300 mb-2" />
                                        <p className="text-sm font-bold text-slate-600">No Feedback Provided</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">This student hasn't received any feedback on this project yet.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                        
                        {/* Modal Footer (Optional, mostly for actions if pending) */}
                        {selectedProject.status === "Pending" && (
                            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
                                <button 
                                    onClick={() => {
                                        handleStatusUpdate(selectedProject._id, "Rejected");
                                    }}
                                    className="px-6 py-2.5 text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all shadow-sm"
                                >
                                    Reject Proposal
                                </button>
                                <button 
                                    onClick={() => {
                                        handleStatusUpdate(selectedProject._id, "Approved");
                                    }}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all shadow-md hover:shadow-lg"
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
        </div>
    );
};

export default ProjectsPage;