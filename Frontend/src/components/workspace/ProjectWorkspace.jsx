import React from 'react';
import { CheckSquare, FolderKanban } from 'lucide-react';
import MilestoneTimeline from '../milestones/MilestoneTimeline';

// Compact Tasks List Component
const TasksList = ({ tasks, completingTasks, onMarkDone }) => {
    if (!tasks || tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-b border-slate-100">
                <CheckSquare size={28} />
                <p className="mt-2 text-sm font-medium">No tasks yet</p>
            </div>
        );
    }

    return (
        <div className="border-b border-slate-100">
            <div className="px-6 py-4 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <CheckSquare size={16} className="text-slate-500" /> Assigned Tasks
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{tasks.length} Total</span>
            </div>
            <div className="overflow-y-auto overflow-x-auto max-h-[260px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Task Name</th>
                            <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Deadline</th>
                            <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[...tasks].sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((task) => (
                            <tr key={task._id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <h3 className={`text-[13px] font-semibold leading-snug line-clamp-1 transition-colors ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-slate-600'}`}>{task.title}</h3>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[12px] text-slate-500 font-medium">
                                        {task.deadline ? new Date(task.deadline).toLocaleDateString("en-GB") : 'No Deadline'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onMarkDone(task)}
                                        disabled={task.status === 'Completed' || completingTasks[task._id]}
                                        className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${task.status === 'Completed' ? 'text-slate-400 bg-transparent' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'}`}
                                    >
                                        {task.status === 'Completed' ? "Done" : completingTasks[task._id] ? "..." : "Mark Done"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Unified Project Workspace Component
const ProjectWorkspace = ({ project, completingTasks, onMarkTaskDone, onMilestoneSubmitClick }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-auto lg:h-[420px] overflow-hidden shadow-sm">
            {/* Unified Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 bg-white">
                <h2 className="text-lg font-bold text-slate-900">Project Workspace</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Track your tasks, submissions and project phases in one place.</p>
            </div>

            {/* Task Section - Compact Personality */}
            <TasksList 
                tasks={project.tasks} 
                completingTasks={completingTasks} 
                onMarkDone={onMarkTaskDone} 
            />

            {/* Milestone Section - Rich Personality */}
            <div className="flex flex-col flex-1 min-h-0">
                <div className="px-6 py-4 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
                    <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <FolderKanban size={16} className="text-slate-500" /> Project Phases
                    </h3>
                </div>
                <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 max-h-[180px]">
                    <MilestoneTimeline 
                        milestones={project.milestones || []} 
                        role="student" 
                        onSubmitClick={onMilestoneSubmitClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectWorkspace;
