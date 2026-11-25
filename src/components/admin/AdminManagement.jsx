import { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Power,
  X,
  AlertCircle,
  Search,
  Eye,
  LayoutGrid,
  List,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Crown,
} from "lucide-react";
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  toggleAdminStatus,
  deleteAdmin,
} from "../../services/adminManagementService";

const ROLE_FILTERS = [
  { key: "ALL", label: "All Staff" },
  { key: "SUPER_ADMIN", label: "Super Admins" },
  { key: "ADMIN", label: "Hotel Admins" },
  { key: "ACTIVE", label: "Active Only" },
  { key: "INACTIVE", label: "Inactive" },
];

const formatAdminCode = (id) => `#ADM-${String(id || 0).padStart(3, "0")}`;

const formatDateShort = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [viewAdmin, setViewAdmin] = useState(null);

  // Current logged-in user role
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const initialForm = {
    full_name: "",
    email: "",
    phone: "",
    password: "",
    is_active: 1,
  };
  const [formData, setFormData] = useState(initialForm);

  const loadAdmins = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllAdmins();
      setAdmins(data);
    } catch (err) {
      setError(err.message || "Failed to load admin accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const active = Number(a.is_active) === 1;
      const matchesFilter =
        roleFilter === "ALL" ||
        (roleFilter === "ACTIVE"
          ? active
          : roleFilter === "INACTIVE"
          ? !active
          : a.role === roleFilter);

      const term = searchTerm.trim().toLowerCase();
      if (!term) return matchesFilter;

      return (
        matchesFilter &&
        (a.full_name?.toLowerCase().includes(term) ||
          a.email?.toLowerCase().includes(term) ||
          a.phone?.toLowerCase().includes(term) ||
          a.role?.toLowerCase().includes(term))
      );
    });
  }, [admins, roleFilter, searchTerm]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData(initialForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (admin) => {
    setModalMode("edit");
    setSelectedAdmin(admin);
    setFormData({
      full_name: admin.full_name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: "",
      is_active: Number(admin.is_active) ? 1 : 0,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      if (modalMode === "create") {
        await createAdmin({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          is_active: Number(formData.is_active),
        });
      } else {
        await updateAdmin(selectedAdmin.id, {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || undefined,
          is_active: Number(formData.is_active),
        });
      }
      setIsModalOpen(false);
      await loadAdmins();
    } catch (err) {
      setFormError(err.message || "Failed to save admin account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      await toggleAdminStatus(admin.id, Number(admin.is_active) ? 0 : 1);
      await loadAdmins();
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteAdmin(deleteId);
      setDeleteId(null);
      await loadAdmins();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const totalStaff = admins.length;
  const superAdminCount = admins.filter((a) => a.role === "SUPER_ADMIN").length;
  const activeAdmins = admins.filter((a) => Number(a.is_active) === 1).length;
  const inactiveAdmins = admins.filter((a) => Number(a.is_active) === 0).length;

  const getFilterCount = (key) => {
    if (key === "ALL") return admins.length;
    if (key === "ACTIVE")
      return admins.filter((a) => Number(a.is_active) === 1).length;
    if (key === "INACTIVE")
      return admins.filter((a) => Number(a.is_active) === 0).length;
    return admins.filter((a) => a.role === key).length;
  };

  return (
    <div
      className="admin-management-view"
      style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* 1. Executive KPI Summary Cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
          gap: "16px",
        }}
      >
        {[
          {
            label: "Total Staff Accounts",
            value: totalStaff,
            sub: "Authorized management users",
            icon: Users,
            iconBg: "rgba(6, 59, 50, 0.1)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Super Administrators",
            value: superAdminCount,
            sub: "Full system control",
            icon: Crown,
            iconBg: "rgba(201, 162, 75, 0.2)",
            iconColor: "#8A6414",
            accent: "#C9A24B",
          },
          {
            label: "Active Accounts",
            value: activeAdmins,
            sub: "Currently enabled",
            icon: CheckCircle2,
            iconBg: "rgba(6, 59, 50, 0.12)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Deactivated Accounts",
            value: inactiveAdmins,
            sub: "Suspended access",
            icon: Power,
            iconBg: "#F9E5E2",
            iconColor: "#9E3D30",
            accent: "#9E3D30",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className="dashboard-card"
              style={{
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                borderTop: `3px solid ${stat.accent}`,
              }}
            >
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-muted)",
                    marginBottom: "4px",
                  }}
                >
                  {stat.label}
                </span>
                <strong
                  style={{
                    display: "block",
                    fontFamily: "Playfair Display, serif",
                    fontSize: "28px",
                    color: "#061C2B",
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </strong>
                <small style={{ fontSize: "11px", color: "var(--color-muted)" }}>
                  {stat.sub}
                </small>
              </div>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "14px",
                  background: stat.iconBg,
                  color: stat.iconColor,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={22} />
              </div>
            </article>
          );
        })}
      </section>

      {/* 2. Top Header, View Switcher, Role Filters & Search */}
      <section className="dashboard-card" style={{ padding: "22px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "nowrap",
            gap: "16px",
            paddingBottom: "18px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <span className="panel-eyebrow">SECURITY &amp; ACCESS CONTROL</span>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "22px",
                color: "#061C2B",
                margin: "2px 0 4px",
              }}
            >
              Administrator Access Management
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)" }}>
              {isSuperAdmin
                ? "Create, update, activate/deactivate, or remove hotel administrator accounts."
                : "View hotel administrator directory (Super Admin required to modify accounts)."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                background: "#F7F3E8",
                padding: "4px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("table")}
                style={{
                  border: "none",
                  background: viewMode === "table" ? "#063B32" : "transparent",
                  color: viewMode === "table" ? "#C9A24B" : "#5B6964",
                  padding: "6px 12px",
                  borderRadius: "7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <List size={14} /> Executive List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                style={{
                  border: "none",
                  background: viewMode === "cards" ? "#063B32" : "transparent",
                  color: viewMode === "cards" ? "#C9A24B" : "#5B6964",
                  padding: "6px 12px",
                  borderRadius: "7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <LayoutGrid size={14} /> Staff Cards
              </button>
            </div>

            <button
              type="button"
              onClick={loadAdmins}
              style={{
                background: "#F7F3E8",
                color: "#061C2B",
                border: "1px solid var(--color-border)",
                padding: "10px 14px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleOpenCreate}
                style={{
                  background: "linear-gradient(135deg, #C9A24B, #b58d35)",
                  color: "#061C2B",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 6px 16px rgba(201, 162, 75, 0.28)",
                }}
              >
                <UserPlus size={16} /> Add New Admin
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
            marginTop: "18px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {ROLE_FILTERS.map((tab) => {
              const active = roleFilter === tab.key;
              const count = getFilterCount(tab.key);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRoleFilter(tab.key)}
                  style={{
                    border: "1px solid",
                    borderColor: active ? "#063B32" : "var(--color-border)",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: active ? "#063B32" : "#F7F3E8",
                    color: active ? "#C9A24B" : "#061C2B",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "1px 7px",
                      borderRadius: "999px",
                      background: active ? "#C9A24B" : "#FFFFFF",
                      color: "#061C2B",
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#F7F3E8",
              padding: "9px 14px",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              minWidth: "280px",
              flex: "0 1 340px",
            }}
          >
            <Search size={16} color="#5B6964" />
            <input
              type="text"
              placeholder="Search administrators by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13px",
                width: "100%",
                color: "#061C2B",
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#5B6964",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Administrators List / Cards */}
      {loading ? (
        <div
          className="dashboard-card"
          style={{ padding: "48px", textAlign: "center", color: "var(--color-muted)" }}
        >
          Loading administrator directory...
        </div>
      ) : error ? (
        <div
          className="dashboard-card"
          style={{ padding: "36px", textAlign: "center", color: "#9E3D30" }}
        >
          <AlertCircle size={24} style={{ marginBottom: "8px" }} />
          <p>{error}</p>
          <button className="dashboard-btn-primary" onClick={loadAdmins}>
            Retry
          </button>
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div
          className="dashboard-card"
          style={{ padding: "48px", textAlign: "center", color: "var(--color-muted)" }}
        >
          No administrator accounts match your current filter.
        </div>
      ) : viewMode === "table" ? (
        <section className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ padding: "15px 22px" }}>Administrator &amp; Email</th>
                  <th style={{ padding: "15px 16px" }}>Access Role</th>
                  <th style={{ padding: "15px 16px" }}>Contact Phone</th>
                  <th style={{ padding: "15px 16px" }}>Joined Date</th>
                  <th style={{ padding: "15px 16px" }}>Account Status</th>
                  <th style={{ padding: "15px 22px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => {
                  const isSuper = admin.role === "SUPER_ADMIN";
                  const active = Number(admin.is_active) === 1;
                  const initials = (admin.full_name || "A")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={admin.id}>
                      {/* Administrator Name, Avatar & Email */}
                      <td style={{ padding: "16px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "12px",
                              background: isSuper
                                ? "linear-gradient(135deg, #C9A24B, #9A7420)"
                                : "linear-gradient(135deg, #063B32, #061C2B)",
                              color: isSuper ? "#061C2B" : "#C9A24B",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 800,
                              fontSize: "13px",
                              flexShrink: 0,
                              border: "1px solid rgba(201,162,75,0.45)",
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "2px",
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: "#061C2B",
                                }}
                              >
                                {admin.full_name}
                              </strong>
                              <span className="booking-id-badge">
                                {formatAdminCode(admin.id)}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "11.5px",
                                color: "#5B6964",
                                display: "block",
                              }}
                            >
                              {admin.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "5px 11px",
                            borderRadius: "999px",
                            fontSize: "10.5px",
                            fontWeight: 800,
                            letterSpacing: "0.5px",
                            background: isSuper
                              ? "rgba(201, 162, 75, 0.22)"
                              : "rgba(6, 59, 50, 0.1)",
                            color: isSuper ? "#8A6414" : "#063B32",
                            border: isSuper
                              ? "1px solid rgba(201, 162, 75, 0.45)"
                              : "1px solid rgba(6, 59, 50, 0.2)",
                          }}
                        >
                          {isSuper ? <Crown size={12} /> : <ShieldCheck size={12} />}
                          {admin.role.replace("_", " ")}
                        </span>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "#061C2B",
                          }}
                        >
                          <Phone size={13} color="#C9A24B" />
                          {admin.phone || "Not provided"}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "#061C2B",
                          }}
                        >
                          <Calendar size={13} color="#063B32" />
                          {formatDateShort(admin.created_at)}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px" }}>
                        <span
                          className={
                            active
                              ? "dashboard-status dashboard-status-approved"
                              : "dashboard-status dashboard-status-rejected"
                          }
                        >
                          {active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 22px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setViewAdmin(admin)}
                            className="table-action-btn btn-view"
                            title="View Profile"
                          >
                            <Eye size={13} /> View
                          </button>

                          {isSuperAdmin && !isSuper && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleActive(admin)}
                                className="table-action-btn btn-view"
                                title={
                                  active ? "Deactivate Account" : "Activate Account"
                                }
                              >
                                <Power size={13} />
                                <span>{active ? "Deactivate" : "Activate"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(admin)}
                                className="table-action-btn btn-approve"
                                title="Edit Admin"
                              >
                                <Edit2 size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(admin.id)}
                                className="table-action-btn btn-reject"
                                title="Delete Admin"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}

                          {isSuper && (
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 700,
                                color: "#8A6414",
                                background: "#F7F3E8",
                                padding: "5px 10px",
                                borderRadius: "8px",
                                border: "1px solid var(--color-border)",
                              }}
                            >
                              Protected Root
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* Staff Cards View */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredAdmins.map((admin) => {
            const isSuper = admin.role === "SUPER_ADMIN";
            const active = Number(admin.is_active) === 1;
            const initials = (admin.full_name || "A")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <article
                key={admin.id}
                className="dashboard-card"
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  borderTop: `3px solid ${isSuper ? "#C9A24B" : "#063B32"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: isSuper
                          ? "linear-gradient(135deg, #C9A24B, #9A7420)"
                          : "linear-gradient(135deg, #063B32, #061C2B)",
                        color: isSuper ? "#061C2B" : "#C9A24B",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: "15px",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <span className="booking-id-badge">
                        {formatAdminCode(admin.id)}
                      </span>
                      <h4
                        style={{
                          margin: "4px 0 2px",
                          fontFamily: "Playfair Display, serif",
                          fontSize: "18px",
                          color: "#061C2B",
                        }}
                      >
                        {admin.full_name}
                      </h4>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: isSuper ? "#8A6414" : "#063B32",
                        }}
                      >
                        {admin.role.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <span
                    className={
                      active
                        ? "dashboard-status dashboard-status-approved"
                        : "dashboard-status dashboard-status-rejected"
                    }
                  >
                    {active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div
                  style={{
                    background: "#F7F3E8",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Mail size={13} color="#C9A24B" />
                    <strong style={{ color: "#061C2B" }}>{admin.email}</strong>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Phone size={13} color="#C9A24B" />
                    <span style={{ color: "#5B6964" }}>
                      {admin.phone || "No phone registered"}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar size={13} color="#063B32" />
                    <span style={{ color: "#5B6964" }}>
                      Joined {formatDateShort(admin.created_at)}
                    </span>
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "10px",
                    borderTop: "1px solid var(--color-border)",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewAdmin(admin)}
                    className="table-action-btn btn-view"
                  >
                    <Eye size={13} /> View Profile
                  </button>

                  {isSuperAdmin && !isSuper ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(admin)}
                        className="table-action-btn btn-view"
                      >
                        <Power size={13} /> {active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(admin)}
                        className="table-action-btn btn-approve"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(admin.id)}
                        className="table-action-btn btn-reject"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#8A6414" }}>
                      {isSuper ? "Protected Root Account" : "Read Only"}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* VIEW ADMINISTRATOR MODAL */}
      {viewAdmin && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setViewAdmin(null)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div>
                <span className="panel-eyebrow">
                  STAFF PROFILE · {formatAdminCode(viewAdmin.id)}
                </span>
                <h4>{viewAdmin.full_name}</h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewAdmin(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dashboard-modal-grid">
              <div>
                <span>Role</span>
                <strong>{viewAdmin.role?.replace("_", " ")}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>
                  {Number(viewAdmin.is_active) === 1 ? "ACTIVE" : "INACTIVE"}
                </strong>
              </div>
              <div>
                <span>Email Address</span>
                <strong>{viewAdmin.email}</strong>
              </div>
              <div>
                <span>Phone Number</span>
                <strong>{viewAdmin.phone || "Not provided"}</strong>
              </div>
              <div>
                <span>Account Created</span>
                <strong>{formatDateShort(viewAdmin.created_at)}</strong>
              </div>
              <div>
                <span>Permissions</span>
                <strong>
                  {viewAdmin.role === "SUPER_ADMIN"
                    ? "Full Root Access"
                    : "Hotel Operations"}
                </strong>
              </div>
            </div>

            <div className="dashboard-modal-footer">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setViewAdmin(null)}
              >
                Close
              </button>
              {isSuperAdmin && viewAdmin.role !== "SUPER_ADMIN" && (
                <button
                  type="button"
                  className="dashboard-btn-primary"
                  onClick={() => {
                    const target = viewAdmin;
                    setViewAdmin(null);
                    handleOpenEdit(target);
                  }}
                >
                  <Edit2 size={14} /> Edit Administrator
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ADMIN MODAL */}
      {isModalOpen && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header" style={{ marginBottom: "16px" }}>
              <div>
                <span className="panel-eyebrow">
                  {modalMode === "create"
                    ? "NEW ADMINISTRATOR"
                    : "UPDATE ADMINISTRATOR"}
                </span>
                <h4>
                  {modalMode === "create"
                    ? "Create Hotel Admin Account"
                    : "Update Admin Account"}
                </h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: "#F9E5E2",
                  color: "#9E3D30",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  marginBottom: "14px",
                  fontWeight: 600,
                }}
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmitForm}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#5B6964",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  FULL NAME *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter administrator full name"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    placeholder="admin@serenitybay.com"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    PHONE NUMBER
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="+94 77 123 4567"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    {modalMode === "create"
                      ? "INITIAL PASSWORD *"
                      : "NEW PASSWORD (OPTIONAL)"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    required={modalMode === "create"}
                    placeholder={
                      modalMode === "create"
                        ? "Minimum 6 characters"
                        : "Leave blank to keep current"
                    }
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    ACCOUNT STATUS
                  </label>
                  <select
                    name="is_active"
                    value={formData.is_active}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                      background: "#F7F3E8",
                    }}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="dashboard-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="dashboard-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="dashboard-btn-primary"
                >
                  {isSubmitting
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create Admin"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "390px", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "#F9E5E2",
                color: "#9E3D30",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 14px",
              }}
            >
              <Trash2 size={22} />
            </div>
            <h4
              style={{
                margin: "0 0 8px",
                fontFamily: "Playfair Display, serif",
                fontSize: "20px",
                color: "#061C2B",
              }}
            >
              Remove Administrator?
            </h4>
            <p style={{ margin: "0 0 20px", fontSize: "12.5px", color: "#5B6964" }}>
              Are you sure you want to permanently remove administrator{" "}
              <strong style={{ color: "#061C2B" }}>
                {formatAdminCode(deleteId)}
              </strong>
              ?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  background: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#9E3D30",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
