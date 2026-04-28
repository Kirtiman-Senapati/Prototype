import { TrendingUp, Minus } from "lucide-react";

const StatCard = ({ title, value, icon: Icon }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 h-[110px] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{title}</h3>
                <div className="text-slate-400">
                    <Icon size={20} strokeWidth={2} />
                </div>
            </div>
            <div>
                <p className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight line-clamp-2">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
