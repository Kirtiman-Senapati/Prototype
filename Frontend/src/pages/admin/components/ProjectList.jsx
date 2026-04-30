import React from 'react';
import { FolderKanban, CheckCircle2, Clock, XCircle } from 'lucide-react';

const ProjectList = ({ projects, title = "Recent Projects", viewAllLink = "/dashboard/projects", emptyMessage }) => {
    const displayEmptyMessage = emptyMessage || `No ${title.toLowerCase()} found`;

    if (!projects || projects.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[420px]">
                <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                    <a href={viewAllLink} className="text-xs font-medium text-blue-600 hover:text-blue-700">View All</a>
                </div>
                <div className="p-10 flex flex-col items-center justify-center text-slate-500 flex-1">
                    <div className="mb-3 text-slate-300">
                        <FolderKanban size={32} strokeWidth={1.5} />
                    </div>
                    <p className="text-[13px] font-medium">{displayEmptyMessage}</p>
                </div>
            </div>
        );
    }

    const getStatusStyle = (status) => {
        if (status === 'Completed') return 'text-slate-700';
        if (status === 'Pending') return 'text-slate-500';
        if (status === 'Rejected' || status === 'At Risk') return 'text-slate-600';
        return 'text-slate-600';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[420px]">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                <a href={viewAllLink} className="text-xs font-medium text-blue-600 hover:text-blue-700">View All</a>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Project Name</th>
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Supervisor</th>
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {projects.map((project) => (
                            <tr key={project._id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                <td className="px-5 py-4">
                                    <h3 className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">{project.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Student: {project.student?.name || 'Unknown'}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-sm font-medium text-slate-800 tracking-tight">{project.supervisor?.name || 'Pending'}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            project.status === 'Completed'
                                                ? 'bg-emerald-500/80'
                                                : project.status === 'In Progress' || project.status === 'Approved'
                                                ? 'bg-indigo-500/80'
                                                : project.status === 'Pending'
                                                ? 'bg-amber-500/80'
                                                : 'bg-slate-400'
                                        }`} />
                                        
                                        <span className={`text-xs font-medium ${getStatusStyle(project.status)}`}>
                                            {project.status === 'Approved' ? 'In Progress' : project.status}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectList;
