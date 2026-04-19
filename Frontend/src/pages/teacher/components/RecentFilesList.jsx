import { FileText, MonitorPlay, Archive, Download } from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const RecentFilesList = ({ files }) => {
    if (!files || files.length === 0) {
        return (
            <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-8 text-center text-slate-500">
                No recent files.
            </div>
        );
    }

    const getFileIcon = (type, className = "") => {
        if (type === "Report") return <FileText className={`text-blue-500 ${className}`} size={18} />;
        if (type === "Presentation") return <MonitorPlay className={`text-amber-500 ${className}`} size={18} />;
        if (type === "Code") return <Archive className={`text-purple-500 ${className}`} size={18} />;
        return <FileText className={`text-slate-500 ${className}`} size={18} />;
    };

    const handleDownload = async (fileUrl, originalFilename) => {
        try {
            const toastId = toast.loading("Downloading file...");
            const response = await fetch(`http://localhost:4000${fileUrl}`);
            if (!response.ok) throw new Error("Download failed");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = originalFilename; 
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.update(toastId, { render: "Downloaded!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to download file");
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Recent Files</h3>
                <Link to="/dashboard/teacher-files" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">View All</Link>
            </div>
            <div className="divide-y divide-slate-100">
                {files.map((file, idx) => (
                    <div key={idx} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                                {getFileIcon(file.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate" title={file.filename}>
                                    {file.filename}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                    {file.studentName} • {new Date(file.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(file.uploadedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDownload(file.url, file.filename)}
                            className="text-slate-400 hover:text-blue-600 transition-colors shrink-0 ml-4 p-2 bg-white border border-slate-200 rounded-md shadow-sm hover:border-blue-300"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentFilesList;
