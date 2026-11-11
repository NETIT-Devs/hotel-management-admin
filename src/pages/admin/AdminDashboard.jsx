
import { useState } from "react";
import { Menu } from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import DashboardOverview from "../../components/admin/DashboardOverview";
import "../../styles/adminDashboard.css";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get logged-in user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role || "ADMIN";

  return (
    <div className="admin-dashboard-layout">

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />

      <main className="admin-main-content">

        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={23} />
          </button>

          <div className="admin-welcome">
            <span>WELCOME BACK</span>
            <h1>Dashboard Overview</h1>
          </div>

          <div className="admin-profile">
            <div className="admin-profile-avatar">
              {user.fullName?.charAt(0) || "A"}
            </div>

            <div className="admin-profile-info">
              <strong>{user.fullName || "Hotel Admin"}</strong>
              <span>{userRole.replace("_", " ")}</span>
            </div>
          </div>
        </header>

        <DashboardOverview />

      </main>
    </div>
  );
};

export default AdminDashboard;
