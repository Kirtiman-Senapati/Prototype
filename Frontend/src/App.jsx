import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import CheckEmailPage from "./pages/auth/CheckEmailPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import InviteResponsePage from "./pages/common/InviteResponsePage";
// Dashboard Layouts
import DashboardLayout from "./components/layout/DashboardLayout";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import SubmitProposal from "./pages/student/SubmitProposal";
import UploadFiles from "./pages/student/UploadFiles";
import SupervisorPage from "./pages/student/SupervisorPage";
import FeedbackPage from "./pages/student/FeedbackPage";
import NotificationsPage from "./pages/student/NotificationsPage";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import PendingRequests from "./pages/teacher/PendingRequests";
import AssignedStudents from "./pages/teacher/AssignedStudents";
import TeacherFiles from "./pages/teacher/TeacherFiles";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import AssignSupervisor from "./pages/admin/AssignSupervisor";
import DeadlinesPage from "./pages/admin/DeadlinesPage";
import ProjectsPage from "./pages/admin/ProjectsPage";
import ConversationsPage from "./pages/common/ConversationsPage";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import { Loader } from "lucide-react";
import { checkAuth } from "./store/slices/authSlice";
import { connectSocket, disconnectSocket } from "./socket/socket";

const ProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useSelector((state) => state.auth);
  
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader className="animate-spin text-slate-900" size={32} />
      </div>
    );
  }
  
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const DashboardIndex = () => {
    const { authUser } = useSelector((state) => state.auth);
    if (authUser?.role === "Admin") return <Navigate to="/dashboard/admin" replace />;
    if (authUser?.role === "Supervisor") return <Navigate to="/dashboard/teacher" replace />;
    return <StudentDashboard />;
};

const App = () => {
  const dispatch = useDispatch();

  const { authUser } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (authUser) {
      connectSocket(authUser._id);
    } else {
      disconnectSocket();
    }
  }, [authUser]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/invite/respond" element={<InviteResponsePage />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            {/* Student Routes */}
            <Route index element={<DashboardIndex />} />
            <Route path="submit-proposal" element={<SubmitProposal />} />
            <Route path="upload-files" element={<UploadFiles />} />
            <Route path="supervisor" element={<SupervisorPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="conversations" element={<ConversationsPage />} />

            {/* Teacher Routes */}
            <Route path="teacher" element={<TeacherDashboard />} />
            <Route path="pending-requests" element={<PendingRequests />} />
            <Route path="assigned-students" element={<AssignedStudents />} />
            <Route path="teacher-files" element={<TeacherFiles />} />
            <Route path="conversations" element={<ConversationsPage />} />

            {/* Admin Routes */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="manage-students" element={<ManageStudents />} />
            <Route path="manage-teachers" element={<ManageTeachers />} />
            <Route path="assign-supervisor" element={<AssignSupervisor />} />
            <Route path="deadlines" element={<DeadlinesPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="conversations" element={<ConversationsPage />} />
          </Route>

          {/* Redirect to login if not authenticated */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default App;