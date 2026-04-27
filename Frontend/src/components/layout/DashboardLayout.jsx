import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useSelector } from "react-redux";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { authUser } = useSelector((state) => state.auth);

  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden pt-[66px]">
      {/* Navbar */}
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userRole={authUser?.role}
      />

      <div className="flex min-h-[calc(100vh-66px)]">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          userRole={authUser?.role}
        />

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            sidebarOpen ? "ml-0 lg:ml-64" : "ml-0 lg:ml-20"
          }`}
        >
          <div className={location.pathname.includes("conversations") ? "p-0" : "p-4 lg:p-6"}>
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;

