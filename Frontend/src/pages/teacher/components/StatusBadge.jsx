const StatusBadge = ({ status }) => {
    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
                return "bg-emerald-50 text-emerald-600 border-emerald-200";
            case "pending":
                return "bg-amber-50 text-amber-600 border-amber-200";
            case "rejected":
                return "bg-red-50 text-red-600 border-red-200";
            case "completed":
                return "bg-blue-50 text-blue-600 border-blue-200";
            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    return (
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border shadow-sm ${getStatusStyles(status)}`}>
            {status || "Unknown"}
        </span>
    );
};

export default StatusBadge;
