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

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Upload Top Section */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-sm">
                <h1 className="text-lg font-semibold text-slate-900">Upload Project Files</h1>
                <p className="text-slate-500 mt-1 text-sm mb-8">Upload your project documents including reports, presentations, and code files.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Report Box */}
                    <div className="border border-slate-200 bg-white rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-50">
                        <FileText size={32} className="text-slate-500 mb-3" />
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
                    <div className="border border-slate-200 bg-white rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-50">
                        <MonitorPlay size={32} className="text-slate-500 mb-3" />
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
                    <div className="border border-slate-200 bg-white rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-50">
                        <Archive size={32} className="text-slate-500 mb-3" />
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

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleUploadAll}
                        disabled={!hasSelectedFiles || uploading} 
                        className={`bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${(!hasSelectedFiles || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <h2 className="text-lg font-semibold text-slate-800">Uploaded Files</h2>
                <p className="text-slate-500 mt-1 text-sm mb-6">Manage your uploaded project files</p>
                
                {project?.files && project.files.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm font-medium text-slate-500">
                                    <th className="pb-3 pl-2 w-1/2">File Name</th>
                                    <th className="pb-3 w-1/4">Type</th>
                                    <th className="pb-3 w-1/4">Date Uploaded</th>
                                    <th className="pb-3 text-right pr-2">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...project.files].sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).map((f, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 pl-2">
                                            <div className="flex items-center gap-3">
                                                {f.type === 'Report' && <FileText size={18} className="text-blue-500 flex-shrink-0" />}
                                                {f.type === 'Presentation' && <MonitorPlay size={18} className="text-purple-500 flex-shrink-0" />}
                                                {f.type === 'Code' && <Archive size={18} className="text-amber-500 flex-shrink-0" />}
                                                <span className="font-medium text-sm text-slate-800 truncate block max-w-xs" title={f.filename}>{f.filename}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{f.type || 'Report'}</span>
                                        </td>
                                        <td className="py-4 text-sm text-slate-500">
                                            {new Date(f.uploadedAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 text-right pr-2">
                                            {/* Process fetch to force download name cross-origin */}
                                            <button 
                                                onClick={() => handleDownload(f.url, f.filename)} 
                                                className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
                                            >
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 mb-4">
                            <FileText size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">No files uploaded yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadFiles;

