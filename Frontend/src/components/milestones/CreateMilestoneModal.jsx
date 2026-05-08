import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CreateMilestoneModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        deadline: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                description: initialData.description || "",
                deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : ""
            });
        } else {
            setFormData({ title: "", description: "", deadline: "" });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">
                        {initialData ? "Edit Milestone" : "Add New Milestone"}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Milestone Title <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            name="title" 
                            value={formData.title} 
                            onChange={handleChange} 
                            required 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition outline-none text-sm" 
                            placeholder="e.g. Synopsis Submission" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition outline-none text-sm min-h-[100px] resize-none" 
                            placeholder="Briefly describe what needs to be accomplished..." 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deadline (Optional)</label>
                        <input 
                            type="date" 
                            name="deadline" 
                            value={formData.deadline} 
                            onChange={handleChange} 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition outline-none text-sm bg-white" 
                        />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 transition text-sm">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition flex justify-center items-center text-sm">
                            {initialData ? "Save Changes" : "Create Milestone"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMilestoneModal;
