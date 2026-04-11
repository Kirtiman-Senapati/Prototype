import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminDashboard } from "../../store/slices/adminSlice";

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const { stats, isLoading } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(getAdminDashboard());
    }, [dispatch]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">System Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 text-center hover:shadow-md transition-shadow">
                    <h2 className="text-slate-500 font-medium uppercase tracking-wide text-sm">Total Students</h2>
                    <p className="text-4xl font-bold text-blue-600 mt-4">{stats?.totalStudents || 0}</p>
                </div>
                
                <div className="card p-6 text-center hover:shadow-md transition-shadow">
                    <h2 className="text-slate-500 font-medium uppercase tracking-wide text-sm">Total Teachers</h2>
                    <p className="text-4xl font-bold text-green-600 mt-4">{stats?.totalTeachers || 0}</p>
                </div>

                <div className="card p-6 text-center hover:shadow-md transition-shadow">
                    <h2 className="text-slate-500 font-medium uppercase tracking-wide text-sm">Total Projects</h2>
                    <p className="text-4xl font-bold text-purple-600 mt-4">{stats?.totalProjects || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="card">
                     <h2 className="card-title mb-4">Quick Links</h2>
                     <div className="space-y-3">
                         <a href="/dashboard/manage-students" className="block text-blue-600 hover:underline">Manage Students ↗</a>
                         <a href="/dashboard/manage-teachers" className="block text-blue-600 hover:underline">Manage Supervisors ↗</a>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
