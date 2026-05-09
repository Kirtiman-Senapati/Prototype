import { useEffect, useState, useMemo,useCallback } from "react";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { updateProjectDeadlineAdmin, sendManualReminderAdmin } from "../../store/slices/adminSlice";
import { Calendar as CalendarIcon, Search, Clock, Filter, CheckCircle2, User, X, CalendarPlus, AlertCircle, Send, Bell } from "lucide-react";

const DeadlinesPage = () => {
    const dispatch = useDispatch();
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTriggering, setIsTriggering] = useState(false);
    
    // UI States
    const [searchTerm, setSearchTerm] = useState("");
    // filter
    const [filter, setFilter] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Modal Form States
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [modalSearchTerm, setModalSearchTerm] = useState("");
    const [deadlineDate, setDeadlineDate] = useState("");

    // Reminder Modal States
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [reminderMessage, setReminderMessage] = useState("");
    const [reminderStudentId, setReminderStudentId] = useState("");
    const [reminderProjectId, setReminderProjectId] = useState("");
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    // Auto-refresh when project data updates
    useAutoRefresh((updatedProject) => {
    setProjects((prevProjects) =>
        prevProjects.map((prevProject) =>
            prevProject._id === updatedProject.projectId
                ? {
                      ...prevProject,
                      status: updatedProject.status ?? prevProject.status,
                      deadline: updatedProject.deadline ?? prevProject.deadline,
                      supervisor: updatedProject.supervisor ?? prevProject.supervisor,
                  }
                : prevProject
        )
    );

    // fallback sync
    setTimeout(() => {
        fetchProjects();
    }, 300);

}, "projectUpdated");

    const fetchProjects = useCallback(() => {
        setIsLoading(true);
        axiosInstance.get("/admin/projects")
            .then(res => {
                setProjects(res.data.projects);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
}, []);

    const handleSaveDeadline = () => {
        if (!selectedProjectId || !deadlineDate) return;
        
        dispatch(updateProjectDeadlineAdmin({ id: selectedProjectId, deadline: deadlineDate }))
            .unwrap()
            .then((res) => {
                // Update local state instantly
                setProjects(prev => prev.map(p => p._id === selectedProjectId ? { ...p, deadline: res.project.deadline } : p));
                setIsModalOpen(false);
                setSelectedProjectId("");
                setDeadlineDate("");
                setModalSearchTerm("");
            });
    };

    const handleTriggerReminders = async () => {
        setIsTriggering(true);
        try {
            await axiosInstance.post("/admin/trigger-reminders");
            alert("Reminders and notifications triggered successfully!");
        } catch (error) {
            console.error("Error triggering reminders", error);
            alert("Failed to trigger reminders");
        } finally {
            setIsTriggering(false);
        }
    };

    const openReminderModal = (proj) => {
        setReminderProjectId(proj._id);
        setReminderStudentId(proj.student?._id);
        setReminderMessage("");
        setIsReminderModalOpen(true);
    };

    const handleSendReminder = async () => {
        if (!reminderProjectId || !reminderStudentId) return;
        setIsSendingReminder(true);
        try {
            await dispatch(sendManualReminderAdmin({
                projectId: reminderProjectId,
                studentId: reminderStudentId,
                message: reminderMessage
            })).unwrap();
            setIsReminderModalOpen(false);
            setReminderMessage("");
        } catch (error) {
            // Handled by toast
        } finally {
            setIsSendingReminder(false);
        }
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
        return projects.filter(p => p.status !== "Rejected" && p.student && typeof p.student === "object" && p.student._id);
    }, [projects]);

    const filteredProjects = validProjects.filter((p) =>
    {
        const matchesSearch =
            p.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.title?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === "All") return true;

        return p.status === filter;
    });

    // Options for Modal Dropdown
    const modalFilteredProjects = validProjects.filter(p => 
        p.title?.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
        p.student?.name?.toLowerCase().includes(modalSearchTerm.toLowerCase())
    );

    const isDatePassed = (dateString) => {
    if (!dateString) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(dateString);
    deadline.setHours(0, 0, 0, 0);

    return deadline < today;
};

