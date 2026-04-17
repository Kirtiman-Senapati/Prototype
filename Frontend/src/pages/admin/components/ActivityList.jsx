import React from 'react';
import { UserPlus, Briefcase, UserCircle } from 'lucide-react';

const ActivityList = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-slate-500 h-64">
                <p>No recent activity</p>
            </div>
        );
    }

    const getActivityIcon = (role) => {
        if (role === 'Student') return <UserCircle size={18} className="text-blue-500" />;
        if (role === 'Supervisor') return <Briefcase size={18} className="text-green-500" />;
        return <UserPlus size={18} className="text-purple-500" />;
    };

    const getActivityMessage = (activity) => {
        if (activity.role === 'Student') return `New student registered: ${activity.name}`;
        if (activity.role === 'Supervisor') return `New supervisor registered: ${activity.name}`;
        return `New user registered: ${activity.name}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-800">Recent Activity</h2>
            </div>
            <div className="divide-y divide-slate-100">
                {activities.map((activity, index) => (
                    <div key={activity._id || index} className="p-4 flex gap-4 items-start hover:bg-slate-50 transition-colors">
                        <div className={`p-2 rounded-full mt-1 ${activity.role === 'Student' ? 'bg-blue-100' : 'bg-green-100'}`}>
                            {getActivityIcon(activity.role)}
                        </div>
                        <div>
                            <p className="text-slate-700 font-medium">{getActivityMessage(activity)}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityList;
