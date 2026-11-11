
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Tags,
  Sparkles,
  Users,
  Settings,
  LogOut,
  Hotel,
  X,
} from "lucide-react";

const AdminSidebar = ({ isOpen, onClose, userRole = "ADMIN" }) => {
  const menuItems = [
    {
      name: "Overview",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Bookings",
      path: "/admin/bookings",
      icon: CalendarCheck,
    },
    {
      name: "Rooms",
      path: "/admin/rooms",
      icon: BedDouble,
    },
    {
      name: "Offers",
      path: "/admin/offers",
      icon: Tags,
    },
    {
      name: "Facilities",
      path: "/admin/facilities",
      icon: Sparkles,
    },
  ];

  if (userRole === "SUPER_ADMIN") {
    menuItems.push({
      name: "Admin Management",
      path: "/admin/management",
      icon: Users,
    });
  }

  return (
    <>
      {isOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`admin-sidebar ${isOpen ? "sidebar-open" : ""}`}
      >
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Hotel size={25} />
          </div>

          <div>
            <h2>SERENITY BAY</h2>
            <span>HOTEL & RESORT</span>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-divider" />

        <p className="sidebar-section-title">MAIN MENU</p>

        <nav className="sidebar-navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/admin/dashboard"}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/admin/settings"
            className="sidebar-link"
            onClick={onClose}
          >
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>

          <button
            className="sidebar-logout"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>

          <div className="sidebar-footer">
            <span>© 2026 Serenity Bay</span>
            <span>Luxury Administration</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
