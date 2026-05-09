import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAssignedStudents } from "../../store/slices/teacherSlice";
import { FileText, MonitorPlay, Archive, LayoutGrid, List, Search, Download, Loader } from "lucide-react";
import { toast } from "../../utils/toast";
import useAutoRefresh from "../../hooks/useAutoRefresh";

const TeacherFiles = () => {
    const dispatch = useDispatch();
    const { assignedStudents, isLoading } = useSelector((state) => state.teacher);

    const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
    const [filterType, setFilterType] = useState("All"); // 'All', 'Report', 'Presentation', 'Code'
    const [searchQuery, setSearchQuery] = useState("");

    const { authUser } = useSelector((state) => state.auth);

    // Fetch students if missing
    useEffect(() => {
        if (!assignedStudents || assignedStudents.length === 0) {
            dispatch(getAssignedStudents());
        }
    }, [dispatch, assignedStudents]);

    useAutoRefresh(() => {
        dispatch(getAssignedStudents());
    });

    // Consolidate all files from all students
    const allFiles = useMemo(() => {
        const files = [];
        if (assignedStudents && assignedStudents.length > 0) {
            assignedStudents.forEach(student => {
                if (student.project && student.project.files) {
                    student.project.files.forEach(file => {
                        let uploaderName = student.name;
                        if (file.uploadedBy && file.uploadedBy.toString() !== student._id.toString()) {
                            const member = student.project.members?.find(m => m._id.toString() === file.uploadedBy.toString());
                            if (member) uploaderName = member.name;
                        }
                        
                        files.push({
                            ...file,
                            studentName: uploaderName,
                            groupName: student.project.groupName,
                            studentId: student._id
                        });
                    });
                }
            });
        }
        // sort by newest
        return files.sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    }, [assignedStudents]);

    // Calculate Stats
    const stats = useMemo(() => {
        const counts = { total: allFiles.length, reports: 0, presentations: 0, code: 0 };
        allFiles.forEach(file => {
            if (file.type === 'Report') counts.reports++;
            if (file.type === 'Presentation') counts.presentations++;
            if (file.type === 'Code') counts.code++;
        });
        return counts;
    }, [allFiles]);

    // Apply Filters
    const filteredFiles = useMemo(() => {
        return allFiles.filter(file => {
            const matchesType = filterType === "All" || file.type === filterType;
            const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  file.studentName.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [allFiles, filterType, searchQuery]);

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

    const getFileIcon = (type, className = "") => {
    let Icon = FileText; // default fallback

    if (type === "Report") Icon = FileText;
    else if (type === "Presentation") Icon = MonitorPlay;
    else if (type === "Code") Icon = Archive;

    return (
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <Icon className={`text-slate-600 ${className}`} />
        </div>
    );
};

    return (
        <div className="space-y-8 pb-10">
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                
                {/* Header Sequence Exactly as Mockup */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Student Files</h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-2 md:mt-0">Manage files shared with and received from students</p>
                </div>

                {/* Filters and View Toggles changes  for mobile view */}
                 <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-4">
                     <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto flex-1">
                         <div className="relative w-full sm:w-56">
                             <select 
                                value={filterType} 
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 ring-slate-200 focus:border-slate-300 focus:border-blue-500 text-sm transition-shadow"
                             >
                                 <option value="All">All Files</option>
                                 <option value="Report">Reports</option>
                                 <option value="Presentation">Presentations</option>
                                 <option value="Code">Code Files</option>
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                 <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                             </div>
                         </div>
                         <div className="relative w-full sm:w-96">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                 <Search size={18} className="text-slate-400"/>
                             </div>
                             <input 
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 text-sm text-slate-700 transition-shadow"
                             />
                         </div>
                     </div>


                     {/* Grid  and list toggle buttons changes for mobile view */}

                     <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0 w-fit self-start xl:self-auto">
                         <button 
                            onClick={() => setViewMode("grid")}
                            className={`p-2.5 sm:p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                            title="Grid View"
                         >
                             <LayoutGrid size={18} />
                         </button>
                         <button 
                            onClick={() => setViewMode("list")}
                            className={`p-2.5 sm:p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                            title="List View"
                         >
                             <List size={18} />
                         </button>
                     </div>
                 </div>

                 {/* Metric Cards - 4 items natively mapping enum */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6 pb-6">

                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-1.5 min-h-[90px] transition-all duration-200 hover:border-slate-300 bg-white transition-colors">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Total Files</span>
                        <span className="text-lg font-semibold text-slate-900">{stats.total}</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-1.5 min-h-[90px] transition-all duration-200 hover:border-slate-300 bg-white transition-colors">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Reports</span>
                        <span className="text-lg font-semibold text-slate-900">{stats.reports}</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-1.5 min-h-[90px] transition-all duration-200 hover:border-slate-300 bg-white transition-colors">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Presentations</span>
                        <span className="text-lg font-semibold text-slate-900">{stats.presentations}</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-1.5 min-h-[90px] transition-all duration-200 hover:border-slate-300 bg-white transition-colors">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Code Files</span>
                        <span className="text-lg font-semibold text-slate-900">{stats.code}</span>
                    </div>

                </div>

                 <div className="border-t border-slate-100 pt-8 -mx-6 px-6 md:-mx-8 md:px-8 bg-slate-50/30 rounded-b-xl min-h-[400px]">
                 {isLoading && allFiles.length === 0 ? (
                      <div className="flex justify-center py-20 mt-10">
                          <Loader className="animate-spin text-slate-400" size={36} />
                      </div>
                 ) : filteredFiles.length === 0 ? (
                      <div className="text-center py-24 px-4 bg-white border border-dashed border-slate-200 rounded-xl max-w-2xl mx-auto">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Archive className="text-slate-300" size={32} />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">No files found</h3>
                          <p className="text-slate-500 text-sm">There are no files matching your filters right now.</p>
                      </div>

                      //* Changes for Mobile Responsive View/
                ) : viewMode === "list" ? (

                    <>
                        {/* MOBILE LIST (CARD VIEW) */}
                        <div className="md:hidden space-y-3">
                            {filteredFiles.map((file, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4">

                                    {/* TOP */}
                                    <div className="flex items-center gap-3 mb-3">
                                        {getFileIcon(file.type)}
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-800 truncate">
                                                {file.filename}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {file.studentName} {file.groupName && <span className="font-medium text-[10px] bg-slate-100 px-1 py-0.5 rounded ml-1">({file.groupName})</span>}
                                            </span>
                                        </div>
                                    </div>

                                    {/* META */}
                                    <div className="flex justify-between text-xs text-slate-500 mb-3">
                                        <span className="uppercase">{file.type}</span>
                                        <span>{new Date(file.uploadedAt).toLocaleDateString('en-GB')}</span>
                                    </div>

                                    {/* BUTTON */}
                                    <button
                                        onClick={() => handleDownload(file.url, file.filename)}
                                        className="w-full py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                                    >
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/*  DESKTOP TABLE */}
                        <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-slate-200">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50 uppercase text-[11px] font-bold text-slate-500 tracking-wider">
                                        <th className="py-4 px-6 w-[35%]">File Name</th>
                                        <th className="py-4 px-6">Student</th>
                                        <th className="py-4 px-6">Type</th>
                                        <th className="py-4 px-6">Upload Date</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredFiles.map((file, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-all cursor-pointer">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    {getFileIcon(file.type)}
                                                    <span className="font-semibold text-[13px] text-slate-800 truncate max-w-[200px] md:max-w-xs">
                                                        {file.filename}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6 text-[13px] text-slate-600 font-medium">
                                                <div className="flex flex-col">
                                                    <span>{file.studentName}</span>
                                                    {file.groupName && <span className="text-[10px] text-slate-400 font-bold">{file.groupName}</span>}
                                                </div>
                                            </td>

                                            <td className="py-4 px-6">
                                                <span className="text-[12px] font-bold text-slate-500 uppercase">
                                                    {file.type}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-[13px] text-slate-500 font-medium">
                                                {new Date(file.uploadedAt).toLocaleDateString('en-GB')}
                                            </td>

                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleDownload(file.url, file.filename)}
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
                     /* GRID VIEW EXACT TO MOCKUP */
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {filteredFiles.map((file, idx) => (
                             <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col hover:border-slate-300 bg-white transition-all">
                                 <div className="flex justify-center mb-4">
                                     {getFileIcon(file.type, "w-10 h-10")}
                                 </div>
                                 <h3 className="text-center font-bold text-slate-800 text-[13px] mb-1 truncate px-2" title={file.filename}>
                                     {file.filename.split('.').slice(0, -1).join('.')}
                                 </h3>
                                 <p className="text-center text-slate-500 text-[12px] mb-4 flex flex-col items-center">
                                     <span>{file.studentName}</span>
                                     {file.groupName && <span className="text-[10px] text-slate-400 font-bold mt-0.5 bg-slate-50 px-1.5 py-0.5 rounded">{file.groupName}</span>}
                                 </p>
                                 
                                 <div className="flex items-center justify-center gap-3 mb-5 text-[11px] text-slate-400 font-medium">
                                     <span>-</span>
                                     <span>{new Date(file.uploadedAt).toLocaleDateString('en-GB')}</span>
                                     <span>-</span>
                                 </div>

                                 <div className="mt-auto">
                                     <button 
                                         onClick={() => handleDownload(file.url, file.filename)}
                                         className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-all"
                                     >
                                         <Download size={16} />
                                         Download
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
                 </div>
            </div>
        </div>
    );
};

export default TeacherFiles;
