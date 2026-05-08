import React from 'react';
import { FolderKanban, CheckCircle2, Clock, XCircle } from 'lucide-react';

const ProjectList = ({ projects, title = "Recent Projects", viewAllLink = "/dashboard/projects", emptyMessage }) => {
    const displayEmptyMessage = emptyMessage || `No ${title.toLowerCase()} found`;

    if (!projects || projects.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-full">
                <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                    <a href={viewAllLink} className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">View All</a>
                </div>
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
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
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden h-full">
            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                <a href={viewAllLink} className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">View All</a>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Project Name</th>
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Supervisor</th>
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                            <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Progress</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {projects.map((project) => (
                            <tr key={project._id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                <td className="px-5 py-4">
                                    <h3 className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-slate-700 transition-colors line-clamp-1">{project.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Student: {project.student?.name || 'Unknown'}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-sm font-medium text-slate-800 tracking-tight">{project.supervisor?.name || 'Pending'}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            project.status === 'Completed'
                                                ? 'bg-slate-600'
                                                : project.status === 'In Progress' || project.status === 'Approved'
                                                ? 'bg-indigo-500/80'
                                                : project.status === 'Pending'
                                                ? 'bg-orange-500/80'
                                                : project.status === 'Incomplete'
                                                ? 'bg-slate-500/80'
                                                : 'bg-slate-400'
                                        }`} />
                                        
                                        <span className={`text-xs font-medium ${getStatusStyle(project.status)}`}>
                                            {project.status === 'Approved' ? 'In Progress' : project.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex flex-col gap-1.5 w-24">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                            <span>{project.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                                            <div 
                                                className="bg-slate-600 h-1.5 rounded-full transition-all duration-500 ease-out" 
                                                style={{ width: `${Math.min(project.progress || 0, 100)}%` }}
                                            ></div>
                                        </div>
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
