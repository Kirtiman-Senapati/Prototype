import React from 'react';
import { toast as toastify } from 'react-toastify';

export const showToast = (message, type = 'success', isLoading = false) => {
    return toastify(
        ({ closeToast }) => (
            <div className="flex items-start gap-3 w-[320px] px-4 py-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 relative">
                {/* Icon */}
                <div className="mt-1 shrink-0">
                    {isLoading ? (
                        <div className="w-2.5 h-2.5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    ) : (
                        <div className={`w-2 h-2 rounded-full ${type === 'error' ? 'bg-rose-500' : type === 'info' ? 'bg-blue-500' : type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 text-[13px] text-slate-700 leading-relaxed font-medium pr-6">
                    {message}
                </div>

                {/* Close */}
                {!isLoading && (
                    <button 
                        onClick={closeToast}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    >
                        ✕
                    </button>
                )}
            </div>
        ),
        {
            position: "top-right",
            autoClose: isLoading ? false : 3000,
            hideProgressBar: true,
            closeOnClick: !isLoading,
            pauseOnHover: true,
            draggable: true,
            closeButton: false,
            icon: false,
            className: "!bg-transparent !p-0 !m-0 !shadow-none !border-none !min-h-0",
            style: { background: "transparent", boxShadow: "none", minHeight: "0" }
        }
    );
};

export const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    info: (msg) => showToast(msg, 'info'),
    warning: (msg) => showToast(msg, 'warning'),
    loading: (msg) => showToast(msg, 'info', true),
    update: (id, options) => {
        toastify.update(id, {
            render: ({ closeToast }) => (
                <div className="flex items-start gap-3 w-[320px] px-4 py-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 relative">
                    <div className="mt-1 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${options.type === 'error' ? 'bg-rose-500' : options.type === 'info' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                    </div>
                    <div className="flex-1 text-[13px] text-slate-700 leading-relaxed font-medium pr-6">
                        {options.render}
                    </div>
                    <button onClick={closeToast} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5">✕</button>
                </div>
            ),
            autoClose: options.autoClose !== undefined ? options.autoClose : 3000,
            closeOnClick: true
        });
    },
    dismiss: toastify.dismiss,
    custom: toastify
};
