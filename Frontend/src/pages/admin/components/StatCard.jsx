import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-slate-100 flex items-center gap-4">
            <div className={`p-4 rounded-lg ${bgColorClass} ${colorClass}`}>
                <Icon size={28} />
            </div>
            <div>
                <h2 className="text-slate-500 font-medium uppercase tracking-wide text-xs mb-1">{title}</h2>
                <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
