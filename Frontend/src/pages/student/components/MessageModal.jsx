import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { sendUnifiedMessage } from '../../../store/slices/activitySlice';
import { X, Send } from 'lucide-react';

const MessageModal = ({ isOpen, onClose, supervisorName, projectId }) => {
    const dispatch = useDispatch();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        setIsSubmitting(true);
        try {
            await dispatch(sendUnifiedMessage({ projectId, title, message })).unwrap();
            setTitle('');
            setMessage('');
            onClose();
        } catch (error) {
            console.error("Message Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800">Message Supervisor</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                            To: {supervisorName || "Admin & Supervisor"}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    
                    <div>
                        <label className="block text-[11px] uppercase text-slate-400 font-bold mb-1.5">Subject / Title</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Progress Update / Blocked on Issue"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-colors text-sm font-medium placeholder:text-slate-400 text-slate-800"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase text-slate-400 font-bold mb-1.5">Your Message / Update</label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Share progress, completion status, or issues you are facing..."
                            rows={5}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-colors text-sm font-medium resize-none placeholder:text-slate-400 text-slate-800"
                            required
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-slate-600 border border-slate-200 font-bold hover:bg-slate-50 transition-colors text-sm"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !message.trim()}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm text-sm"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Message'} <Send size={16} />
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default MessageModal;
