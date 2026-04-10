import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

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
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import { Loader } from "lucide-react";

const App = () => {

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Student Routes */}
          <Route index element={<StudentDashboard />} />
          <Route path="submit-proposal" element={<SubmitProposal />} />
          <Route path="upload-files" element={<UploadFiles />} />
          <Route path="supervisor" element={<SupervisorPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Teacher Routes */}
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="pending-requests" element={<PendingRequests />} />
          <Route path="assigned-students" element={<AssignedStudents />} />
          <Route path="teacher-files" element={<TeacherFiles />} />

          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="manage-students" element={<ManageStudents />} />
          <Route path="manage-teachers" element={<ManageTeachers />} />
          <Route path="assign-supervisor" element={<AssignSupervisor />} />
          <Route path="deadlines" element={<DeadlinesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>

        {/* Redirect to login if not authenticated */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
