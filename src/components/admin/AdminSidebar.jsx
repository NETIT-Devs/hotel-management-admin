import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Tags,
  TicketPercent,
  Sparkles,
  Image as ImageIcon,
  Users,
  Globe,
  LogOut,
  X,
} from "lucide-react";
import logoImg from "../../assets/logo.png";

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
      name: "Promo Codes",
      path: "/admin/promo-codes",
      icon: TicketPercent,
    },
    {
      name: "Facilities",
      path: "/admin/facilities",
      icon: Sparkles,
    },
    {
      name: "Gallery",
      path: "/admin/gallery",
      icon: ImageIcon,
    },
    {
      name: "Admin Management",
      path: "/admin/management",
      icon: Users,
    },
  ];

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
          <img
            src={logoImg}
            alt="Serenity Bay Logo"
            style={{
              height: "48px",
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />

          <div>
            <h2>SERENITY BAY</h2>
            <span>HOTEL &amp; RESORT</span>
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
          <a
            href={window.location.port === "5174" ? "http://localhost:5173/" : "/"}
            className="sidebar-link"
            onClick={onClose}
          >
            <Globe size={19} />
            <span>View Website</span>
          </a>

          <button
            className="sidebar-logout"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.dispatchEvent(new Event("authChange"));
              window.location.href = window.location.port === "5174" ? "/login" : "/auth";
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
