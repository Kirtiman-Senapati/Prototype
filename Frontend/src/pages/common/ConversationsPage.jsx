import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getActivities, sendUnifiedMessage } from "../../store/slices/activitySlice";
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle, ChevronRight, Briefcase, Activity } from "lucide-react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../lib/axios";

const ConversationsPage = () => {
    const dispatch = useDispatch();
    const { activities, isLoading } = useSelector((state) => state.activity);
    const { authUser } = useSelector((state) => state.auth);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [tag, setTag] = useState("Progress");
    const [isSending, setIsSending] = useState(false);
    const [dbProjects, setDbProjects] = useState([]);
    const bottomRef = useRef(null);

    useEffect(() => {
        const fetchProjs = async () => {
            try {
                const res = await axiosInstance.get("/projects/my");
                if (res.data.success) {
                    setDbProjects(res.data.projects);
                }
            } catch (err) {
                console.error("Failed to load projects", err);
            }
        };
        fetchProjs();
    }, []);

    useEffect(() => {
        dispatch(getActivities());
    }, [dispatch]);

    // Format Messages
    const messageActivities = activities?.filter(a => ['STUDENT_MESSAGE', 'SUPERVISOR_MESSAGE', 'ADMIN_MESSAGE'].includes(a.actionType)) || [];
    
    // Group by Project
    const projectsMap = {};
    
    // Seed with all available user projects first
    dbProjects.forEach(proj => {
        projectsMap[proj._id] = {
            _id: proj._id,
            title: proj.title,
            messages: []
        };
    });

    // Populate with messages
    messageActivities.forEach(msg => {
        if (!msg.relatedProject) return;
        const pId = msg.relatedProject._id || msg.relatedProject;
        if (!projectsMap[pId]) {
            projectsMap[pId] = {
                _id: pId,
                title: msg.relatedProject.title || "Unknown Project",
                messages: []
            };
        }
        projectsMap[pId].messages.push(msg);
    });

    const projectList = Object.values(projectsMap);
    
    // Ensure chronological order
    projectList.forEach(p => {
        p.messages.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    });

    // Auto-select first project
    useEffect(() => {
        if (!selectedProjectId && projectList.length > 0) {
            setSelectedProjectId(projectList[0]._id);
        }
    }, [projectList, selectedProjectId]);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [selectedProjectId, activities]);

    const activeProject = projectsMap[selectedProjectId];

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedProjectId) return;

        setIsSending(true);
        try {
            await dispatch(sendUnifiedMessage({
                projectId: selectedProjectId,
                title: "Direct Reply",
                message: messageInput,
                tag
            })).unwrap();
            
            setMessageInput("");
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    const renderMessageBody = (text) => {
        if (!text) return null;
        let displayStr = text;
        
        // Remove standard "**Actor**: *Title* - " prefix added by backend logger purely for chat UI aesthetics
        const parts = text.split(" - ");
        if (parts.length > 1 && parts[0].includes("**")) {
            displayStr = parts.slice(1).join(" - ");
        }

        return displayStr;
    };

    return (
        <div className="max-w-7xl mx-auto h-[85vh] bg-white border border-slate-200 rounded-3xl shadow-sm flex overflow-hidden">
            {/* Sidebar (Projects) */}
            <div className="w-1/3 md:w-1/4 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-5 border-b border-slate-200 bg-white">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        <MessageSquare size={20} className="text-blue-600" /> Conversations
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {projectList.length === 0 ? (
                        <div className="text-center text-sm font-bold text-slate-400 mt-10">No active conversations.</div>
                    ) : (
                        projectList.map(proj => (
                            <button
                                key={proj._id}
                                onClick={() => setSelectedProjectId(proj._id)}
                                className={`w-full text-left p-4 rounded-xl transition-all border ${
                                    selectedProjectId === proj._id 
                                    ? 'bg-blue-600 text-white shadow-md border-blue-600' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-sm'
                                }`}
                            >
                                <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${selectedProjectId === proj._id ? 'text-blue-200' : 'text-slate-400'}`}>Project Thread</p>
                                <p className="font-bold line-clamp-1 leading-snug">{proj.title}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50 relative">
                {activeProject ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-[72px] bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <Briefcase size={18} className="text-slate-400" /> {activeProject.title}
                                </h3>
                            </div>
                        </div>

                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                            {activeProject.messages.map((msg, i) => {
                                const isMe = msg.actor?._id === authUser?._id;
                                return (
                                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1.5 px-1">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                {isMe ? "You sent update" : `${msg.actor?.name || 'User'} sent update`}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                                <Clock size={10} />
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`max-w-[75%] p-4 shadow-sm relative ${
                                            isMe 
                                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'
                                        }`}>
                                            <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{renderMessageBody(msg.message)}</p>
                                            
                                            {/* Tag Visual Indicator */}
                                            {msg.tag && (
                                                <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                                    msg.tag === 'Completed' ? 'bg-emerald-500/20 text-emerald-100' :
                                                    msg.tag === 'Issue' || msg.tag === 'Blocked' ? 'bg-rose-500/20 text-rose-100' :
                                                    'bg-white/20 text-blue-50'
                                                } ${!isMe && (
                                                    msg.tag === 'Completed' ? '!bg-emerald-100 !text-emerald-700' :
                                                    msg.tag === 'Issue' || msg.tag === 'Blocked' ? '!bg-rose-100 !text-rose-700' :
                                                    '!bg-slate-100 !text-slate-600'
                                                )}`}>
                                                    {msg.tag === 'Completed' ? <CheckCircle size={10} /> :
                                                     msg.tag === 'Issue' || msg.tag === 'Blocked' ? <AlertCircle size={10} /> :
                                                     <Activity size={10} />}
                                                    {msg.tag}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-white p-4 border-t border-slate-200 shrink-0">
                            <form onSubmit={handleSendMessage} className="flex gap-3">
                                <select
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-3 outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="Progress">Progress</option>
                                    <option value="Issue">Issue / Blocked</option>
                                    <option value="Completed">Completed</option>
                                </select>
                                <input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 flex items-center focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim() || isSending}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <MessageSquare size={48} className="opacity-20 mb-4" />
                        <p className="font-bold">Select a project to view conversations</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationsPage;
