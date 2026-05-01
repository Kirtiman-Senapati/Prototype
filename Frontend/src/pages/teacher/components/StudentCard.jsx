import { Plus, MessageSquare } from "lucide-react";
import StatusBadge from "./StatusBadge";
import FileItem from "./FileItem";

const StudentCard = ({ student, onAddTask, onAddFeedback }) => {
    return (
        <div className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex flex-col h-full overflow-hidden">
            <div className="p-6 flex flex-col h-full">
                {/* Header Section */}
                <div className="mb-5 border-b border-slate-100 pb-4">
                    <h2 className="font-bold text-lg text-slate-800 leading-tight">{student.name}</h2>
                    <p className="text-[13px] font-medium text-slate-500 mt-1">{student.email}</p>
                </div>

                {/* Project Section */}
                <div className="mb-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Project</p>
                    {student.project ? (
                        <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-100">
                            <h3 className="font-semibold text-[14px] text-slate-800 mb-1.5 leading-snug">{student.project.title}</h3>
                            <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed mb-3">{student.project.description}</p>
                            <StatusBadge status={student.project.status} />
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100 text-center border-dashed">
                            <p className="text-[13px] italic text-slate-400">No project submitted yet.</p>
                        </div>
                    )}
                </div>

                {/* Files Section */}
                {student.project && (
                    <div className="mb-6 flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Uploaded Files</p>
                        {student.project.files && student.project.files.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                                {student.project.files.map((file, i) => (
                                    <FileItem key={i} file={file} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-[12px] text-slate-400 italic bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-center border-dashed">
                                No files uploaded.
                            </div>
                        )}
                    </div>
                )}

                {/* Tasks Section */}
                {student.project && student.project.tasks && student.project.tasks.length > 0 && (
                    <div className="mb-6 flex-1">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Tasks</p>
                            {(() => {
                                const tasks = student.project.tasks;
                                const completed = tasks.filter(t => t.status === "Completed").length;
                                const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                                return (
                                    <span className="text-[10px] font-extrabold text-blue-600">{progress}% Done</span>
                                );
                            })()}
                        </div>
                        
                        {/* Progress Bar */}
                        {(() => {
                            const tasks = student.project.tasks;
                            const completed = tasks.filter(t => t.status === "Completed").length;
                            const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                            return (
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200 mb-3">
                                    <div 
                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            );
                        })()}
                        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                            {[...student.project.tasks].sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((task, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm flex flex-col gap-1.5">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`font-semibold ${task.status === 'Completed' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{task.title}</p>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border shrink-0 ${
                                            task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                            task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                                        <span>BY {task.assignedByRole === "admin" ? "ADMIN" : "SUPERVISOR"}</span>
                                        {task.status === 'Completed' && task.completedAt ? (
                                            <span className="text-green-600 flex items-center gap-1">✔ Completed on {new Date(task.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                        ) : task.deadline ? (
                                            <span>Due {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                        ) : <span>No Deadline</span>}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Section */}
                {student.project && (
                    <div className="mt-auto pt-2 flex gap-3">
                        <button 
                            onClick={onAddFeedback}
                            className="flex-1 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                            <MessageSquare size={16} />
                            Feedback
                        </button>
                        <button 
                            onClick={onAddTask}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            Task
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentCard;
