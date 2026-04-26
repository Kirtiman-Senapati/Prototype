import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getActivities, sendUnifiedMessage, addRealtimeActivity } from "../../store/slices/activitySlice";
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle, ChevronRight, Briefcase, Activity } from "lucide-react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../lib/axios";
import { socket } from "../../socket/socket";

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

    // Real-time listener for incoming messages
    useEffect(() => {
        const handleNewActivity = (activity) => {
            if (['STUDENT_MESSAGE', 'SUPERVISOR_MESSAGE', 'ADMIN_MESSAGE'].includes(activity.actionType)) {
                dispatch(addRealtimeActivity(activity));
                scrollToBottom();
            }
        };

        socket.on("newActivity", handleNewActivity);
        
        return () => {
            socket.off("newActivity", handleNewActivity);
        };
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
            
            // Instantly refresh messages to show the newly sent one
            await dispatch(getActivities());
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
        <div className="max-w-6xl mx-auto h-[85vh] bg-white border border-slate-200 rounded-xl shadow-sm flex overflow-hidden">
            {/* Sidebar (Projects) - 30% */}
            <div className="w-[30%] bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                        Conversations
                    </h2>
                    {/* Search Input Mock */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search conversations..." 
                            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200 transition-shadow placeholder-slate-400"
                        />
                        <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
                    {projectList.length === 0 ? (
                        <div className="text-center text-xs font-medium text-slate-400 mt-10">No active conversations.</div>
                    ) : (
                        projectList.map(proj => {
                            const lastMsg = proj.messages[proj.messages.length - 1];
                            const isSelected = selectedProjectId === proj._id;
                            return (
                                <button
                                    key={proj._id}
                                    onClick={() => setSelectedProjectId(proj._id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors flex flex-col gap-1 ${
                                        isSelected 
                                        ? 'bg-white shadow-sm border border-slate-200' 
                                        : 'border border-transparent hover:bg-slate-100/50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <p className={`text-[13px] font-semibold truncate pr-2 ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{proj.title}</p>
                                        {lastMsg && (
                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-0.5">
                                                {new Date(lastMsg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-1">
                                        {lastMsg ? renderMessageBody(lastMsg.message) : 'No messages yet'}
                                    </p>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area - 70% */}
            <div className="flex-1 flex flex-col bg-white relative">
                {activeProject ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-[60px] border-b border-slate-100 flex items-center px-6 justify-between shrink-0 z-10 bg-white">
                            <div>
                                <h3 className="font-semibold text-slate-800 text-[15px]">
                                    {activeProject.title}
                                </h3>
                            </div>
                        </div>

                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                            {activeProject.messages.map((msg, i) => {
                                const isMe = msg.actor?._id === authUser?._id;
                                return (
                                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span className="text-[11px] font-medium text-slate-500">
                                                {isMe ? "You" : (msg.actor?.name || 'System')}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`max-w-[70%] px-4 py-2.5 relative ${
                                            isMe 
                                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                                            : 'bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm'
                                        }`}>
                                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{renderMessageBody(msg.message)}</p>
                                            
                                            {/* Tag Visual Indicator */}
                                            {msg.tag && (
                                                <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                                                    msg.tag === 'Completed' ? 'bg-emerald-500/20 text-emerald-100' :
                                                    msg.tag === 'Issue' || msg.tag === 'Blocked' ? 'bg-rose-500/20 text-rose-100' :
                                                    'bg-white/20 text-blue-50'
                                                } ${!isMe && (
                                                    msg.tag === 'Completed' ? '!bg-emerald-200/50 !text-emerald-700' :
                                                    msg.tag === 'Issue' || msg.tag === 'Blocked' ? '!bg-rose-200/50 !text-rose-700' :
                                                    '!bg-slate-200 !text-slate-600'
                                                )}`}>
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
                        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl focus-within:border-slate-300 focus-within:bg-white transition-colors">
                                <div className="flex-1 flex flex-col">
                                    <div className="px-2 pt-1 pb-2">
                                        <select
                                            value={tag}
                                            onChange={(e) => setTag(e.target.value)}
                                            className="bg-transparent text-slate-500 text-xs font-medium outline-none cursor-pointer"
                                        >
                                            <option value="Progress">Progress Update</option>
                                            <option value="Issue">Issue / Blocked</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    <textarea
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Write a message..."
                                        rows={1}
                                        className="w-full bg-transparent px-2 pb-1 text-[13px] focus:outline-none resize-none placeholder-slate-400 text-slate-700"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim() || isSending}
                                    className="p-2 mb-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                                >
                                    <Send size={16} strokeWidth={2} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <MessageSquare size={32} strokeWidth={1.5} className="mb-4 text-slate-300" />
                        <p className="text-[13px] font-medium text-slate-500">Select a conversation to view messages</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationsPage;
