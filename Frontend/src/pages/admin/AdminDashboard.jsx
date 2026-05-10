import { useEffect, useState } from "react";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { useDispatch, useSelector } from "react-redux";
import { getAdminDashboard, adminAddStudent, adminAddSupervisor, updateProjectStatusAdmin } from "../../store/slices/adminSlice";
import { getActivities, addRealtimeActivity } from "../../store/slices/activitySlice";
import { Users, GraduationCap, FolderKanban, ShieldCheck, Clock, CheckSquare, UserPlus, X, ArrowRight, XCircle, FileText, MonitorPlay, Archive, File, MessageSquare, User, Plus, Calendar, Briefcase, CheckCircle } from "lucide-react";
import { toast } from "../../utils/toast";
import { playNotificationSound } from "../../utils/sound";

import { Link } from "react-router-dom";

import StatCard from "./components/StatCard";
import ActionCard from "./components/ActionCard";
import AdminActivityList from "./components/AdminActivityList";
import ProjectList from "./components/ProjectList";
import AddSupervisorModal from "../../components/modal/AddSupervisorModal";

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const { stats, recentProjects, pendingProjects, isLoading } = useSelector((state) => state.admin);
    const { activities } = useSelector((state) => state.activity);
    const { authUser } = useSelector((state) => state.auth);

    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedProjectForView, setSelectedProjectForView] = useState(null);
    const [studentFormData, setStudentFormData] = useState({ name: "", email: "", password: "", department: "" });
    const [supervisorFormData, setSupervisorFormData] = useState({ name: "", email: "", password: "", department: "", experties: "" });
    const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
    const [isSubmittingSupervisor, setIsSubmittingSupervisor] = useState(false);

    const departments = [
        "Computer Science & Engineering",
        "Information Technology",
        "Civil Engineering",
        "Electrical Engineering",
        "Mechanical Engineering"
    ];

    const handleStudentChange = (e) => setStudentFormData({ ...studentFormData, [e.target.name]: e.target.value });
    const handleSupervisorChange = (e) => setSupervisorFormData({ ...supervisorFormData, [e.target.name]: e.target.value });

    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingStudent(true);
        const resultAction = await dispatch(adminAddStudent(studentFormData));
        setIsSubmittingStudent(false);
        if (adminAddStudent.fulfilled.match(resultAction)) {
            playNotificationSound();
            setIsStudentModalOpen(false);
            setStudentFormData({ name: "", email: "", password: "", department: "" });
            dispatch(getAdminDashboard());
        }
    };

    const handleSupervisorSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingSupervisor(true);
        const resultAction = await dispatch(adminAddSupervisor(supervisorFormData));
        setIsSubmittingSupervisor(false);
        if (adminAddSupervisor.fulfilled.match(resultAction)) {
            setIsSupervisorModalOpen(false);
            setSupervisorFormData({ name: "", email: "", password: "", department: "", experties: "" });
            dispatch(getAdminDashboard());
        }
    };

    useEffect(() => {
        dispatch(getAdminDashboard());
        dispatch(getActivities());
    }, [dispatch]);

    const handleApproveDirect = (projectId) => {
        if (!projectId) return;
        dispatch(updateProjectStatusAdmin({ id: projectId, status: "Approved" }))
            .unwrap()
            .then(() => {
                toast.success("Proposal approved successfully");
                dispatch(getAdminDashboard());
                const remaining = (pendingProjects || []).filter(p => p._id !== projectId);
                if (remaining.length > 0) {
                    setSelectedProjectId(remaining[0]._id);
                } else {
                    setIsPendingModalOpen(false);
                    setSelectedProjectId("");
                }
                if (selectedProjectForView && selectedProjectForView._id === projectId) {
                    setSelectedProjectForView(null);
                }
            })
            .catch(() => toast.error("Failed to approve proposal"));
    };

    const handleStatusUpdateFromView = (projectId, status) => {
        dispatch(updateProjectStatusAdmin({ id: projectId, status }))
            .unwrap()
            .then(() => {
                toast.success(`Proposal ${status.toLowerCase()} successfully`);
                setSelectedProjectForView(null);
                dispatch(getAdminDashboard());
                
                const remaining = (pendingProjects || []).filter(p => p._id !== projectId);
                if (remaining.length > 0) {
                    setSelectedProjectId(remaining[0]._id);
                } else {
                    setIsPendingModalOpen(false);
                    setSelectedProjectId("");
                }
            })
            .catch(() => toast.error(`Failed to ${status.toLowerCase()} proposal`));
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
            toast.update(toastId, { render: "File downloaded successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to download file");
        }
    };

    const getFileIcon = (type, className = "") => {
        if (type === "Report") return <FileText className={`text-slate-800 ${className}`} />;
        if (type === "Presentation") return <MonitorPlay className={`text-slate-800 ${className}`} />;
        if (type === "Code") return <Archive className={`text-slate-800 ${className}`} />;
        return <File className={`text-slate-800 ${className}`} />;
    };

    const handleClosePendingModal = () => {
        setIsPendingModalOpen(false);
        setSelectedProjectId("");
    };

    useEffect(() => {
        if (isPendingModalOpen && pendingProjects?.length > 0 && !selectedProjectId) {
            setSelectedProjectId(pendingProjects[0]._id);
        }
    }, [isPendingModalOpen, pendingProjects, selectedProjectId]);

    useAutoRefresh(() => {
    dispatch(getAdminDashboard());
}, "adminDashboardUpdate");

    useAutoRefresh((activity) => {
        dispatch(addRealtimeActivity(activity));
    }, "newActivity");

    if (isLoading && !stats) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-10 bg-[#F9FAFB] min-h-screen">
            {/* Header Section */}
            <div className="pt-2 pb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, Admin</h1>
                    <p className="text-slate-500 mt-2 font-medium">Here is what is happening across the academic portal today.</p>
                </div>
                <div className="flex items-center gap-2 sm:mt-1">
                    <button onClick={() => setIsStudentModalOpen(true)} className="flex items-center gap-1.5 px-4 h-9 text-[13px] font-medium rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all duration-150">
                        <UserPlus size={14} />
                        Add Student
                    </button>
                    <button onClick={() => setIsSupervisorModalOpen(true)} className="flex items-center justify-center px-4 h-9 text-[13px] font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all duration-150 shadow-sm">
                        Add Supervisor
                    </button>
                </div>
            </div>

            {/* Stats Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Students" 
                    value={stats?.totalStudents || 0} 
                    icon={Users}
                />
                <StatCard 
                    title="Total Teachers" 
                    value={stats?.totalTeachers || 0} 
                    icon={GraduationCap}
                />
                <StatCard 
                    title="Total Projects" 
                    value={stats?.totalProjects || 0} 
                    icon={FolderKanban}
                />
                <div
                    onClick={() => setIsPendingModalOpen(true)}
                    className="cursor-pointer hover:border-slate-300 transition-colors relative group block outline-none"
                >
                    <StatCard 
                        title="Pending Proposals" 
                        value={stats?.pendingProposals || 0} 
                        icon={Clock}
                    />
                    <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                            View List &rarr;
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Actions Section */}
            <div>
                <h2 className="text-sm font-bold text-slate-800 mb-4 tracking-wide">Quick Management</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <ActionCard 
                        title="Review Proposals" 
                        icon={CheckSquare}
                        to="/dashboard/assign-supervisor"
                    />
                    <ActionCard 
                        title="Manage Students" 
                        icon={Users}
                        to="/dashboard/manage-students"
                    />
                    <ActionCard 
                        title="Manage Supervisors" 
                        icon={GraduationCap}
                        to="/dashboard/manage-teachers"
                    />
                    <ActionCard 
                        title="Manage Projects" 
                        icon={FolderKanban}
                        to="/dashboard/projects"
                    />
                </div>
            </div>

            {/* Middle Section (2-column grid 60/40) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="h-[420px]">
                        <AdminActivityList activities={activities || []} />
                    </div>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="h-[420px]">
                        <ProjectList projects={recentProjects} title="Recent Projects" viewAllLink="/dashboard/projects" />
                    </div>
                </div>
            </div>

            {/* ADD STUDENT MODAL */}
            {isStudentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">Add New Student</h2>
                            <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleStudentSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" name="name" value={studentFormData.name} onChange={handleStudentChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="e.g. Ali Reza" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                                <input type="email" name="email" value={studentFormData.email} onChange={handleStudentChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="student@university.edu" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                                    <span>Temporary Password <span className="text-red-500">*</span></span>
                                </label>
                                <input type="password" name="password" value={studentFormData.password} onChange={handleStudentChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department (Optional)</label>
                                <select name="department" value={studentFormData.department} onChange={handleStudentChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none bg-white">
                                    <option value="">Select a department...</option>
                                    {departments.map((dep, index) => (
                                        <option key={index} value={dep}>{dep}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
                                <button type="submit" disabled={isSubmittingStudent} className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 transition flex justify-center items-center">
                                    {isSubmittingStudent ? <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span> : "Add Student"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/*  ADD SUPERVISOR MODAL */}
            <AddSupervisorModal
                isOpen={isSupervisorModalOpen}
                onClose={() => setIsSupervisorModalOpen(false)}
                onSubmit={handleSupervisorSubmit}
                formData={supervisorFormData}
                handleChange={handleSupervisorChange}
                isSubmitting={isSubmittingSupervisor}
                editId={null}
            />

            {/* Pending Proposals Modal */}
            {isPendingModalOpen && (
                <div className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 ${selectedProjectForView ? "hidden" : ""}`}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-slate-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="text-slate-500" size={20} /> Pending Proposals
                            </h2>
                            <button onClick={handleClosePendingModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-1">
                            {!pendingProjects || pendingProjects.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Clock size={32} strokeWidth={1.5} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-[13px] font-medium">No pending proposals found</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Project Name</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Supervisor</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Progress</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pendingProjects.map((project) => (
                                            <tr 
                                                key={project._id} 
                                                onClick={() => setSelectedProjectId(project._id)}
                                                className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${
                                                    selectedProjectId === project._id ? "bg-slate-50/70 border-l-2 border-slate-400" : ""
                                                }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <h3 className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-slate-700 transition-colors line-clamp-1">{project.title}</h3>
                                                    <p className="text-xs text-slate-500 mt-1">Student: {project.student?.name || 'Unknown'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-800 tracking-tight">{project.supervisor?.name || 'Pending'}</span>
                                                </td>
                                                <td className="px-6 py-4">
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
                                                        
                                                        <span className="text-xs font-medium text-slate-500">
                                                            {project.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
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
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProjectForView(project);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition shadow-sm"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <button
                                onClick={() => setSelectedProjectForView(pendingProjects.find(p => p._id === selectedProjectId))}
                                disabled={!selectedProjectId}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-md transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                View Details
                            </button>
                            <button
                                onClick={handleClosePendingModal}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-md transition shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Project Documentation Details Modal */}
            {selectedProjectForView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white overflow-hidden rounded-xl w-full max-w-5xl border border-slate-200 flex flex-col max-h-[85vh] shadow-xl">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <FolderKanban size={20} />
                                </div>
                                Project Details
                            </h2>
                            <button 
                                onClick={() => setSelectedProjectForView(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Modal Body (Scrollable) */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                            
                            {/* BASIC INFO */}
                            <div className="relative">
                                <div className="absolute top-0 right-0">
                                    <div className="px-3 py-1 text-xs font-medium bg-slate-900 text-white rounded-full shadow-sm">
                                        {selectedProjectForView.status}
                                    </div>
                                </div>
                                <h4 className="text-2xl font-bold text-slate-900 tracking-tight pr-24">{selectedProjectForView.title}</h4>
                                <div className="mt-2 flex items-center gap-3 text-sm mb-6">
                                    <span className="text-slate-500">Project</span>
                                    <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                    <span className="text-slate-600 font-medium">
                                        {selectedProjectForView.student?.name || "Deleted User"}
                                    </span>
                                </div>
                                
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-6">Description</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6">{selectedProjectForView.description || "No description provided."}</p>

                                <div className="flex items-center gap-2 text-sm text-slate-700 inline-flex py-1">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="font-semibold text-slate-500">Deadline:</span>
                                    <span className="font-bold">{selectedProjectForView.deadline ? new Date(selectedProjectForView.deadline).toLocaleDateString("en-GB") : 'Not Set'}</span>
                                </div>
                            </div>

                            {/* IDENTITIES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Team */}
                                <div>
                                    <div className="flex items-center justify-between mb-3 pl-1">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Team Information</h3>
                                        {selectedProjectForView.groupName && (
                                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{selectedProjectForView.groupName}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3 pt-1">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 bg-slate-100 text-slate-600">
                                                {selectedProjectForView.student?.name?.charAt(0) || "D"}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-md font-bold text-slate-800 flex items-center gap-2 truncate">
                                                    {selectedProjectForView.student?.name || <span className="text-red-500 italic">Deleted User</span>}
                                                </span>
                                                <span className="text-xs font-medium text-slate-500 truncate">{selectedProjectForView.student?.email || "No email available"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Supervisor */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Supervisor Assignment</h3>
                                    <div className="flex items-center gap-4 pt-1 h-[56px]">
                                        {selectedProjectForView.supervisor ? (
                                            <>
                                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl shrink-0">
                                                    {selectedProjectForView.supervisor.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-lg font-bold text-slate-800 truncate">{selectedProjectForView.supervisor.name}</span>
                                                    <span className="text-sm font-medium text-slate-500 truncate">{selectedProjectForView.supervisor.email}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200 border-dashed shrink-0">
                                                    <Briefcase size={20} />
                                                </div>
                                                <span className="text-slate-500 italic font-medium">Not Assigned Yet</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* TASK TRACKING & PROGRESS */}
                            <div className="pt-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                                    <CheckCircle size={14} className="text-slate-500" /> Task Progress
                                </h3>
                                <div className="mt-2">
                                    {(() => {
                                        const itemMap = new Map();
                                        (selectedProjectForView.tasks || []).forEach(t => itemMap.set(t._id.toString(), { ...t, type: 'task' }));
                                        (selectedProjectForView.workspaceItems || []).forEach(wi => itemMap.set(wi._id.toString(), wi));
                                        const tasks = Array.from(itemMap.values()).filter(i => i.type === 'task');
                                        const totalTasks = tasks.length;
                                        const completedTasks = tasks.filter(t => t.status === "Completed").length;
                                        const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                                        return (
                                            <div className="flex flex-col gap-4 bg-slate-50 p-5 rounded-xl">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">Completion Status</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{completedTasks} of {totalTasks} tasks completed</p>
                                                    </div>
                                                    <span className="text-3xl font-semibold text-slate-900">{taskProgress}%</span>
                                                </div>

                                                {/* Progress Bar (SaaS Feel) */}
                                                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className="bg-slate-900 h-3 rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: `${taskProgress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* FILES SECTION */}
                            <div className="pt-2">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                                    <Archive size={14} className="text-slate-500" /> Uploaded Files
                                </h3>
                                
                                {!selectedProjectForView.files || selectedProjectForView.files.length === 0 ? (
                                    <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 shadow-sm">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                            <File size={20} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 mb-1">No files uploaded yet</p>
                                        <p className="text-xs font-medium text-slate-400">Student has not attached any project files.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                                                    {selectedProjectForView.files.map((file, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    {getFileIcon(file.type, "shrink-0 w-8 h-8 p-1.5 bg-white border border-slate-100 rounded-md shadow-sm")}
                                                                    <span className="text-sm font-bold text-slate-800 truncate max-w-[200px] md:max-w-xs">{file.filename}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">{file.type}</span>
                                                            </td>
                                                            <td className="py-4 px-6 text-xs font-medium text-slate-500">
                                                                {new Date(file.uploadedAt).toLocaleDateString("en-GB")}
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <button 
                                                                    onClick={() => handleDownload(file.url, file.filename)}
                                                                    className="text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold py-2 px-4 rounded-md transition-colors"
                                                                >
                                                                    Download
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
                        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl w-full">
                            {selectedProjectForView.status === "Pending" ? (
                                <>
                                    <button 
                                        onClick={() => handleStatusUpdateFromView(selectedProjectForView._id, "Rejected")}
                                        className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-transparent transition"
                                    >
                                        Reject Proposal
                                    </button>
                                    <button 
                                        onClick={() => handleStatusUpdateFromView(selectedProjectForView._id, "Approved")}
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition shadow-sm"
                                    >
                                        Approve Proposal
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setSelectedProjectForView(null)}
                                    className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-transparent transition"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;


