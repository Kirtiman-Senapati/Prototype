import React from 'react';
import { Link } from 'react-router-dom';

const ActionCard = ({ title, icon: Icon, to, colorClass, bgColorClass, description }) => {
    return (
        <Link to={to} className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 hover:border-slate-300 group-hover:-translate-y-1">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${bgColorClass} ${colorClass} transition-colors`}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{title}</h3>
                        <p className="text-slate-500 text-sm">{description}</p>
                    </div>
                    <div className="ml-auto text-slate-400 group-hover:text-blue-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ActionCard;
