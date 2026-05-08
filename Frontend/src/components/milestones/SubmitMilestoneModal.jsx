import React, { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';

const SubmitMilestoneModal = ({ isOpen, onClose, onSubmit, milestone, isSubmitting }) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(milestone._id, file);
    };

    if (!isOpen || !milestone) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Submit Milestone</h2>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">{milestone.title}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    <div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                            You are submitting work for the <span className="font-semibold text-slate-800">{milestone.title}</span> phase. Once submitted, it will be marked as "In Review" for your supervisor to evaluate.
                        </p>
                        
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attach File (Optional)</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer relative">
                            <input 
                                type="file" 
                                onChange={handleFileChange} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            />
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
                                    <UploadCloud size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">{file ? file.name : "Click to upload a file"}</p>
                                    <p className="text-[11px] text-slate-400 mt-1">PDF, DOCX, ZIP up to 10MB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 transition text-sm">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition flex justify-center items-center text-sm disabled:opacity-70">
                            {isSubmitting ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span> : "Submit for Review"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmitMilestoneModal;
