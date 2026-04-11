import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers, deleteUser } from "../../store/slices/adminSlice";

const ManageTeachers = () => {
    const dispatch = useDispatch();
    const { users } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(getAllUsers());
    }, [dispatch]);

    const teachers = users?.filter(u => u.role === "Supervisor") || [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Manage Supervisors</h1>

            <div className="table">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="table-header">
                        <tr>
                            <th className="table-header-cell">Name</th>
                            <th className="table-header-cell">Email</th>
                            <th className="table-header-cell">Department</th>
                            <th className="table-header-cell">Assigned Students</th>
                            <th className="table-header-cell">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {teachers.map((user) => (
                            <tr key={user._id} className="table-row">
                                <td className="table-cell font-medium text-slate-900">{user.name}</td>
                                <td className="table-cell">{user.email}</td>
                                <td className="table-cell">{user.department || "-"}</td>
                                <td className="table-cell font-bold">{user.assignedStudents?.length || 0}</td>
                                <td className="table-cell">
                                    <button 
                                        className="text-red-600 hover:text-red-900 font-medium cursor-pointer"
                                        onClick={() => {
                                            if (window.confirm("Are you sure?")) dispatch(deleteUser(user._id));
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {teachers.length === 0 && <p className="p-6 text-center text-slate-500">No supervisors found.</p>}
            </div>
        </div>
    );
};

export default ManageTeachers;
