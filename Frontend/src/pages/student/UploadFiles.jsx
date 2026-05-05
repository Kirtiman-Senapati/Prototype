import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadProjectFile, getStudentDashboard } from "../../store/slices/studentSlice";
import { FileText, MonitorPlay, Archive, UploadCloud, Loader } from "lucide-react";
import { toast } from "../../utils/toast";

const UploadFiles = () => {
    // states for 3 different form files
    const [reportFile, setReportFile] = useState(null);
    const [presentationFile, setPresentationFile] = useState(null);
    const [codeFile, setCodeFile] = useState(null);
    
    // Upload statuses
    const [uploading, setUploading] = useState(false);
    
    const dispatch = useDispatch();
    const { project } = useSelector((state) => state.student);

    useEffect(() => {
        if (!project) {
            dispatch(getStudentDashboard());
        }
    }, [dispatch, project]);

    const handleUploadAll = async () => {
        setUploading(true);
        const uploads = [];
        
        if (reportFile) {
            const formData = new FormData();
            formData.append("file", reportFile);
            formData.append("fileType", "Report");
            uploads.push(dispatch(uploadProjectFile(formData)).then(res => { if(!res.error) setReportFile(null); }));
        }
        if (presentationFile) {
            const formData = new FormData();
            formData.append("file", presentationFile);
            formData.append("fileType", "Presentation");
            uploads.push(dispatch(uploadProjectFile(formData)).then(res => { if(!res.error) setPresentationFile(null); }));
        }
        if (codeFile) {
            const formData = new FormData();
            formData.append("file", codeFile);
            formData.append("fileType", "Code");
            uploads.push(dispatch(uploadProjectFile(formData)).then(res => { if(!res.error) setCodeFile(null); }));
        }
        
        await Promise.all(uploads);
        setUploading(false);
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
            a.download = originalFilename; // Force original name
            
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 500);
            
            toast.update(toastId, { render: "File downloaded successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to download file");
        }
    };

    const hasSelectedFiles = reportFile || presentationFile || codeFile;

    {/*get file icon function for manage icon size */}
   const getFileIcon = (type, size = "sm") => {
    const normalizedType = (type || "").toLowerCase();

    let Icon = FileText;

    if (normalizedType === "report") Icon = FileText;
    else if (normalizedType === "presentation") Icon = MonitorPlay;
    else if (normalizedType === "code") Icon = Archive;

    const isLarge = size === "lg";

    // ✅ TOP SECTION (NO BOX)
    if (isLarge) {
        return <Icon className="text-slate-600" size={32} />;
    }

    // ✅ TABLE / MOBILE (WITH BOX)
    return (
        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="text-slate-600" size={24} />
        </div>
    );
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Upload Top Section */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="text-center mb-10">
                    <h1 className="text-lg font-semibold text-slate-900">Upload Project Files</h1>
                    <p className="text-slate-500 mt-1 text-sm mb-8">Upload your project documents including reports, presentations, and code files.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Report Box */}
                    <div className="border border-slate-200 bg-white rounded-lg p-6 sm:p-7 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-50">
                        <div className="mb-3">
                            {getFileIcon("Report", "lg")}
                        </div>
                        <h3 className="font-semibold text-slate-800">Report</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4">Upload your project report (PDF, DOC)</p>
                        
                        <label className="bg-white border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm">
                            {reportFile ? reportFile.name : "Choose File"}
                            <input 
                                type="file" 
                                accept=".pdf,.doc,.docx"
                                className="hidden" 
                                onChange={(e) => setReportFile(e.target.files[0])}
                            />
                        </label>
                    </div>

                    {/* Presentation Box */}
                    <div className="border border-slate-200 bg-white rounded-lg p-6 sm:p-7 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-50">
                        <div className="mb-3">
                            {getFileIcon("Presentation", "lg")}
                        </div>
                        <h3 className="font-semibold text-slate-800">Presentation</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4">Upload your presentation (PPT, PPTX, PDF)</p>
                        
                        <label className="bg-white border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm">
                            {presentationFile ? presentationFile.name : "Choose File"}
                            <input 
                                type="file" 
                                accept=".ppt,.pptx,.pdf"
                                className="hidden" 
                                onChange={(e) => setPresentationFile(e.target.files[0])}
                            />
                        </label>
                    </div>

                    {/* Code Files Box */}
                    <div className="border border-slate-200 bg-white rounded-lg p-6 sm:p-7 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-50">
                       <div className="mb-3">
                            {getFileIcon("Code", "lg")}
                        </div>
                        <h3 className="font-semibold text-slate-800">Code Files</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4">Upload your source code (ZIP, RAR, TAR)</p>
                        
                        <label className="bg-white border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm">
                            {codeFile ? codeFile.name : "Choose File"}
                            <input 
                                type="file" 
                                accept=".zip,.rar,.tar,.tar.gz"
                                className="hidden" 
                                onChange={(e) => setCodeFile(e.target.files[0])}
                            />
                        </label>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-center sm:justify-end">
                    <button 
                        onClick={handleUploadAll}
                        disabled={!hasSelectedFiles || uploading} 
                        className={`bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors w-full sm:w-auto ${(!hasSelectedFiles || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? (
                            <>
                                <Loader size={18} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <UploadCloud size={18} />
                                Upload Selected Files
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Uploaded Files Section */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-sm">

                <div className="text-center mb-8">
                <h2 className="text-lg font-semibold text-slate-800">Uploaded Files</h2>
                <p className="text-slate-500 mt-1 text-sm mb-6">Manage your uploaded project files</p>
                </div>
                
                {project?.files && project.files.length > 0 ? (
                <>
                    {/* MOBILE VIEW */}
                    <div className="md:hidden space-y-3">
                        {project.files.map((f, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">

                                <div className="flex items-center gap-3 mb-3">
                                    {getFileIcon(f.type, "sm")}
                                    <span className="text-sm font-semibold text-slate-800 truncate">
                                        {f.filename}
                                    </span>
                                </div>

                                <div className="flex justify-between text-xs text-slate-500 mb-3">
                                    <span>{f.type}</span>
                                    <span>{new Date(f.uploadedAt).toLocaleDateString('en-GB')}</span>
                                </div>

                                <button
                                    onClick={() => handleDownload(f.url, f.filename)}
                                    className="w-full py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-slate-200">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 uppercase text-[11px] font-bold text-slate-500 tracking-wider">
                                    <th className="py-4 px-6 w-[50%]">File Name</th>
                                    <th className="py-4 px-6">Type</th>
                                    <th className="py-4 px-6">Date Uploaded</th>
                                    <th className="py-4 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody  className="divide-y divide-slate-100">
                                {[...project.files].sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).map((f, i) => (
                                    <tr key={i} className="hover:bg-slate-50/80 transition-all cursor-pointer">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                {getFileIcon(f.type)}
                                                <span className="font-semibold text-[13px] text-slate-800 truncate max-w-[200px] md:max-w-xs" title={f.filename}>{f.filename}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-[12px] font-bold text-slate-500 uppercase">{f.type || 'Report'}</span>
                                        </td>
                                        <td className="py-4 px-6 text-[13px] text-slate-500 font-medium">
                                            {new Date(f.uploadedAt).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {/* Process fetch to force download name cross-origin */}
                                            <button 
                                                onClick={() => handleDownload(f.url, f.filename)} 
                                                className="text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 text-[12px] font-semibold py-2 px-4 rounded-md transition-colors"
                                            >
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
                ) : (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl">
    
                    <div className="mb-3 opacity-40">
                        {getFileIcon("Report", "lg")}
                    </div>

                    <p className="text-slate-400 text-sm">
                        No files uploaded yet
                    </p>

                </div>
                )}
            </div>
        </div>
    );
};

export default UploadFiles;

