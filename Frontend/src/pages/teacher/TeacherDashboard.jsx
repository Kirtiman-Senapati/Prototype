import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTeacherDashboard } from "../../store/slices/teacherSlice";

const TeacherDashboard = () => {
    const dispatch = useDispatch();
    const { stats, isLoading } = useSelector((state) => state.teacher);
    const { authUser } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getTeacherDashboard());
    }, [dispatch]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Assigned Dashboard: {authUser?.name}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-8 text-center hover:shadow-md transition-shadow">
                    <h2 className="text-slate-500 font-medium">Pending Approvals</h2>
                    <p className="text-5xl font-bold text-blue-600 mt-4">{stats?.pendingRequests || 0}</p>
                </div>
                
                <div className="card p-8 text-center hover:shadow-md transition-shadow">
                    <h2 className="text-slate-500 font-medium">Total Assigned Students</h2>
                    <p className="text-5xl font-bold text-green-600 mt-4">{stats?.assignedStudents || 0}</p>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title">Quick Actions</h2>
                <div className="flex gap-4 mt-4">
                    <a href="/dashboard/pending-requests" className="btn-outline">View Pending Requests</a>
                    <a href="/dashboard/assigned-students" className="btn-primary">Manage Students</a>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
