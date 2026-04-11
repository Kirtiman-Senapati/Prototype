import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudentDashboard } from "../../store/slices/studentSlice";
import { BookOpen, User, Calendar, MessageSquare, Clock, Bell, Loader } from "lucide-react";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { project, notifications, isLoading } = useSelector((state) => state.student);
  const { authUser } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getStudentDashboard());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // Helpers
  const nextDeadlineTask = project?.tasks?.filter(t => t.status !== "Completed" && t.deadline).sort((a,b) => new Date(a.deadline) - new Date(b.deadline))[0];
  const nextDeadlineText = nextDeadlineTask ? new Date(nextDeadlineTask.deadline).toLocaleDateString() : "N/A";
  
  const recentFeedbackTask = project?.tasks?.filter(t => t.feedback).sort((a,b) => new Date(b.deadline || Date.now()) - new Date(a.deadline || Date.now()))[0];
  const recentFeedbackText = recentFeedbackTask ? recentFeedbackTask.feedback.substring(0, 30) + "..." : "No feedback yet";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-blue-600 rounded-xl p-6 md:p-8 text-white shadow-sm">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {authUser?.name}</h1>
                <p className="mt-2 text-blue-100">Here's your project overview and recent updates.</p>
            </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <BookOpen size={24} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Project Title</p>
            <p className="text-lg font-semibold text-slate-800 truncate">{project?.title || "No Project"}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600">
            <User size={24} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Supervisor</p>
            <p className="text-lg font-semibold text-slate-800 truncate">{project?.supervisor?.name || "N/A"}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <Calendar size={24} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Next Deadline</p>
            <p className="text-lg font-semibold text-slate-800 truncate">{nextDeadlineText}</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
            <MessageSquare size={24} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Recent Feedback</p>
            <p className="text-lg font-semibold text-slate-800 truncate">{recentFeedbackText}</p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Project Overview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Project Overview</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Title</p>
              <p className="font-medium text-slate-800 mt-1">{project?.title || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Description</p>
              <p className="text-sm text-slate-800 mt-1 line-clamp-3">{project?.description || "No description provided."}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                 project?.status === 'Approved' ? 'bg-green-100 text-green-800' :
                 project?.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                 project?.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                 'bg-yellow-100 text-yellow-800'
               }`}>
                 {project?.status || "Unknown"}
               </span>
            </div>
            <div>
              <p className="text-sm text-slate-500">Submission Deadline</p>
              <p className="text-sm text-slate-800 mt-1">N/A</p>
            </div>
          </div>
        </div>

        {/* Latest Feedback */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-800">Latest Feedback</h2>
            <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium hover:bg-blue-100 transition-colors">
              View All
            </button>
          </div>
          
          <div className="flex-1 flex flex-col">
            {project?.tasks && project.tasks.filter(t => t.feedback).length > 0 ? (
              <div className="space-y-4">
                {project.tasks.filter(t => t.feedback).map((task, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <MessageSquare size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{task.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{task.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                <MessageSquare size={32} className="mb-2 opacity-50 text-slate-300" />
                <p className="text-sm text-slate-400">No feedback available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Upcoming Deadlines</h2>
          <div className="flex-1 flex flex-col">
            {project?.tasks && project.tasks.filter(t => t.deadline && t.status !== "Completed").length > 0 ? (
              <div className="space-y-4">
                {project.tasks.filter(t => t.deadline && t.status !== "Completed").sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((task, i) => (
                   <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="bg-red-100 text-red-600 p-2 rounded-md">
                           <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{task.title}</p>
                          <p className="text-xs text-slate-500">{new Date(task.deadline).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <span className={`px-2 py-1 rounded text-xs font-medium ${task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>{task.status}</span>
                   </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                <Clock size={32} className="mb-2 opacity-50 text-slate-300" />
                <p className="text-sm text-slate-400">No upcoming deadlines yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Recent Notifications</h2>
          <div className="flex-1 flex flex-col">
            {notifications && notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notif, i) => (
                   <div key={i} className="flex gap-3 items-start border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                     <div className="bg-blue-50 text-blue-500 p-2 rounded-full shrink-0 mt-0.5">
                       <Bell size={14} />
                     </div>
                     <div>
                       <p className="text-sm text-slate-800">{notif.message}</p>
                       <p className="text-xs text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                     </div>
                   </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                <Bell size={32} className="mb-2 opacity-50 text-slate-300" />
                <p className="text-sm text-slate-400">No notifications yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
