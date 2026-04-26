const StatCard = ({ title, value, icon: Icon, colorTheme = "blue" }) => {
    
    // Determine colors only for the icon to keep the card professional and clean
    const iconColors = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600"
    };

    const iconColorClass = iconColors[colorTheme] || iconColors.blue;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
                <div className={`${iconColorClass} bg-transparent`}>
                    {Icon && <Icon size={20} strokeWidth={2} />}
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
