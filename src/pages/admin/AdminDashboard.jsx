import { useState } from "react";
import { Menu } from "lucide-react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import DashboardOverview from "../../components/admin/DashboardOverview";
import BookingsManagement from "../../components/admin/BookingsManagement";
import OffersManagement from "../../components/admin/OffersManagement";
import PromoCodesManagement from "../../components/admin/PromoCodesManagement";
import RoomsManagement from "../../components/admin/RoomsManagement";
import AdminManagement from "../../components/admin/AdminManagement";
import FacilitiesManagement from "../../components/admin/FacilitiesManagement";
import GalleryManagement from "../../components/admin/GalleryManagement";
import "../../styles/adminDashboard.css";

const AdminDashboard = ({ activeSection = "overview" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get logged-in user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role || "ADMIN";

  const getPageTitle = () => {
    switch (activeSection) {
      case "bookings":
        return "Bookings & Reservations";
      case "offers":
        return "Special Offers Management";
      case "promo-codes":
        return "Promo Codes & Vouchers";
      case "rooms":
        return "Rooms & Suites Management";
      case "facilities":
        return "Facilities & Experiences";
      case "gallery":
        return "Resort Photo Gallery";
      case "management":
        return "Admin Management";
      default:
        return "Dashboard Overview";
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "bookings":
        return <BookingsManagement />;
      case "offers":
        return <OffersManagement />;
      case "promo-codes":
        return <PromoCodesManagement />;
      case "rooms":
        return <RoomsManagement />;
      case "facilities":
        return <FacilitiesManagement />;
      case "gallery":
        return <GalleryManagement />;
      case "management":
        return <AdminManagement />;
      default:
        return <DashboardOverview />;
    }
  };

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
            aria-label="Open sidebar menu"
          >
            <Menu size={23} />
          </button>

          <div className="admin-welcome">
            <span>WELCOME BACK</span>
            <h1>{getPageTitle()}</h1>
          </div>

          <div className="admin-profile">
            <div className="admin-profile-avatar">
              {user.fullName?.charAt(0) || user.full_name?.charAt(0) || "A"}
            </div>

            <div className="admin-profile-info">
              <strong>{user.fullName || user.full_name || "Hotel Admin"}</strong>
              <span>{userRole.replace("_", " ")}</span>
            </div>
          </div>
        </header>

        {renderSection()}
      </main>
    </div>
  );
};

export default AdminDashboard;