const getDeadlineStyle = (project) => 
{
    // Completed project = green
    if (project.status === "Completed") 
    {
        return {
            dot: "bg-green-600",
            text: "text-slate-800",
        };
    }

    // Incomplete project = neutral gray
    if (project.status === "Incomplete") {
        return {
            dot: "bg-slate-500",
            text: "text-slate-600",
        };
    }
   // Expired deadline = red
    if (isDatePassed(project.deadline)) {
        return {
            dot: "bg-red-600",
            text: "text-red-600",
        };
    }
// Normal upcoming deadline
    return {
        dot: "bg-slate-400",
        text: "text-slate-700",
    };
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
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Deadlines</h1>
                    <p className="text-slate-500 mt-1">Track and manage submission deadlines.</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        Last updated just now
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleTriggerReminders}
                        disabled={isTriggering}
                        className={`w-full sm:w-auto px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 whitespace-nowrap ${isTriggering ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-[0_1px_0_rgba(0,0,0,0.02)]'}`}
                    >
                        {isTriggering ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Send size={16} />}
                        {isTriggering ? "Sending..." : "Force Reminders"}
                    </button>
                    <button 
                        onClick={() => {
                            setSelectedProjectId("");
                            setModalSearchTerm("");
                            setDeadlineDate("");
                            setIsModalOpen(true);
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
                    >
                        <CalendarPlus size={16} /> Create Deadline
                    </button>
                </div>
            </div>

            {/* Controls add filter  */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">

    <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

        <input
            type="text"
            placeholder="Search by project or student..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-1 focus:ring-slate-300 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
    </div>

    <div className="flex items-center w-full sm:w-auto gap-2">
            <Filter className="text-slate-400" size={18} />

            <select
                className="w-full sm:w-48 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 cursor-pointer text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            >
                <option value="All">All Projects</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Incomplete">Incomplete</option>
            </select>
        </div>
    </div>
            {/* Main Projects Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm uppercase tracking-wide">
                                <th className="px-6 py-4 font-medium">Student</th>
                                <th className="px-6 py-4 font-medium">Project Title</th>
                                <th className="px-6 py-4 font-medium">Supervisor</th>
                                <th className="px-6 py-4 font-medium">Deadline</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right w-[220px]">Actions</th>
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
                                    const deadlineStyle = getDeadlineStyle(proj);
                                    return (
                                        <tr key={proj._id} className="transition hover:bg-slate-50/80 hover:shadow-[inset_0_1px_0_rgba(0,0,0,0.02)] border-b border-slate-100">

                                            {/* Student detail coloum */}
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 font-semibold tracking-tight">{proj.student?.name || "Unknown"}</span>
                                                    <span className="text-xs text-slate-500">{proj.student?.email}</span>
                                                </div>
                                            </td>
                                            
                                            {/* Project title coloum */}
                                            <td className="px-6 py-5 align-middle">
                                               <div className="flex flex-col">
                                                    <p className="text-sm font-medium text-slate-700 line-clamp-2 max-w-[250px] transition-colors">
                                                        {proj.title}
                                                    </p>

                                                    {proj.groupName && (
                                                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block border border-slate-200 w-fit">
                                                            {proj.groupName}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Supervisor coloum */}
                                            <td className="px-6 py-5 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 shrink-0">
                                                        {proj.supervisor?.name?.charAt(0) || <User size={12}/>}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{proj.supervisor?.name || <span className="text-slate-400 italic">Unassigned</span>}</span>
                                                </div>
                                            </td>
                                            
                                            {/* Deadline coloum */}
                                            <td className="px-6 py-5 align-middle">
                                                {proj.deadline ? (
                                                    <div
                                                        className={`flex items-center gap-2 text-sm font-medium ${deadlineStyle.text}`}>
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${deadlineStyle.dot}`} />

                                                        {new Date(proj.deadline).toLocaleDateString(undefined, {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400 italic">
                                                        Not set
                                                    </span>
                                                )}
                                            </td>
                                            
                                            {/* Status coloum */}
                                            <td className="px-6 py-5 align-middle">
                                                <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                                                    <span className={`w-2 h-2 rounded-full shadow-sm ${
                                                        proj.status === 'Completed' ? 'bg-green-600' :
                                                        proj.status === 'Approved' ? 'bg-slate-700' :
                                                        proj.status === 'Rejected' ? 'bg-red-500' :
                                                        'bg-orange-500'
                                                    }`}></span>
                                                    {proj.status}
                                                </div>
                                            </td>

                                            {/*here control button and Action sections*/}

                                            <td className="px-6 py-5 align-middle text-right">
                                                <div className="flex items-center justify-end gap-2 w-[210px] ml-auto">

                                                    {/* Reminder */}
                                                    <button 
                                                        onClick={() => openReminderModal(proj)}
                                                        className="w-[100px] h-[34px] bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 text-slate-700"
                                                    >
                                                        <Bell size={14} className="text-slate-500" />
                                                        Remind
                                                    </button>

                                                    {/* Deadline */}
                                                    <button 
                                                        onClick={() => openModalForProject(proj)}
                                                        disabled={proj.status === "Completed"}
                                                        className={`w-[100px] h-[34px] text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                                                            proj.status === "Completed"
                                                                ? "text-slate-400 cursor-not-allowed bg-slate-50 border border-slate-200"
                                                                : "text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        {proj.deadline ? "Update" : "Set"}
                                                    </button>

                                                </div>
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
                    <div className="bg-white rounded-xl w-full max-w-xl shadow-lg border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
                        
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                Create or Update Deadline
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="px-6 py-5 space-y-5">
                            
                            {/* Project Search / Select */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Project</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none"
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
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Submission Deadline Date</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-2.5 rounded-md border border-slate-200 bg-white text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none cursor-pointer"
                                        value={deadlineDate}
                                        onChange={(e) => setDeadlineDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]} // prevent past dates normally
                                    />
                                </div>
                            </div>

                        </div>
                        
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-auto">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md px-4 py-2 text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveDeadline}
                                disabled={!selectedProjectId || !deadlineDate}
                                className={`bg-slate-900 hover:bg-slate-800 text-white rounded-md px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${(!selectedProjectId || !deadlineDate) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <CalendarIcon size={16} /> Save Deadline
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Reminder Modal */}
            {isReminderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-lg border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Send Reminder</h2>
                            <button 
                                onClick={() => setIsReminderModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Send a manual deadline reminder to this student. The system will automatically notify them via email and in-app notification.
                        </p>
                        <textarea
                            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 resize-y min-h-[100px] mb-6"
                            placeholder="Optional custom message..."
                            value={reminderMessage}
                            onChange={(e) => setReminderMessage(e.target.value)}
                        />
                        <div className="flex items-center justify-end gap-3">
                            <button 
                                onClick={() => setIsReminderModalOpen(false)}
                                disabled={isSendingReminder}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSendReminder}
                                disabled={isSendingReminder}
                                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isSendingReminder ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Bell size={16} />}
                                {isSendingReminder ? "Sending..." : "Send Reminder"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeadlinesPage;

