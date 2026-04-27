import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers, deleteUser, adminAddSupervisor, adminUpdateUser } from "../../store/slices/adminSlice";
import { GraduationCap, Trash2, ShieldAlert, Plus, Search, Filter, Edit2 } from "lucide-react";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import AddSupervisorModal from "../../components/modal/AddSupervisorModal";

const ManageTeachers = () => {
    const dispatch = useDispatch();
    const { users, isLoading } = useSelector((state) => state.admin);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", department: "", experties: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");

    const departments = [
        "Computer Science & Engineering",
        "Information Technology",
        "Civil Engineering",
        "Electrical Engineering",
        "Mechanical Engineering"
    ];

    useEffect(() => {
        dispatch(getAllUsers());
    }, [dispatch]);

    useAutoRefresh(() => {
        dispatch(getAllUsers());
    });

    const teachers = users?.filter(u => u.role === "Supervisor") || [];

    // Apply strict filtering
    const filteredTeachers = teachers.filter(teacher => {
        const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = departmentFilter === "" || teacher.department === departmentFilter;
        return matchesSearch && matchesDept;
    });

    const uniqueDepartments = [...new Set(teachers.map(t => t.department).filter(Boolean))];

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openCreateModal = () => {
        setEditId(null);
        setFormData({ name: "", email: "", password: "", department: "", experties: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditId(user._id);
        const expertiseStr = user.experties ? user.experties.join(", ") : "";
        setFormData({ name: user.name, email: user.email, password: "", department: user.department || "", experties: expertiseStr });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        let resultAction;
        
        if (editId) {
            // Edit user flow
            // If password is submitted blank, don't send it to the backed to avoid hashing a blank password
            const dataToSubmit = { ...formData };
            if (!dataToSubmit.password) {
                delete dataToSubmit.password;
            }
            resultAction = await dispatch(adminUpdateUser({ userId: editId, userData: dataToSubmit }));
            setIsSubmitting(false);
            if (adminUpdateUser.fulfilled.match(resultAction)) {
                setIsModalOpen(false);
                setEditId(null);
            }
        } else {
            // Create user flow
            resultAction = await dispatch(adminAddSupervisor(formData));
            setIsSubmitting(false);
            if (adminAddSupervisor.fulfilled.match(resultAction)) {
                setIsModalOpen(false);
                setFormData({ name: "", email: "", password: "", department: "", experties: "" });
            }
        }
    };

    if (isLoading && teachers.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header & Main Actions */}
            <div className="bg-white rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                        <GraduationCap size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Manage Supervisors</h1>
                        <p className="text-sm text-slate-500 mt-1">Organize and control faculty access.</p>
                    </div>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 active:scale-[0.98] px-5 py-2.5 rounded-md text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Teacher
                </button>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search supervisor by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none"
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none bg-white appearance-none"
                    >
                        <option value="">All Departments</option>
                        {uniqueDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Teacher Cards Grid */}
            {filteredTeachers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredTeachers.map((user) => (
                        <div key={user._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] transition-all duration-200 flex flex-col relative group overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-[2px] bg-slate-200 group-hover:bg-slate-300 transition-colors duration-300"></div>
                            
                            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50/80 rounded-lg p-1 gap-1">
                                <button 
                                    onClick={() => openEditModal(user)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                    title="Edit Supervisor"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => {
                                        if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
                                            dispatch(deleteUser(user._id));
                                        }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete Supervisor"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xl font-medium shrink-0">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col pt-0.5 overflow-hidden pr-8">
                                    <h3 className="text-[15px] font-semibold text-slate-900 truncate">{user.name}</h3>
                                    <p className="text-[13px] text-slate-500 truncate">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 mb-5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    {user.department || "No Department"}
                                </span>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Expertise</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.experties && user.experties.length > 0 ? (
                                            user.experties.map((exp, idx) => (
                                                <span key={idx} className="bg-white text-slate-600 text-xs px-2.5 py-1 border border-slate-200 rounded-md shrink-0">{exp}</span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Not specified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Assigned</p>
                                    <p className="font-medium text-slate-800 text-base tabular-nums">{user.assignedStudentsCount !== undefined ? user.assignedStudentsCount : (user.assignedStudents?.length || 0)}</p>
                                </div>
                                {/* Capacity / Max Students visual placeholder */}
                                <div className="text-right">
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500 shadow-sm">
                    <ShieldAlert size={48} className="text-slate-300 mb-4" />
                    <p className="text-lg font-medium text-slate-600">No supervisors found matching your criteria.</p>
                    {searchQuery || departmentFilter ? (
                         <button onClick={() => { setSearchQuery(""); setDepartmentFilter(""); }} className="mt-4 text-slate-900 font-medium hover:underline">Clear Filters</button>
                    ) : (
                         <p className="text-sm mt-1">Click "Add Teacher" above to register faculty members.</p>
                    )}
                </div>
            )}

            {/* 🔥 ADD/EDIT TEACHER MODAL */}
            <AddSupervisorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                handleChange={handleChange}
                isSubmitting={isSubmitting}
                editId={editId}
            />
        </div>
    );
};

export default ManageTeachers;

