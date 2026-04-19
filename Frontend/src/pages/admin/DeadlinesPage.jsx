import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { updateProjectDeadlineAdmin } from "../../store/slices/adminSlice";
import { Calendar as CalendarIcon, Search, Clock, CheckCircle2, User, X, CalendarPlus, Filter, AlertCircle } from "lucide-react";

const DeadlinesPage = () => {
    const dispatch = useDispatch();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI States
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Modal Form States
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [modalSearchTerm, setModalSearchTerm] = useState("");
    const [deadlineDate, setDeadlineDate] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = () => {
        setIsLoading(true);
        axiosInstance.get("/admin/projects")
            .then(res => {
                setProjects(res.data.projects);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    };

    const handleSaveDeadline = () => {
        if (!selectedProjectId || !deadlineDate) return;
        
        dispatch(updateProjectDeadlineAdmin({ id: selectedProjectId, deadline: deadlineDate }))
            .unwrap()
            .then((res) => {
                // Update local state instantly
                setProjects(projects.map(p => p._id === selectedProjectId ? { ...p, deadline: res.project.deadline } : p));
                setIsModalOpen(false);
                setSelectedProjectId("");
                setDeadlineDate("");
                setModalSearchTerm("");
            });
    };

    const openModalForProject = (proj) => {
        setSelectedProjectId(proj._id);
        setModalSearchTerm(proj.title);
        // Pre-fill date if exists for input type="date" (YYYY-MM-DD)
        if (proj.deadline) {
            const d = new Date(proj.deadline);
            setDeadlineDate(d.toISOString().split('T')[0]);
        } else {
            setDeadlineDate("");
        }
        setIsModalOpen(true);
    };

    // Filter projects for the main table (only Approved or Completed make sense for deadlines usually, but let's show all that aren't rejected to match standard behavior)
    const validProjects = useMemo(() => {
        return projects.filter(p => p.status !== "Rejected");
    }, [projects]);

    const filteredProjects = validProjects.filter(p => {
        const matchesSearch = p.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.title?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Options for Modal Dropdown
    const modalFilteredProjects = validProjects.filter(p => 
        p.title?.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
        p.student?.name?.toLowerCase().includes(modalSearchTerm.toLowerCase())
    );

    const isDatePassed = (dateString) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 opacity-50 rounded-full blur-3xl z-0"></div>
                
                <div className="flex items-center gap-5 z-10 w-full">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                        <CalendarIcon size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manage Deadlines</h1>
                        <p className="text-slate-500 mt-1 font-medium">Create and monitor project submission deadlines.</p>
                    </div>
                </div>

                <button 
                    onClick={() => {
                        setSelectedProjectId("");
                        setModalSearchTerm("");
                        setDeadlineDate("");
                        setIsModalOpen(true);
                    }}
                    className="z-10 w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
                >
                    <CalendarPlus size={20} /> Create/Update Deadline
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search Deadlines by project or student..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Projects Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <Clock size={18} className="text-slate-600" />
                    <h3 className="font-extrabold text-slate-700">Project Deadlines Tracker</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-white text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                                <th className="py-5 px-6">Student</th>
                                <th className="py-5 px-6">Project Title</th>
                                <th className="py-5 px-6">Supervisor</th>
                                <th className="py-5 px-6 font-semibold">Deadline</th>
                                <th className="py-5 px-6 text-center">Status</th>
                                <th className="py-5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500 bg-slate-50/50">
                                        <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
                                        <p className="text-lg font-bold text-slate-600">No project deadlines found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map(proj => {
                                    const isOverdue = isDatePassed(proj.deadline) && proj.status !== "Completed";
                                    return (
                                        <tr key={proj._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="py-4 px-6 w-[20%]">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{proj.student?.name || "Unknown"}</span>
                                                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">{proj.student?.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 w-[30%]">
                                                <p className="text-sm font-bold text-slate-700 line-clamp-1" title={proj.title}>{proj.title}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                                        {proj.supervisor?.name?.charAt(0) || <User size={12}/>}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600">{proj.supervisor?.name || <span className="text-slate-400 italic">Unassigned</span>}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {proj.deadline ? (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border ${
                                                        isOverdue 
                                                        ? 'bg-red-50 text-red-700 border-red-200' 
                                                        : 'bg-white text-slate-700 border-slate-200'
                                                    }`}>
                                                        {isOverdue ? <AlertCircle size={14} className="text-red-500" /> : <CalendarIcon size={14} className="text-blue-500" />}
                                                        {new Date(proj.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 italic shadow-sm">Not set</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center align-middle">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                                                    proj.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    proj.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    proj.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-slate-50 text-slate-700 border-slate-200'
                                                }`}>
                                                    {proj.status === 'Pending' && <Clock size={12} />}
                                                    {proj.status === 'Approved' && <CheckCircle2 size={12} />}
                                                    {proj.status === 'Completed' && <CheckCircle2 size={12} />}
                                                    {proj.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button 
                                                    onClick={() => openModalForProject(proj)}
                                                    className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                >
                                                    {proj.deadline ? "Update" : "Set Deadline"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
                        
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                Create or Update Deadline
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-8 space-y-6">
                            
                            {/* Project Search / Select */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Project</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 shadow-sm"
                                        placeholder="Type to search project title..."
                                        value={modalSearchTerm}
                                        onChange={(e) => {
                                            setModalSearchTerm(e.target.value);
                                            setSelectedProjectId(""); // reset selection if typing
                                        }}
                                    />
                                    {/* Dropdown Suggestions */}
                                    {modalSearchTerm && !selectedProjectId && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl max-h-48 overflow-y-auto z-20 p-2 custom-scrollbar">
                                            {modalFilteredProjects.length === 0 ? (
                                                <div className="p-3 text-sm text-slate-500 text-center">No projects found.</div>
                                            ) : (
                                                modalFilteredProjects.map(p => (
                                                    <div 
                                                        key={p._id}
                                                        className="px-4 py-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setSelectedProjectId(p._id);
                                                            setModalSearchTerm(p.title);
                                                            if (p.deadline) {
                                                                setDeadlineDate(new Date(p.deadline).toISOString().split('T')[0]);
                                                            } else {
                                                                setDeadlineDate("");
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{p.title}</p>
                                                            <p className="text-xs text-slate-600 font-medium">{p.student?.name || "Unknown Student"}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                                    p.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    p.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    p.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-slate-50 text-slate-700 border-slate-200'
                                                                }`}>
                                                                    {p.status || "Unknown"}
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-medium">Supervisor: {p.supervisor?.name || "Unassigned"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deadline Date</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 shadow-sm cursor-pointer"
                                        value={deadlineDate}
                                        onChange={(e) => setDeadlineDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]} // prevent past dates normally
                                    />
                                </div>
                            </div>

                        </div>
                        
                        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 mt-auto">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveDeadline}
                                disabled={!selectedProjectId || !deadlineDate}
                                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-2 ${(!selectedProjectId || !deadlineDate) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
                            >
                                <CalendarIcon size={16} /> Save Deadline
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeadlinesPage;
