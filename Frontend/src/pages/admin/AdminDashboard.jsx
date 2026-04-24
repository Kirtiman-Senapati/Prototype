import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminDashboard } from "../../store/slices/adminSlice";
import { getActivities, addRealtimeActivity } from "../../store/slices/activitySlice";
import { Users, GraduationCap, FolderKanban, ShieldCheck, Clock, CheckSquare } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

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

    useEffect(() => {
        if (!authUser?._id) return;
        
        const socket = io("http://localhost:4000", {
            query: { userId: authUser._id }
        });

        socket.on("adminDashboardUpdate", () => {
            toast.info("A dashboard update occurred!", { autoClose: 4000 });
            dispatch(getAdminDashboard());
        });

        socket.on("systemActivity", (activity) => {
            dispatch(addRealtimeActivity(activity));
        });

        return () => {
            socket.disconnect();
        };
    }, [authUser, dispatch]);

    if (isLoading && !stats) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-md">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, Admin</h1>
                        <p className="text-blue-100 mt-1">Here's your system overview for today.</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Students" 
                    value={stats?.totalStudents || 0} 
                    icon={Users}
                    colorClass="text-blue-600"
                    bgColorClass="bg-blue-50"
                />
                <StatCard 
                    title="Total Teachers" 
                    value={stats?.totalTeachers || 0} 
                    icon={GraduationCap}
                    colorClass="text-green-600"
                    bgColorClass="bg-green-50"
                />
                <StatCard 
                    title="Total Projects" 
                    value={stats?.totalProjects || 0} 
                    icon={FolderKanban}
                    colorClass="text-purple-600"
                    bgColorClass="bg-purple-50"
                />
                <StatCard 
                    title="Pending Proposals" 
                    value={stats?.pendingProposals || 0} 
                    icon={Clock}
                    colorClass="text-amber-600"
                    bgColorClass="bg-amber-50"
                />
            </div>

            {/* Quick Actions Section */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 px-1">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <ActionCard 
                        title="Review Proposals" 
                        description="Approve and assign supervisors"
                        icon={CheckSquare}
                        to="/dashboard/assign-supervisor"
                        colorClass="text-amber-600"
                        bgColorClass="bg-amber-50"
                    />
                    <ActionCard 
                        title="Manage Students" 
                        description="View, edit, or remove students"
                        icon={Users}
                        to="/dashboard/manage-students"
                        colorClass="text-blue-600"
                        bgColorClass="bg-blue-50"
                    />
                    <ActionCard 
                        title="Manage Supervisors" 
                        description="Assign or remove teacher roles"
                        icon={GraduationCap}
                        to="/dashboard/manage-teachers"
                        colorClass="text-green-600"
                        bgColorClass="bg-green-50"
                    />
                    <ActionCard 
                        title="Manage Projects" 
                        description="Review active and completed projects"
                        icon={FolderKanban}
                        to="/dashboard/projects"
                        colorClass="text-purple-600"
                        bgColorClass="bg-purple-50"
                    />
                </div>
            </div>

            {/* Activity & Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ActivityList activities={activities || []} />
                <ProjectList projects={recentProjects} title="Recent Projects" viewAllLink="/dashboard/projects" />
                <ProjectList projects={pendingProjects} title="Pending Proposals" viewAllLink="/dashboard/assign-supervisor" />
            </div>
        </div>
    );
};

export default AdminDashboard;


