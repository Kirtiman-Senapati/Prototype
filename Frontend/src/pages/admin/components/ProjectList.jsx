import React from 'react';
import { FolderKanban, CheckCircle2, Clock, XCircle } from 'lucide-react';

const ProjectList = ({ projects }) => {
    if (!projects || projects.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-slate-500 h-64">
                <FolderKanban size={48} className="text-slate-300 mb-4" />
                <p>No recent projects found</p>
            </div>
        );
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Rejected':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'Completed':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved':
                return <CheckCircle2 size={14} className="mr-1" />;
            case 'Pending':
                return <Clock size={14} className="mr-1" />;
            case 'Rejected':
                return <XCircle size={14} className="mr-1" />;
            case 'Completed':
                return <CheckCircle2 size={14} className="mr-1" />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800">Recent Projects</h2>
                <a href="/dashboard/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">View All</a>
            </div>
            <div className="divide-y divide-slate-100">
                {projects.map((project) => (
                    <div key={project._id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-slate-800 truncate pr-4">{project.title}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(project.status)}`}>
                                {getStatusIcon(project.status)}
                                {project.status}
                            </span>
                        </div>
                        <div className="flex gap-4 text-sm text-slate-500 mt-2">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 capitalize">Student</span>
                                <span className="font-medium text-slate-600">{project.student?.name || 'Unknown'}</span>
                            </div>
                            <div className="w-px bg-slate-200"></div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 capitalize">Supervisor</span>
                                <span className="font-medium text-slate-600">{project.supervisor?.name || 'Pending'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectList;
