import React from 'react';
import { X } from 'lucide-react';

const AddSupervisorModal = ({
    isOpen,
    onClose,
    onSubmit,
    formData,
    handleChange,
    isSubmitting,
    editId
}) => {
    if (!isOpen) return null;

    const departments = [
        "Computer Science & Engineering",
        "Information Technology",
        "Civil Engineering",
        "Electrical Engineering",
        "Mechanical Engineering"
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
                    <h2 className="text-lg font-semibold text-slate-900">{editId ? 'Edit Supervisor Details' : 'Add New Supervisor'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition">
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto p-6 shrink custom-scrollbar">
                    <form id="teacherForm" onSubmit={onSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none text-sm" placeholder="Dr. John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department <span className="text-red-500">*</span></label>
                                <select name="department" value={formData.department} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none bg-white text-sm">
                                    <option value="">Select department...</option>
                                    {departments.map((dep, index) => (
                                        <option key={index} value={dep}>{dep}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none text-sm" placeholder="faculty@university.edu" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                                <span>{editId ? 'New Password' : 'Temporary Password'} {editId ? '' : <span className="text-red-500">*</span>}</span>
                                {editId && <span className="font-normal text-xs text-slate-400">(Leave blank to keep current)</span>}
                            </label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editId} className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none text-sm" placeholder="••••••••" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Expertise Topics (Comma Separated)</label>
                            <input type="text" name="experties" value={formData.experties} onChange={handleChange} className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition outline-none text-sm" placeholder="Machine Learning, IoT, Web Security" />
                            <p className="text-xs text-slate-500 mt-1.5">E.g. Web Development, Artificial Intelligence</p>
                        </div>
                    </form>
                </div>
                <div className="p-5 border-t border-slate-100 shrink-0 flex gap-3 bg-slate-50 justify-end">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 bg-transparent transition-colors">Cancel</button>
                    <button type="submit" form="teacherForm" disabled={isSubmitting} className="px-5 py-2.5 rounded-md text-white text-sm font-medium bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2">
                        {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : (editId ? "Save Changes" : "Add Supervisor")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSupervisorModal;
