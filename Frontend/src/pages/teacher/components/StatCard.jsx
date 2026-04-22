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
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-slate-500 tracking-wide">{title}</h3>
                <div className={`p-2.5 rounded-lg ${iconColorClass}`}>
                    {Icon && <Icon size={20} />}
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
