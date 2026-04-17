import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers, deleteUser } from "../../store/slices/adminSlice";
import { Users, Trash2, ShieldAlert } from "lucide-react";

const ManageStudents = () => {
    const dispatch = useDispatch();
    const { users, isLoading } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(getAllUsers());
    }, [dispatch]);

    const students = users?.filter(u => u.role === "Student") || [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manage Students</h1>
                    <p className="text-slate-500 mt-1">View, edit, and remove student accounts from the system.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Student Info</th>
                                <th className="px-6 py-4 font-medium">Supervisor</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800">{user.name}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${user.supervisor ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                            {user.supervisor ? "Assigned" : "Pending"}
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
                                            title="Delete Student"
                                        >
                                            <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {students.length === 0 && (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50">
                        <ShieldAlert size={48} className="text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-600">No students found.</p>
                        <p className="text-sm mt-1">Students registered in the system will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageStudents;
