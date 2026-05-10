import { useEffect, useState } from "react";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import { useDispatch, useSelector } from "react-redux";
import { getAdminDashboard, adminAddStudent, adminAddSupervisor } from "../../store/slices/adminSlice";
import { getActivities, addRealtimeActivity } from "../../store/slices/activitySlice";
import { Users, GraduationCap, FolderKanban, ShieldCheck, Clock, CheckSquare, UserPlus, X } from "lucide-react";
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
                <StatCard 
                    title="Pending Proposals" 
                    value={stats?.pendingProposals || 0} 
                    icon={Clock}
                />
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
                    {pendingProjects?.length > 0 && (
                        <div className="h-[420px]">
                            <ProjectList projects={pendingProjects} title="Pending Proposals" viewAllLink="/dashboard/assign-supervisor" />
                        </div>
                    )}
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
        </div>
    );
};

export default AdminDashboard;


