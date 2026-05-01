const StatCard = ({ title, value, icon: Icon, colorTheme = "blue" }) => {
    
    // Determine colors only for the icon to keep the card professional and clean
    const iconColors = {
        blue: "text-slate-400",
        green: "text-slate-400",
        orange: "text-slate-400",
        purple: "text-slate-400"
    };

    const iconColorClass = iconColors[colorTheme] || iconColors.blue;

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2 min-h-[90px] transition-all hover:border-slate-300">
            
            {/* Top row */}
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                    {title}
                </h3>
                {Icon && <Icon size={18} className={iconColorClass} />}
            </div>

            {/* Value */}
            <p className="text-lg font-semibold text-slate-900 tracking-tight leading-tight">
                {value}
            </p>

        </div>
    );
};

export default StatCard;
