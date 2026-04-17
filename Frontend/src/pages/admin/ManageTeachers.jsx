import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers, deleteUser } from "../../store/slices/adminSlice";
import { GraduationCap, Trash2, ShieldAlert } from "lucide-react";

const ManageTeachers = () => {
    const dispatch = useDispatch();
    const { users, isLoading } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(getAllUsers());
    }, [dispatch]);

    const teachers = users?.filter(u => u.role === "Supervisor") || [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <GraduationCap size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manage Supervisors</h1>
                    <p className="text-slate-500 mt-1">View, edit, and manage teacher accounts across departments.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Supervisor Info</th>
                                <th className="px-6 py-4 font-medium">Department</th>
                                <th className="px-6 py-4 font-medium">Assigned Students</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {teachers.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shadow-sm shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800">{user.name}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.department ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-slate-100 text-slate-700">
                                                {user.department}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                                            {user.assignedStudents?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center group"
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
                                                    dispatch(deleteUser(user._id));
                                                }
                                            }}
                                            title="Delete Supervisor"
                                        >
                                            <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {teachers.length === 0 && (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50">
                        <ShieldAlert size={48} className="text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-600">No supervisors found.</p>
                        <p className="text-sm mt-1">Teacher accounts will appear here once registered.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageTeachers;
