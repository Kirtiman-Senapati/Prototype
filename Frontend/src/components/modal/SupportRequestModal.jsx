import React, { useState } from 'react';
import { X, HelpCircle, Loader2 } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import { toast } from '../../utils/toast';

const SupportRequestModal = ({ isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        type: 'Deadline Extension',
        reason: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!/^[6-9]\d{9}$/.test(formData.phone)) {
            toast.error("Please enter a valid 10-digit Indian phone number.");
            return;
        }
        
        setIsLoading(true);
        try {
            await axiosInstance.post('/support', formData);
            toast.success("Support request submitted successfully!");
            onClose();
            // Reset form
            setFormData({ phone: '', type: 'Deadline Extension', reason: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit request");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <HelpCircle size={18} className="text-slate-600" />
                        </div>
                        <h2 className="text-[17px] font-semibold">Contact Support</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        
                        <div>
                            <label className="block text-[13px] font-medium text-slate-700 mb-1">
                                Contact Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                placeholder="10-digit mobile number"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-slate-700 mb-1">
                                Issue Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-400"
                            >
                                <option value="Deadline Extension">Deadline Extension</option>
                                <option value="Technical Problem">Technical Problem</option>
                                <option value="Supervisor Issue">Supervisor Issue</option>
                                <option value="Submission Issue">Submission Issue</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-slate-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={formData.reason}
                                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                placeholder="Briefly describe your issue or reason for extension..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-400 resize-none"
                            />
                        </div>

                    </div>

                    {/* Footer / Actions */}
                    <div className="mt-8 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            {isLoading ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupportRequestModal;
