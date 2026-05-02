const StatusBadge = ({ status }) => 
{
    const getStatusStyles = (status) => 
    {
        switch (status?.toLowerCase()) 
        {
            case "approved":
                return "bg-slate-100 text-slate-700 border-slate-200";
            case "pending":
                return "bg-slate-100 text-slate-500 border-slate-200";
            case "rejected":
                return "bg-slate-100 text-slate-400 border-slate-200";
            case "completed":
                return "bg-slate-900 text-white border-slate-900";
            default:
                return "bg-slate-100 text-slate-600 border-slate-200";
        }
    };
    
    return (
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${getStatusStyles(status)}`}>
            {status || "Unknown"}
        </span>
    );
};

export default StatusBadge;
