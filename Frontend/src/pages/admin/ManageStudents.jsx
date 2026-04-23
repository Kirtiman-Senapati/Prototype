import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers, deleteUser, adminAddStudent, adminUpdateUser } from "../../store/slices/adminSlice";
import { Users, Trash2, ShieldAlert, Plus, X, Search, Filter, Edit2 } from "lucide-react";
import useAutoRefresh from "../../hooks/useAutoRefresh";

const ManageStudents = () => {
    const dispatch = useDispatch();
    const { users, isLoading } = useSelector((state) => state.admin);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", department: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const getStudentStatus = (user) => {
        if (!user.proposalStatus) {
            return { label: "No Proposal", color: "bg-slate-100 text-slate-700 border-slate-200", reason: "Not started" };
        }
        if (user.proposalStatus === "Rejected") {
            return { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", reason: "Proposal rejected" };
        }
        if (user.proposalStatus === "Pending") {
            return { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800 border-yellow-200", reason: "Waiting" };
        }
        if (user.proposalStatus === "Completed") {
            return { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", reason: "Project finished" };
        }
        if (user.proposalStatus === "Approved") {
            if (user.supervisor) {
                return { label: "Assigned", color: "bg-blue-100 text-blue-700 border-blue-200", reason: "Done" };
            } else {
                return { label: "Waiting Supervisor", color: "bg-orange-100 text-orange-700 border-orange-200", reason: "Supervisor not assigned" };
            }
        }
        return { label: "Unknown", color: "bg-slate-100 text-slate-700 border-slate-200", reason: "Unknown status" };
    };

    const departments = [
        "Computer Science & Engineering",
        "Information Technology",
        "Civil Engineering",
        "Electrical Engineering",
        "Mechanical Engineering"
    ];

    const { authUser } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getAllUsers());
    }, [dispatch]);

    useAutoRefresh(() => {
        dispatch(getAllUsers());
    });

    const students = users?.filter(u => u.role === "Student") || [];

    // Apply strict filtering
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              student.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = departmentFilter === "" || student.department === departmentFilter;
        
        const statusInfo = getStudentStatus(student);
        const matchesStatus = statusFilter === "" || statusInfo.label === statusFilter;

        return matchesSearch && matchesDept && matchesStatus;
    });

    const uniqueDepartments = [...new Set(students.map(s => s.department).filter(Boolean))];

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openCreateModal = () => {
        setEditId(null);
        setFormData({ name: "", email: "", password: "", department: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditId(user._id);
        setFormData({ name: user.name, email: user.email, password: "", department: user.department || "" });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        let resultAction;
        
        if (editId) {
            // Edit user flow
            const dataToSubmit = { ...formData };
            if (!dataToSubmit.password) delete dataToSubmit.password;
            
            resultAction = await dispatch(adminUpdateUser({ userId: editId, userData: dataToSubmit }));
            setIsSubmitting(false);
            if (adminUpdateUser.fulfilled.match(resultAction)) {
                setIsModalOpen(false);
                setEditId(null);
            }
        } else {
            // Create user flow
            resultAction = await dispatch(adminAddStudent(formData));
            setIsSubmitting(false);
            if (adminAddStudent.fulfilled.match(resultAction)) {
                setIsModalOpen(false);
                setFormData({ name: "", email: "", password: "", department: "" });
            }
        }
    };

    if (isLoading && students.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header & Main Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manage Students</h1>
                        <p className="text-slate-500 mt-1">View, edit, filter, and safely provision student accounts.</p>
                    </div>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-md flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Student
                </button>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search student by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none bg-white appearance-none"
                    >
                        <option value="">All Departments</option>
                        {uniqueDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                <div className="relative w-full md:w-56">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none bg-white appearance-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="No Proposal">No Proposal</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Waiting Supervisor">Waiting Supervisor</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Student Info</th>
                                <th className="px-6 py-4 font-medium">Department</th>
                                <th className="px-6 py-4 font-medium">Supervisor</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm shrink-0">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800">{user.name}</div>
                                                    <div className="text-sm text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {user.department || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const statusInfo = getStudentStatus(user);
                                                return (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusInfo.color}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                                            Reason: {statusInfo.reason}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <button 
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                                                    onClick={() => openEditModal(user)}
                                                    title="Edit Student"
                                                >
                                                    <Edit2 size={18} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                                <button 
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                                                    onClick={() => {
                                                        if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
                                                            dispatch(deleteUser(user._id));
                                                        }
                                                    }}
                                                    title="Delete Student"
                                                >
                                                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-500 bg-slate-50/50">
                                        <div className="flex flex-col items-center justify-center">
                                            <ShieldAlert size={48} className="text-slate-300 mb-4" />
                                            <p className="text-lg font-medium text-slate-600">No students found.</p>
                                            {searchQuery || departmentFilter || statusFilter ? (
                                                <button onClick={() => { setSearchQuery(""); setDepartmentFilter(""); setStatusFilter(""); }} className="mt-2 text-blue-600 font-medium hover:underline">Clear Filters</button>
                                            ) : (
                                                <p className="text-sm mt-1">Students registered in the system will appear here.</p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🔥 ADD/EDIT STUDENT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">{editId ? "Edit Student Details" : "Add New Student"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="e.g. Ali Reza" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="student@university.edu" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                                    <span>{editId ? 'New Password' : 'Temporary Password'} {editId ? '' : <span className="text-red-500">*</span>}</span>
                                    {editId && <span className="font-normal text-xs text-slate-400">(Leave blank to keep current)</span>}
                                </label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editId} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department (Optional)</label>
                                <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none bg-white">
                                    <option value="">Select a department...</option>
                                    {departments.map((dep, index) => (
                                        <option key={index} value={dep}>{dep}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 transition flex justify-center items-center">
                                    {isSubmitting ? <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span> : (editId ? "Save Changes" : "Add Student")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStudents;



