import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers, deleteUser, adminAddSupervisor } from "../../store/slices/adminSlice";
import { GraduationCap, Trash2, ShieldAlert, Plus, X, Search, Filter, BookOpen, Users as UsersIcon } from "lucide-react";

const ManageTeachers = () => {
    const dispatch = useDispatch();
    const { users, isLoading } = useSelector((state) => state.admin);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", department: "", experties: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");

    useEffect(() => {
        dispatch(getAllUsers());
    }, [dispatch]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const resultAction = await dispatch(adminAddSupervisor(formData));
        setIsSubmitting(false);
        if (adminAddSupervisor.fulfilled.match(resultAction)) {
            setIsModalOpen(false);
            setFormData({ name: "", email: "", password: "", department: "", experties: "" });
        }
    };

    if (isLoading && teachers.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header & Main Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <GraduationCap size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manage Supervisors</h1>
                        <p className="text-slate-500 mt-1">Add, filter, and manage faculty members.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-md flex items-center gap-2"
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
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition outline-none"
                    />
                </div>
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition outline-none bg-white appearance-none"
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTeachers.map((user) => (
                        <div key={user._id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col relative group">
                            <button 
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
                                        dispatch(deleteUser(user._id));
                                    }
                                }}
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Supervisor"
                            >
                                <Trash2 size={18} />
                            </button>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col pt-1 overflow-hidden">
                                    <h3 className="text-lg font-bold text-slate-800 truncate">{user.name}</h3>
                                    <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 mb-5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                                    {user.department || "No Department"}
                                </span>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><BookOpen size={12} /> Expertise</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.experties && user.experties.length > 0 ? (
                                            user.experties.map((exp, idx) => (
                                                <span key={idx} className="bg-slate-50 text-slate-600 text-[11px] px-2 py-0.5 border border-slate-200 rounded shrink-0">{exp}</span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Not specified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><UsersIcon size={12} /> Assigned</p>
                                    <p className="font-semibold text-slate-800 text-lg tabular-nums">{user.assignedStudents?.length || 0}</p>
                                </div>
                                {/* Capacity / Max Students visual placeholder */}
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                    <span className="inline-block mt-1 w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm ring-2 ring-green-100"></span>
                                    <span className="text-xs font-medium text-slate-600 ml-1.5">Active</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-slate-500 shadow-sm">
                    <ShieldAlert size={48} className="text-slate-300 mb-4" />
                    <p className="text-lg font-medium text-slate-600">No supervisors found matching your criteria.</p>
                    {searchQuery || departmentFilter ? (
                         <button onClick={() => { setSearchQuery(""); setDepartmentFilter(""); }} className="mt-4 text-green-600 font-medium hover:underline">Clear Filters</button>
                    ) : (
                         <p className="text-sm mt-1">Click "Add Teacher" above to register faculty members.</p>
                    )}
                </div>
            )}

            {/* 🔥 ADD TEACHER MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
                            <h2 className="text-lg font-bold text-slate-800">Add New Supervisor</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-5 shrink">
                            <form id="teacherForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition outline-none" placeholder="Dr. John Doe" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department <span className="text-red-500">*</span></label>
                                        <select name="department" value={formData.department} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition outline-none bg-white">
                                            <option value="">Select department...</option>
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Software Engineering">Software Engineering</option>
                                            <option value="Information Technology">Information Technology</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition outline-none" placeholder="faculty@university.edu" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Temporary Password <span className="text-red-500">*</span></label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition outline-none" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expertise Topics (Comma Separated)</label>
                                    <input type="text" name="experties" value={formData.experties} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition outline-none" placeholder="Machine Learning, IoT, Web Security" />
                                    <p className="text-xs text-slate-500 mt-1">E.g. Web Development, Artificial Intelligence</p>
                                </div>
                            </form>
                        </div>
                        <div className="p-5 border-t border-slate-100 shrink-0 flex gap-3 bg-slate-50">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-slate-700 font-medium bg-slate-200 hover:bg-slate-300 transition">Cancel</button>
                            <button type="submit" form="teacherForm" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-70 transition flex justify-center items-center">
                                {isSubmitting ? <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span> : "Add Supervisor"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTeachers;
