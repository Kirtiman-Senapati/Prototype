import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminDashboard } from "../../store/slices/adminSlice";
import { getActivities, addRealtimeActivity } from "../../store/slices/activitySlice";
import { Users, GraduationCap, FolderKanban, ShieldCheck, Clock, CheckSquare } from "lucide-react";
import { toast } from "react-toastify";
import useAutoRefresh from "../../hooks/useAutoRefresh";

import StatCard from "./components/StatCard";
import ActionCard from "./components/ActionCard";
import ActivityList from "./components/ActivityList";
import ProjectList from "./components/ProjectList";

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const { stats, recentProjects, pendingProjects, isLoading } = useSelector((state) => state.admin);
    const { activities } = useSelector((state) => state.activity);
    const { authUser } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getAdminDashboard());
        dispatch(getActivities());
    }, [dispatch]);

    useAutoRefresh(() => {
        toast.info("A dashboard update occurred!", { autoClose: 4000 });
        dispatch(getAdminDashboard());
    }, "adminDashboardUpdate");

    useAutoRefresh(() => {
        dispatch(getAdminDashboard());
    });

    useAutoRefresh((activity) => {
        dispatch(addRealtimeActivity(activity));
    }, "systemActivity");

    if (isLoading && !stats) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 bg-[#F9FAFB] min-h-screen">
            {/* Header Section */}
            <div className="pt-2 pb-4">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, Admin</h1>
                <p className="text-slate-500 mt-2 font-medium">Here is what is happening across the academic portal today.</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <ActivityList activities={activities || []} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <ProjectList projects={recentProjects} title="Recent Projects" viewAllLink="/dashboard/projects" />
                    {pendingProjects?.length > 0 && (
                        <ProjectList projects={pendingProjects} title="Pending Proposals" viewAllLink="/dashboard/assign-supervisor" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;


