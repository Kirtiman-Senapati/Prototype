import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTeacherDashboard } from "../../store/slices/teacherSlice";
import { Loader, Users, FileSignature, ArrowRight, ClipboardList } from "lucide-react";
import DashboardHeader from "./components/DashboardHeader";
import StatCard from "./components/StatCard";
import ActivityList from "./components/ActivityList";
import RecentFilesList from "./components/RecentFilesList";
import { Link } from "react-router-dom";

const TeacherDashboard = () => {
    const dispatch = useDispatch();
    const { stats, recentFiles, recentActivity, isLoading } = useSelector((state) => state.teacher);
    const { authUser } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getTeacherDashboard());
    }, [dispatch]);

    if (isLoading && (!stats && !recentFiles && !recentActivity)) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Dashboard Header */}
            <DashboardHeader 
                title={`Welcome back, ${authUser?.name || "Teacher"}`} 
                subtitle="Here's your overview and latest updates."
                icon={ClipboardList}
            />

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard 
                    title="Pending Approvals" 
                    value={stats?.pendingRequests || 0} 
                    icon={FileSignature}
                    colorTheme="blue"
                />
                <StatCard 
                    title="Total Assigned Students" 
                    value={stats?.assignedStudents || 0} 
                    icon={Users}
                    colorTheme="green"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link to="/dashboard/pending-requests" className="group bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 flex items-center justify-between transition-all shadow-sm hover:shadow-md border border-blue-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FileSignature size={20} />
                            </div>
                            <span className="font-medium text-base">View Pending Requests</span>
                        </div>
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </Link>

                    <Link to="/dashboard/assigned-students" className="group bg-white hover:bg-slate-50 text-slate-700 rounded-xl p-5 flex items-center justify-between transition-all shadow-sm hover:shadow-md border border-slate-200 hover:border-slate-300">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <Users size={20} />
                            </div>
                            <span className="font-medium text-base">Manage Students</span>
                        </div>
                        <ArrowRight className="group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-600" size={20} />
                    </Link>
                </div>
            </div>

            {/* Lower Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div>
                    <ActivityList activities={recentActivity} />
                </div>

                {/* Recent Files */}
                <div>
                    <RecentFilesList files={recentFiles} />
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;

