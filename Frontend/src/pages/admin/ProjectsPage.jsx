import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { FolderKanban, Clock, CheckCircle2, XCircle, User, Briefcase } from "lucide-react";

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        axiosInstance.get("/admin/projects")
            .then(res => {
                setProjects(res.data.projects);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle2 size={16} className="mr-1.5" />;
            case 'Pending': return <Clock size={16} className="mr-1.5" />;
            case 'Rejected': return <XCircle size={16} className="mr-1.5" />;
            case 'Completed': return <CheckCircle2 size={16} className="mr-1.5" />;
            default: return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <FolderKanban size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">All System Projects</h1>
                    <p className="text-slate-500 mt-1">Review and monitor all student projects across the platform.</p>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-slate-500">
                    <FolderKanban size={48} className="text-slate-300 mb-4" />
                    <p className="text-lg font-medium text-slate-600">No projects exist yet.</p>
                    <p className="text-sm mt-1">Projects submitted by students will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projects.map((proj) => (
                        <div key={proj._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all duration-300 group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4 gap-4">
                                <div>
                                    <h2 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">{proj.title}</h2>
                                    <p className="text-slate-500 text-sm mt-2 line-clamp-2">{proj.description}</p>
                                </div>
                                <span className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(proj.status)}`}>
                                    {getStatusIcon(proj.status)}
                                    {proj.status}
                                </span>
                            </div>
                            
                            <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                        <User size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Student</span>
                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]" title={proj.student?.name}>{proj.student?.name || "Unknown"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                        <Briefcase size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Supervisor</span>
                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]" title={proj.supervisor?.name || "Unassigned"}>
                                            {proj.supervisor?.name || "Unassigned"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;