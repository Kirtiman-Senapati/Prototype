import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTeacherDashboard, getAssignedStudents, getPendingRequests } from "../../store/slices/teacherSlice";
import { getActivities, addRealtimeActivity } from "../../store/slices/activitySlice";
import { Loader, Users, FileSignature, ArrowRight, ClipboardList, Clock, CheckCircle2, XCircle } from "lucide-react";
import { io } from "socket.io-client";
import DashboardHeader from "./components/DashboardHeader";
import StatCard from "./components/StatCard";
import ActivityList from "./components/ActivityList";
import RecentFilesList from "./components/RecentFilesList";
import { Link } from "react-router-dom";
import { useState } from "react";

const TeacherDashboard = () => {
    const dispatch = useDispatch();
    const { stats, recentFiles, completedProjectsList, isLoading, assignedStudents, requests } = useSelector((state) => state.teacher);
    const { authUser } = useSelector((state) => state.auth);
    const { activities } = useSelector((state) => state.activity);

    const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
    const [isAssignedModalOpen, setIsAssignedModalOpen] = useState(false);
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

    useEffect(() => {
        dispatch(getTeacherDashboard());
        dispatch(getAssignedStudents());
        dispatch(getPendingRequests());
        dispatch(getActivities());
    }, [dispatch]);

    useEffect(() => {
        if (!authUser?._id) return;
        const socket = io("http://localhost:4000", { query: { userId: authUser._id } });
        socket.on("newActivity", (activity) => { dispatch(addRealtimeActivity(activity)); });
        return () => socket.disconnect();
    }, [authUser, dispatch]);

    if (isLoading && !stats) {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div 
                    onClick={() => setIsAssignedModalOpen(true)}
                    className="cursor-pointer hover:-translate-y-1 transition-transform relative group block outline-none"
                >
                    <StatCard 
                        title="Assigned Students" 
                        value={stats?.assignedStudents || 0} 
                        icon={Users}
                        colorTheme="blue"
                    />
                    <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 shadow-sm">
                            View List &rarr;
                        </span>
                    </div>
                </div>

                <div 
                    onClick={() => setIsRequestsModalOpen(true)}
                    className="cursor-pointer hover:-translate-y-1 transition-transform relative group block outline-none"
                >
                    <StatCard 
                        title="Pending Requests" 
                        value={stats?.pendingRequests || 0} 
                        icon={Clock}
                        colorTheme="orange"
                    />
                    <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 shadow-sm">
                            View List &rarr;
                        </span>
                    </div>
                </div>
                
                <div 
                    onClick={() => setIsCompletedModalOpen(true)}
                    className="cursor-pointer hover:-translate-y-1 transition-transform relative group outline-none"
                >
                    <StatCard 
                        title="Completed Projects" 
                        value={stats?.completedProjects || 0} 
                        icon={CheckCircle2}
                        colorTheme="green"
                    />
                    <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm">
                            View List &rarr;
                        </span>
                    </div>
                </div>
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
                    <ActivityList activities={activities || []} />
                </div>

                {/* Recent Files */}
                <div>
                    <RecentFilesList files={recentFiles} />
                </div>
            </div>

            {/* Completed Projects Modal */}
            {isCompletedModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500" size={24} /> Completed Projects
                            </h2>
                            <button 
                                onClick={() => setIsCompletedModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            {!completedProjectsList || completedProjectsList.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-slate-500 font-medium">No completed projects yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {completedProjectsList.map(p => (
                                        <div key={p._id} className="p-5 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg mb-1">{p.title}</h3>
                                                <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                                                    <Users size={14} className="opacity-70" /> {p.student?.name || "Unknown Student"}
                                                </p>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <div className="inline-flex flex-col md:items-end">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completion Date</span>
                                                    <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                                                        {new Date(p.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end rounded-b-2xl">
                            <button 
                                onClick={() => setIsCompletedModalOpen(false)}
                                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assigned Students Modal */}
            {isAssignedModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-blue-500" size={24} /> Assigned Students
                            </h2>
                            <button 
                                onClick={() => setIsAssignedModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            {!assignedStudents || assignedStudents.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-slate-500 font-medium">No assigned students yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {assignedStudents.map(student => (
                                        <div key={student._id} className="p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg mb-1">{student.name}</h3>
                                                <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                                                    {student.email}
                                                </p>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <Link to="/dashboard/assigned-students" className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors">
                                                    Manage Project
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-2xl">
                            <Link to="/dashboard/assigned-students" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Open Full Page &rarr;</Link>
                            <button 
                                onClick={() => setIsAssignedModalOpen(false)}
                                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Requests Modal */}
            {isRequestsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="text-orange-500" size={24} /> Pending Requests
                            </h2>
                            <button 
                                onClick={() => setIsRequestsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            {!requests || requests.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-slate-500 font-medium">No pending requests.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map(req => (
                                        <div key={req._id} className="p-5 bg-white border border-slate-200 rounded-xl hover:border-orange-300 transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg mb-1">{req.fromUser?.name || "Student"}</h3>
                                                <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                                                    <FileSignature size={14} className="opacity-70" /> {req.type} Request
                                                </p>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <div className="inline-flex flex-col md:items-end">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requested On</span>
                                                    <span className="text-sm font-semibold text-orange-700 bg-orange-50 px-3 py-1 rounded-lg">
                                                        {new Date(req.createdAt).toLocaleDateString('en-GB')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-2xl">
                            <Link to="/dashboard/pending-requests" className="text-sm font-semibold text-orange-600 hover:text-orange-700">Go to Review &rarr;</Link>
                            <button 
                                onClick={() => setIsRequestsModalOpen(false)}
                                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
