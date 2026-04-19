import { CheckCircle, XCircle, Clock } from "lucide-react";

const ActivityList = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-8 text-center text-slate-500">
                No recent activity.
            </div>
        );
    }

    const getStatusIcon = (status) => {
        if (status === "Accepted") return <CheckCircle className="text-emerald-500" size={18} />;
        if (status === "Rejected") return <XCircle className="text-red-500" size={18} />;
        return <Clock className="text-blue-500" size={18} />;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Recent Activity</h3>
            </div>
            <div className="divide-y divide-slate-100">
                {activities.map((activity, idx) => (
                    <div key={idx} className="p-4 px-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                        <div className="mt-1 flex-shrink-0">
                            {getStatusIcon(activity.status)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-slate-800">
                                <span className="font-medium">{activity.fromUser?.name || "Student"}</span> sent a <span className="font-medium text-slate-600">{activity.type}</span> request.
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    activity.status === "Pending" ? "bg-blue-50 text-blue-600" :
                                    activity.status === "Accepted" ? "bg-emerald-50 text-emerald-600" :
                                    "bg-red-50 text-red-600"
                                }`}>
                                    {activity.status}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {new Date(activity.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(activity.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityList;