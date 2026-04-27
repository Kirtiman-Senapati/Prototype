import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useSelector } from "react-redux";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authUser } = useSelector((state) => state.auth);

  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => document.body.style.overflow = "auto";
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden pt-[66px]">
      {/* Navbar */}
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userRole={authUser?.role}
      />

      <div className="relative min-h-[calc(100vh-66px)] lg:flex">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          userRole={authUser?.role}
        />

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            sidebarOpen ? "lg:ml-64" : "lg:ml-20"
          }`}
        >
          <div className="p-6">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;

