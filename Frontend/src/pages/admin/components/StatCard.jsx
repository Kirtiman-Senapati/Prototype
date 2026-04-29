import { TrendingUp, Minus } from "lucide-react";

const StatCard = ({ title, value, icon: Icon }) => {
    return (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col h-full hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{title}</h3>
                <div className="text-slate-400">
                    <Icon size={20} strokeWidth={2} />
                </div>
            </div>
            <div className="mt-auto">
                <p className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight line-clamp-2">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
