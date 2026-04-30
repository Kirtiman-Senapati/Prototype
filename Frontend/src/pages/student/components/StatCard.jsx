const StatCard = ({ title, value, icon: Icon }) => {
    return (
        
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-1.2 min-h-[90px] transition-all duration-200 hover:shadow-sm hover:border-slate-300">
            
            {/* Top row */}
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-tight">
                    {title}
                </h3>
                {Icon && <Icon size={18} className="text-slate-400" />}
            </div>

            {/* Value */}
            <p className="text-[17px] font-semibold text-slate-900 tracking-tight leading-snug pt-[2px]">
                {value}
            </p>

        </div>
    );
};

export default StatCard;
