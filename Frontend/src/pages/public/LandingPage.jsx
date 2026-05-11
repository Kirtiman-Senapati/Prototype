import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { GraduationCap, ArrowRight, Clock, FileText, Users, AlertCircle, Building, CheckSquare, ChevronRight, Lock, Bell, Calendar } from "lucide-react";

const LandingPage = () => {
  const { authUser } = useSelector((state) => state.auth);

  if (authUser) {
    if (authUser.role === "Admin") return <Navigate to="/dashboard/admin" replace />;
    if (authUser.role === "Supervisor") return <Navigate to="/dashboard/teacher" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // Mock operational data for the landing page
  const notices = [
    { id: 1, title: "Final Year Project Synopsis Submission Deadline Extended", date: "15 Apr 2026", type: "Urgent" },
    { id: 2, title: "Supervisor Allotment Complete for 8th Sem CS", date: "10 Apr 2026", type: "Info" },
    { id: 3, title: "Phase 1 Review Schedule Published", date: "08 Apr 2026", type: "Schedule" },
    { id: 4, title: "Guidelines for Plagiarism Report Submission", date: "01 Apr 2026", type: "Academic" }
  ];

  const recentActivity = [
    { id: 1, action: "Phase 1 Approved", group: "Group 12", time: "2 hours ago" },
    { id: 2, action: "Synopsis Submitted", group: "Group 45", time: "4 hours ago" },
    { id: 3, action: "Task Assigned", group: "Dr. Sharma", time: "Yesterday" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-slate-200">

      {/* College Header/Navbar */}
      <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/mitm-logo.png" alt="MITM Logo" className="w-10 h-10 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <div style={{ display: 'none' }} className="w-10 h-10 bg-slate-900 rounded items-center justify-center">
              <GraduationCap className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">MAHARAJA INSTITUTE OF TECHNOLOGY</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Project Monitoring Portal</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="flex items-center gap-1.5"><Building size={14} /> Dept. of CSE</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> Academic Year 2025-26</span>
          </div>
        </div>
      </nav>

      {/* Main Portal Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (8 cols) - Operational Information */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Authentic Banner replacing Hero */}
          <div className="relative w-full h-[220px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm flex flex-col justify-end p-6 bg-[url('/mitm-building.jpg')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent"></div>
            <div className="relative z-10">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 mb-3">
                8th Semester Final Year
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Academic Project Monitoring System</h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Official centralized repository for tracking student project milestones, facilitating supervisor reviews, and managing final documentation submissions.
              </p>
            </div>
          </div>

          {/* Operational Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Projects</span>
              <span className="text-2xl font-extrabold text-slate-800">142</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Supervisors</span>
              <span className="text-2xl font-extrabold text-slate-800">28</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Groups</span>
              <span className="text-2xl font-extrabold text-slate-800">45</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Milestones Completed</span>
              <span className="text-2xl font-extrabold text-slate-800">89</span>
            </div>
          </div>

          {/* Department Circulars / Notice Board - Realistic Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                <Bell size={16} className="text-slate-500" />
                Department Circulars
              </h2>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white">
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-slate-50/70 transition-colors bg-white">
                      <td className="px-5 py-3 whitespace-nowrap text-xs font-medium text-slate-500">{notice.date}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${notice.type === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                            notice.type === 'Schedule' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          {notice.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-slate-700">{notice.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 text-right">
              <button className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">View All Notices &rarr;</button>
            </div>
          </div>

          {/* Academic Workflow Map */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5">
            <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-4">Standard Project Lifecycle</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="border border-slate-100 bg-slate-50 p-4 rounded-lg flex flex-col gap-2">
                <div className="w-6 h-6 rounded bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold mb-1">1</div>
                <h4 className="text-xs font-bold text-slate-800">Group Formation</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">Students form groups of 3-4 and submit initial domain preferences.</p>
              </div>
              <div className="border border-slate-100 bg-slate-50 p-4 rounded-lg flex flex-col gap-2">
                <div className="w-6 h-6 rounded bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold mb-1">2</div>
                <h4 className="text-xs font-bold text-slate-800">Synopsis Review</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">Faculty evaluates proposed methodology, tech stack, and scope.</p>
              </div>
              <div className="border border-slate-100 bg-slate-50 p-4 rounded-lg flex flex-col gap-2">
                <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mb-1">3</div>
                <h4 className="text-xs font-bold text-slate-800">Milestone Tracking</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">Continuous monitoring through structured dashboard tasks and deadlines.</p>
              </div>
              <div className="border border-slate-100 bg-slate-50 p-4 rounded-lg flex flex-col gap-2">
                <div className="w-6 h-6 rounded bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold mb-1">4</div>
                <h4 className="text-xs font-bold text-slate-800">Final Submission</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">Code repository, documentation, and demonstration approvals.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols) - Authentication & Activity */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Auth Widget */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <Lock size={16} className="text-slate-500" />
              <h2 className="text-[15px] font-bold text-slate-800">Portal Authentication</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-slate-500 leading-relaxed mb-2">
                Access is restricted to registered 8th-semester students, allotted supervisors, and department administrators.
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                Sign In to Workspace
              </Link>
              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-slate-100 flex-1"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                Register Student Group
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-5 flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Resources</h3>
            <a href="#" className="flex items-center justify-between p-3 rounded border border-slate-100 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2"><FileText size={14} className="text-slate-400" /> Formatting Guidelines</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 rounded border border-slate-100 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2"><CheckSquare size={14} className="text-slate-400" /> Approved Topics List</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#" className="flex items-center justify-between p-3 rounded border border-slate-100 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2"><Users size={14} className="text-slate-400" /> Faculty Directory</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
          </div>

          {/* Recent Public Activity Feed */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Portal Activity</h3>
            </div>
            <div className="p-5 flex flex-col gap-5">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300 shrink-0"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">{activity.action}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-slate-500">{activity.group}</span>
                      <span className="text-[8px] text-slate-300">&bull;</span>
                      <span className="text-[10px] text-slate-400">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white mt-8 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-medium">
            &copy; 2026 Maharaja Institute of Technology Mysore. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs font-medium text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">IT Support</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Administrator</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
