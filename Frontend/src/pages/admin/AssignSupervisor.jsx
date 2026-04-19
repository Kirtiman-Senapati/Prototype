import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { axiosInstance } from "../../lib/axios";
import { Search, CheckCircle2, User, Users, Briefcase, Filter, ShieldAlert, Clock, XCircle, Check, Eye, FolderKanban, X, Calendar, Archive, File, FileText, MonitorPlay, Download } from "lucide-react";
import { getAdminSupervisors, assignSupervisorAdmin, updateProjectStatusAdmin } from "../../store/slices/adminSlice";

const AssignSupervisor = () => {
    const dispatch = useDispatch();
    const { supervisors } = useSelector((state) => state.admin);
    
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All");
    const [selections, setSelections] = useState({});
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        dispatch(getAdminSupervisors());
        fetchProjects();
    }, [dispatch]);

    const fetchProjects = () => {
        setIsLoading(true);
        axiosInstance.get("/admin/projects")
            .then(res => {
                setProjects(res.data.projects);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    };

    const handleSelect = (projectId, supervisorId) => {
        setSelections(prev => ({ ...prev, [projectId]: supervisorId }));
    };

    const handleAssign = (projectId) => {
        const supervisorId = selections[projectId];
        if (!supervisorId) return;

        dispatch(assignSupervisorAdmin({ id: projectId, supervisorId }))
            .unwrap()
            .then((res) => {
                setProjects(projects.map(p => p._id === projectId ? { ...p, supervisor: res.project.supervisor } : p));
                setSelections(prev => ({ ...prev, [projectId]: "" })); 
            });
    };

    const handleStatusUpdate = (projectId, status) => {
        dispatch(updateProjectStatusAdmin({ id: projectId, status }))
            .unwrap()
            .then((res) => {
                setProjects(projects.map(p => p._id === projectId ? { ...p, status: res.project.status } : p));
                if (selectedProject && selectedProject._id === projectId) {
                    setSelectedProject(null); // Close modal on approval/rejection
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

    // Calculate stats based on ALL projects
    const totalStudents = projects.length; 
    const assignedStudents = projects.filter(p => p.status === "Approved" && p.supervisor).length;
    const unassignedStudents = projects.filter(p => p.status === "Approved" && !p.supervisor).length;
    const pendingProposals = projects.filter(p => p.status === "Pending").length;

    // Filter projects for table
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.title?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        if (filter === "All") return true;
        if (filter === "Pending") return p.status === "Pending";
        if (filter === "Approved") return p.status === "Approved";
        if (filter === "Assigned") return p.status === "Approved" && !!p.supervisor;
        if (filter === "Unassigned") return p.status === "Approved" && !p.supervisor;
        return true; 
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Assignments</h1>
                    <p className="text-slate-500 mt-1">Approve proposals and manage supervisor assignments.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Projects</p>
                        <h3 className="text-2xl font-bold text-slate-800">{totalStudents}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Pending</p>
                        <h3 className="text-2xl font-bold text-slate-800">{pendingProposals}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Assigned</p>
                        <h3 className="text-2xl font-bold text-slate-800">{assignedStudents}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center shrink-0">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Unassigned</p>
                        <h3 className="text-2xl font-bold text-slate-800">{unassignedStudents}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Teachers</p>
                        <h3 className="text-2xl font-bold text-slate-800">{supervisors.length}</h3>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by student name or project title..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center w-full sm:w-auto gap-2">
                    <Filter className="text-slate-400" size={18} />
                    <select 
                        className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="All">All Projects</option>
                        <option value="Pending">Pending Proposals</option>
                        <option value="Approved">All Approved</option>
                        <option value="Unassigned">Unassigned</option>
                        <option value="Assigned">Assigned</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="p-4 font-semibold">Student</th>
                                <th className="p-4 font-semibold">Project Title</th>
                                <th className="p-4 font-semibold text-center">Status</th>
                                <th className="p-4 font-semibold text-center">Supervisor</th>
                                <th className="p-4 font-semibold min-w-[220px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        No projects found matching the criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map(p => {
                                    const isAssigned = !!p.supervisor;
                                    const isSelected = !!selections[p._id];

                                    return (
                                        <tr key={p._id} className={`transition-colors hover:bg-slate-50 ${p.status === 'Pending' ? 'bg-amber-50/10' : (!isAssigned && p.status === 'Approved' ? 'bg-yellow-50/30' : '')}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                                        {p.student?.name?.charAt(0) || <User size={16}/>}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{p.student?.name}</div>
                                                        <div className="text-xs text-slate-500">{p.student?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <p className="text-sm font-medium text-slate-700 line-clamp-2 max-w-[250px]">{p.title}</p>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    p.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    p.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                    'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                    {p.status === 'Pending' && <Clock size={12} />}
                                                    {p.status === 'Approved' && <CheckCircle2 size={12} />}
                                                    {p.status === 'Rejected' && <XCircle size={12} />}
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                {isAssigned ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                                                        <CheckCircle2 size={12} /> Assigned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                                        Not Assigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {p.status === "Pending" ? (
                                                    <button
                                                        onClick={() => setSelectedProject(p)}
                                                        className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <Eye size={14} /> Review Proposal
                                                    </button>
                                                ) : p.status === "Approved" ? (
                                                    isAssigned ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                                                <Briefcase size={14} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-slate-700">{p.supervisor?.name || "Assigned"}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                className="flex-1 bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow min-w-[140px]"
                                                                value={selections[p._id] || ""}
                                                                onChange={(e) => handleSelect(p._id, e.target.value)}
                                                            >
                                                                <option value="" disabled>Select Supervisor</option>
                                                                {supervisors.map(s => (
                                                                    <option key={s._id} value={s._id}>{s.name}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => handleAssign(p._id)}
                                                                disabled={!isSelected}
                                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap ${
                                                                    isSelected 
                                                                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                                }`}
                                                            >
                                                                Assign
                                                            </button>
                                                        </div>
                                                    )
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-500">Proposal Rejected</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
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
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <FolderKanban size={20} /> 
                                </div>
                                Project Documentation
                            </h2>
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
                            </div>

                            {/* IDENTITIES */}
                            <div className="grid grid-cols-1 gap-6">
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
                        </div>
                        
                        {/* Modal Footer Actions */}
                        {selectedProject.status === "Pending" && (
                            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
                                <button 
                                    onClick={() => handleStatusUpdate(selectedProject._id, "Rejected")}
                                    className="px-6 py-2.5 text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all shadow-sm"
                                >
                                    Reject Proposal
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(selectedProject._id, "Approved")}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all shadow-md hover:shadow-lg"
                                >
                                    Approve Proposal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignSupervisor;
