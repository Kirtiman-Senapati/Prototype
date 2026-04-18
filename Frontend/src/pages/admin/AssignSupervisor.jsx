import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { axiosInstance } from "../../lib/axios";
import { Search, CheckCircle2, User, Users, Briefcase, Filter, ShieldAlert, Clock, XCircle, Check } from "lucide-react";
import { getAdminSupervisors, assignSupervisorAdmin, updateProjectStatusAdmin } from "../../store/slices/adminSlice";

const AssignSupervisor = () => {
    const dispatch = useDispatch();
    const { supervisors } = useSelector((state) => state.admin);
    
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All");
    const [selections, setSelections] = useState({});

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
            });
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
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(p._id, "Approved")}
                                                            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                                        >
                                                            <Check size={14} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(p._id, "Rejected")}
                                                            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                                        >
                                                            <XCircle size={14} /> Reject
                                                        </button>
                                                    </div>
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
        </div>
    );
};

export default AssignSupervisor;
