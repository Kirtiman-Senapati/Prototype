import { FileText, MonitorPlay, Archive, Download } from "lucide-react";

const FileItem = ({ file }) => {
    const getFileIcon = (type, className = "") => {
        if (type === "Report") return <FileText className={`text-blue-500 ${className}`} size={16} />;
        if (type === "Presentation") return <MonitorPlay className={`text-amber-500 ${className}`} size={16} />;
        if (type === "Code") return <Archive className={`text-purple-500 ${className}`} size={16} />;
        return <FileText className={`text-slate-500 ${className}`} size={16} />;
    };

    return (
        <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50 hover:bg-white hover:border-blue-100 transition-all group shadow-sm">
            <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="bg-white p-1.5 rounded-md border border-slate-100 shrink-0 shadow-sm">
                    {getFileIcon(file.type)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-700 truncate" title={file.filename}>
                        {file.filename}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('en-GB') : "Recently"}
                    </p>
                </div>
            </div>
            
            <a 
                href={`http://localhost:4000${file.url}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:shadow-sm shrink-0 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 flex items-center justify-center focus:opacity-100"
                title="Download"
            >
                <Download size={14} />
            </a>
        </div>
    );
};

export default FileItem;
