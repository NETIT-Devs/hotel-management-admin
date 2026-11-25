import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  CheckCircle2,
  Wrench,
  Search,
  Eye,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  CalendarCheck,
  FileText,
  Users,
  Phone,
  Mail,
  Check,
  XCircle,
  MessageSquare,
} from "lucide-react";
import {
  getAllFacilitiesAdmin,
  createFacility,
  updateFacility,
  toggleFacilityStatus,
  deleteFacility,
  getAllFacilityReservationsAdmin,
  updateFacilityReservationStatus,
  deleteFacilityReservation,
} from "../../services/facilityAdminService";
import ImageUploadField from "./ImageUploadField";

const CATEGORIES = [
  "ALL",
  "POOL & BEACH",
  "SPA & WELLNESS",
  "FINE DINING",
  "FITNESS",
  "RECREATION",
  "EVENTS & VIP",
];

const BOOKING_TYPE_META = {
  COMPLIMENTARY: {
    label: "Complimentary Walk-In",
    bg: "rgba(16, 185, 129, 0.12)",
    color: "#047857",
    border: "rgba(16, 185, 129, 0.3)",
  },
  RESERVABLE: {
    label: "Slot / Table Reservation",
    bg: "rgba(201, 162, 75, 0.18)",
    color: "#8a6a1f",
    border: "rgba(201, 162, 75, 0.45)",
  },
  INQUIRY: {
    label: "Event Proposal Inquiry",
    bg: "rgba(6, 59, 50, 0.12)",
    color: "#063B32",
    border: "rgba(6, 59, 50, 0.3)",
  },
};

const RESERVATION_STATUS_META = {
  PENDING: { label: "Pending Review", bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  CONFIRMED: { label: "Confirmed", bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  COMPLETED: { label: "Completed", bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
  CANCELLED: { label: "Cancelled", bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
};

const INITIAL_FORM = {
  title: "",
  category: "SPA & WELLNESS",
  booking_type: "RESERVABLE",
  badge: "SIGNATURE EXPERIENCE",
  hours: "08:00 AM – 09:00 PM",
  location: "Main Resort Wing",
  access_note: "Advance Reservation Recommended",
  price_label: "From $95 / session",
  base_price: 95,
  max_guests: 6,
  time_slots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:30 PM"],
  service_options: ["Signature Resort Experience"],
  highlights: ["Complimentary Refreshments", "Dedicated Concierge"],
  image_url:
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=85",
  description: "",
  status: "OPEN",
};

/**
 * FacilitiesManagement Component (Admin Dashboard)
 * Database-backed luxury resort facility & concierge reservation manager:
 *  - Tab 1: Resort Facilities Catalog (Full CRUD with COMPLIMENTARY / RESERVABLE / INQUIRY modes)
 *  - Tab 2: Guest Facility Reservations & Event Inquiries (Approve, Complete, Cancel, Concierge Notes)
 */
const FacilitiesManagement = () => {
  const [activeTab, setActiveTab] = useState("catalog"); // 'catalog' | 'reservations'
  const [facilities, setFacilities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Catalog view controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards");
  const [viewFacility, setViewFacility] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Create / Edit facility modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [newHighlight, setNewHighlight] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [newServiceOption, setNewServiceOption] = useState("");

  // Reservations view controls
  const [resSearch, setResSearch] = useState("");
  const [resStatusFilter, setResStatusFilter] = useState("ALL");
  const [resTypeFilter, setResTypeFilter] = useState("ALL");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [conciergeNoteDraft, setConciergeNoteDraft] = useState("");
  const [resUpdatingId, setResUpdatingId] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3200);
  };

  // Load both facilities catalog and guest reservations from MySQL backend
  const fetchAllData = async () => {
    setLoading(true);
    setActionError("");
    try {
      const [facList, resList] = await Promise.all([
        getAllFacilitiesAdmin(),
        getAllFacilityReservationsAdmin().catch(() => []),
      ]);
      setFacilities(facList);
      setReservations(resList);
    } catch (err) {
      setActionError(err.message || "Failed to load facilities data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered facilities list
  const filteredFacilities = useMemo(() => {
    return facilities.filter((item) => {
      const matchesCat =
        selectedCategory === "ALL" ||
        String(item.category || "").toUpperCase() === selectedCategory;
      const term = searchTerm.trim().toLowerCase();
      if (!term) return matchesCat;
      return (
        matchesCat &&
        (item.title?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term) ||
          item.location?.toLowerCase().includes(term) ||
          item.booking_type?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term))
      );
    });
  }, [facilities, selectedCategory, searchTerm]);

  // Filtered reservations & inquiries list
  const filteredReservations = useMemo(() => {
    return reservations.filter((item) => {
      const matchesStatus =
        resStatusFilter === "ALL" || String(item.status).toUpperCase() === resStatusFilter;
      const matchesType =
        resTypeFilter === "ALL" || String(item.request_type).toUpperCase() === resTypeFilter;
      const term = resSearch.trim().toLowerCase();
      if (!term) return matchesStatus && matchesType;
      return (
        matchesStatus &&
        matchesType &&
        (item.reference_code?.toLowerCase().includes(term) ||
          item.guest_name?.toLowerCase().includes(term) ||
          item.guest_email?.toLowerCase().includes(term) ||
          item.facility_title?.toLowerCase().includes(term) ||
          item.service_option?.toLowerCase().includes(term))
      );
    });
  }, [reservations, resStatusFilter, resTypeFilter, resSearch]);

  // Modal helpers for Facility CRUD
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setNewHighlight("");
    setNewTimeSlot("");
    setNewServiceOption("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode("edit");
    setEditingId(item.id);
    setFormData({
      title: item.title || "",
      category: item.category || "SPA & WELLNESS",
      booking_type: item.booking_type || "COMPLIMENTARY",
      badge: item.badge || "SIGNATURE EXPERIENCE",
      hours: item.hours || "08:00 AM – 09:00 PM",
      location: item.location || "Main Resort Wing",
      access_note: item.access_note || "",
      price_label: item.price_label || "Complimentary",
      base_price: Number(item.base_price) || 0,
      max_guests: Number(item.max_guests) || 10,
      time_slots: Array.isArray(item.time_slots) ? item.time_slots : [],
      service_options: Array.isArray(item.service_options) ? item.service_options : [],
      highlights: Array.isArray(item.highlights) ? item.highlights : [],
      image_url: item.image_url || item.image || "",
      description: item.description || "",
      status: item.status || "OPEN",
    });
    setNewHighlight("");
    setNewTimeSlot("");
    setNewServiceOption("");
    setIsModalOpen(true);
  };

  const handleAddChip = (field, value, clearSetter) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), trimmed],
    }));
    clearSetter("");
  };

  const handleRemoveChip = (field, idx) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSubmitFacility = async (e) => {
    e.preventDefault();
    setSaving(true);
    setActionError("");
    try {
      if (modalMode === "create") {
        await createFacility(formData);
        showToast("Resort facility created successfully.");
      } else {
        await updateFacility(editingId, formData);
        showToast("Facility details updated.");
      }
      setIsModalOpen(false);
      await fetchAllData();
    } catch (err) {
      setActionError(err.message || "Failed to save facility.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === "OPEN" ? "MAINTENANCE" : "OPEN";
    try {
      await toggleFacilityStatus(item.id, nextStatus);
      setFacilities((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: nextStatus } : f))
      );
      showToast(`${item.title} marked as ${nextStatus}.`);
    } catch (err) {
      setActionError(err.message || "Failed to toggle facility status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteFacility(deleteId);
      setFacilities((prev) => prev.filter((f) => f.id !== deleteId));
      setDeleteId(null);
      showToast("Facility deleted.");
    } catch (err) {
      setActionError(err.message || "Failed to delete facility.");
    }
  };

  // Guest Reservation / Inquiry status update handler
  const handleUpdateReservationStatus = async (reservationId, nextStatus, notes) => {
    setResUpdatingId(reservationId);
    setActionError("");
    try {
      await updateFacilityReservationStatus(reservationId, nextStatus, notes);
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                status: nextStatus,
                admin_notes: notes !== undefined ? notes : r.admin_notes,
              }
            : r
        )
      );
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation((prev) =>
          prev
            ? {
                ...prev,
                status: nextStatus,
                admin_notes: notes !== undefined ? notes : prev.admin_notes,
              }
            : null
        );
      }
      showToast(`Request marked as ${nextStatus}.`);
    } catch (err) {
      setActionError(err.message || "Failed to update request status.");
    } finally {
      setResUpdatingId(null);
    }
  };

  const handleDeleteReservationRecord = async (reservationId) => {
    if (!window.confirm("Remove this facility reservation record permanently?")) return;
    try {
      await deleteFacilityReservation(reservationId);
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
      if (selectedReservation?.id === reservationId) setSelectedReservation(null);
      showToast("Reservation record removed.");
    } catch (err) {
      setActionError(err.message || "Failed to delete reservation record.");
    }
  };

  // KPI metrics
  const totalCount = facilities.length;
  const openCount = facilities.filter((f) => f.status === "OPEN").length;
  const bookableCount = facilities.filter((f) => f.booking_type !== "COMPLIMENTARY").length;
  const pendingReservationsCount = reservations.filter((r) => r.status === "PENDING").length;
  const confirmedReservationsCount = reservations.filter((r) => r.status === "CONFIRMED").length;

  return (
    <div
      className="facilities-management-view"
      style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* Feedback Toast / Error Banner */}
      {toastMsg && (
        <div
          role="status"
          style={{
            background: "#063B32",
            color: "#C9A24B",
            padding: "12px 18px",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: 700,
            border: "1px solid rgba(201,162,75,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>✓ {toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg("")}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "12px 18px",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: 600,
            border: "1px solid #fecaca",
          }}
        >
          {actionError}
        </div>
      )}

      {/* 1. Executive KPI Summary Strip (Matching Offers & Rooms Dashboard Style) */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
          gap: "16px",
        }}
      >
        {[
          {
            label: "Total Resort Facilities",
            value: totalCount,
            sub: `${openCount} operational · ${totalCount - openCount} maintenance`,
            icon: Sparkles,
            iconBg: "rgba(6, 59, 50, 0.1)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Reservable & Event Venues",
            value: bookableCount,
            sub: `${totalCount - bookableCount} complimentary walk-in`,
            icon: CalendarCheck,
            iconBg: "rgba(201, 162, 75, 0.2)",
            iconColor: "#8A6414",
            accent: "#C9A24B",
          },
          {
            label: "Pending Guest Requests",
            value: pendingReservationsCount,
            sub: "Awaiting concierge confirmation",
            icon: Clock,
            iconBg: "#F9E5E2",
            iconColor: "#9E3D30",
            accent: "#9E3D30",
          },
          {
            label: "Confirmed Bookings",
            value: confirmedReservationsCount,
            sub: `${reservations.length} total concierge requests`,
            icon: CheckCircle2,
            iconBg: "rgba(6, 59, 50, 0.12)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
        ].map((kpi) => {
          const IconComp = kpi.icon;
          return (
            <article
              key={kpi.label}
              className="dashboard-card"
              style={{
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                borderTop: `3px solid ${kpi.accent}`,
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
                  {kpi.label}
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
                  {kpi.value}
                </strong>
                <small style={{ fontSize: "11px", color: "var(--color-muted)" }}>
                  {kpi.sub}
                </small>
              </div>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "14px",
                  background: kpi.iconBg,
                  color: kpi.iconColor,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <IconComp size={22} />
              </div>
            </article>
          );
        })}
      </section>

      {/* 2. Unified Executive Control Header, Mode Switcher, Filters & Search (Matching Offers Dashboard) */}
      <section className="dashboard-card" style={{ padding: "22px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            paddingBottom: "18px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <span className="panel-eyebrow">RESORT AMENITIES &amp; CONCIERGE DESK</span>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "22px",
                color: "#061C2B",
                margin: "2px 0 4px",
              }}
            >
              {activeTab === "catalog"
                ? "Luxury Resort Facilities"
                : "Guest Reservations & Event Inquiries"}
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)" }}>
              {activeTab === "catalog"
                ? "Manage complimentary amenities, reservable spa & dining venues, and event spaces."
                : "Review, confirm, and add concierge notes to guest facility bookings and event proposals."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            {/* Unified View & Mode Switcher Pill */}
            <div
              style={{
                display: "inline-flex",
                background: "#F7F3E8",
                padding: "4px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab("catalog");
                  setViewMode("cards");
                }}
                style={{
                  border: "none",
                  background:
                    activeTab === "catalog" && viewMode === "cards" ? "#063B32" : "transparent",
                  color:
                    activeTab === "catalog" && viewMode === "cards" ? "#C9A24B" : "#5B6964",
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
                <LayoutGrid size={14} /> Facility Cards
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("catalog");
                  setViewMode("table");
                }}
                style={{
                  border: "none",
                  background:
                    activeTab === "catalog" && viewMode === "table" ? "#063B32" : "transparent",
                  color:
                    activeTab === "catalog" && viewMode === "table" ? "#C9A24B" : "#5B6964",
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
                onClick={() => setActiveTab("reservations")}
                style={{
                  border: "none",
                  background: activeTab === "reservations" ? "#063B32" : "transparent",
                  color: activeTab === "reservations" ? "#C9A24B" : "#5B6964",
                  padding: "6px 12px",
                  borderRadius: "7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CalendarCheck size={14} />
                <span>Guest Requests</span>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    background:
                      pendingReservationsCount > 0
                        ? "#C9A24B"
                        : activeTab === "reservations"
                        ? "rgba(201,162,75,0.22)"
                        : "#FFFFFF",
                    color: "#061C2B",
                    fontWeight: 800,
                  }}
                >
                  {pendingReservationsCount > 0 ? pendingReservationsCount : reservations.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={fetchAllData}
              disabled={loading}
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
              <RefreshCw size={14} /> {loading ? "Syncing..." : "Refresh"}
            </button>

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
              <Plus size={16} /> New Facility
            </button>
          </div>
        </div>

        {/* Filter Pills & Search Row (Adapts smoothly between Catalog & Guest Requests) */}
        {activeTab === "catalog" ? (
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
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                const count =
                  cat === "ALL"
                    ? facilities.length
                    : facilities.filter((f) => String(f.category || "").toUpperCase() === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
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
                    <span>{cat === "ALL" ? "All Facilities" : cat}</span>
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
                minWidth: "260px",
                flex: "0 1 340px",
              }}
            >
              <Search size={16} color="#5B6964" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search facilities by name, location, or tier..."
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
        ) : (
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
              {["ALL", "RESERVATION", "INQUIRY"].map((t) => {
                const active = resTypeFilter === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setResTypeFilter(t)}
                    style={{
                      border: "1px solid",
                      borderColor: active ? "#C9A24B" : "var(--color-border)",
                      padding: "7px 13px",
                      borderRadius: "999px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: active ? "#C9A24B" : "#F7F3E8",
                      color: "#061C2B",
                    }}
                  >
                    {t === "ALL" ? "All Types" : t === "INQUIRY" ? "Event Inquiries" : "Slot Bookings"}
                  </button>
                );
              })}

              {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => {
                const active = resStatusFilter === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setResStatusFilter(st)}
                    style={{
                      border: "1px solid",
                      borderColor: active ? "#063B32" : "var(--color-border)",
                      padding: "7px 13px",
                      borderRadius: "999px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: active ? "#063B32" : "#F7F3E8",
                      color: active ? "#C9A24B" : "#061C2B",
                    }}
                  >
                    {st}
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
                minWidth: "260px",
                flex: "0 1 340px",
              }}
            >
              <Search size={16} color="#5B6964" />
              <input
                type="text"
                value={resSearch}
                onChange={(e) => setResSearch(e.target.value)}
                placeholder="Search by ref (FAC/EVT), guest, or venue..."
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "13px",
                  width: "100%",
                  color: "#061C2B",
                }}
              />
              {resSearch && (
                <button
                  type="button"
                  onClick={() => setResSearch("")}
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
        )}
      </section>

      {/* =====================================================================
          TAB 1: RESORT FACILITIES CATALOG
         ===================================================================== */}
      {activeTab === "catalog" && (
        <>
          {/* Facilities Cards or Executive Table */}
          {loading ? (
            <div
              className="dashboard-card"
              style={{
                padding: "48px",
                textAlign: "center",
                color: "var(--color-muted)",
              }}
            >
              Loading resort facilities from MySQL database...
            </div>
          ) : viewMode === "cards" ? (
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "20px",
              }}
            >
              {filteredFacilities.map((item) => {
                const tierMeta =
                  BOOKING_TYPE_META[item.booking_type] || BOOKING_TYPE_META.COMPLIMENTARY;
                const isOpen = item.status === "OPEN";
                const highlightsList = Array.isArray(item.highlights) ? item.highlights : [];
                return (
                  <article
                    key={item.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "20px",
                      overflow: "hidden",
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--shadow-soft)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Hero Image Overlay (Matching Offers Admin Card Style) */}
                      <div style={{ position: "relative", height: "205px", background: "#061C2B" }}>
                        <img
                          src={item.image_url || item.image}
                          alt={item.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(to top, rgba(6,28,43,0.82) 0%, rgba(6,28,43,0.12) 55%, rgba(6,28,43,0.35) 100%)",
                          }}
                        />

                        {/* Top Left Gold Booking Tier Tag */}
                        <span
                          style={{
                            position: "absolute",
                            top: "14px",
                            left: "14px",
                            background: "linear-gradient(135deg, #C9A24B, #b58d35)",
                            color: "#061C2B",
                            fontWeight: 800,
                            fontSize: "10.5px",
                            padding: "5px 12px",
                            borderRadius: "999px",
                            letterSpacing: "0.6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
                            textTransform: "uppercase",
                          }}
                        >
                          {item.booking_type === "INQUIRY"
                            ? "EVENT INQUIRY"
                            : item.booking_type === "RESERVABLE"
                            ? "RESERVABLE"
                            : "COMPLIMENTARY"}
                        </span>

                        {/* Top Right Status Badge */}
                        <span
                          style={{
                            position: "absolute",
                            top: "14px",
                            right: "14px",
                            background: isOpen ? "#063B32" : "#F9E5E2",
                            color: isOpen ? "#C9A24B" : "#9E3D30",
                            fontWeight: 800,
                            fontSize: "10px",
                            padding: "5px 12px",
                            borderRadius: "999px",
                            letterSpacing: "0.6px",
                            border: isOpen
                              ? "1px solid rgba(201,162,75,0.45)"
                              : "1px solid #F1C8C1",
                          }}
                        >
                          {item.status}
                        </span>

                        {/* Bottom Image Title Overlay */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "12px",
                            left: "16px",
                            right: "16px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              letterSpacing: "1.6px",
                              fontWeight: 700,
                              color: "#C9A24B",
                              textTransform: "uppercase",
                              display: "block",
                            }}
                          >
                            {item.category}
                          </span>
                          <h3
                            style={{
                              margin: "2px 0 0",
                              fontFamily: "Playfair Display, serif",
                              fontSize: "20px",
                              color: "#FFFFFF",
                              fontWeight: 600,
                              lineHeight: 1.25,
                            }}
                          >
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      {/* Card Body (Matching Offers Admin Card Body) */}
                      <div style={{ padding: "18px 20px" }}>
                        {/* Pricing & Access Strip */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            padding: "11px 14px",
                            background: "#F7F3E8",
                            borderRadius: "12px",
                            border: "1px solid var(--color-border)",
                            marginBottom: "14px",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: "block",
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#5B6964",
                                textTransform: "uppercase",
                              }}
                            >
                              Rate &amp; Access
                            </span>
                            <strong
                              style={{
                                fontFamily: "Playfair Display, serif",
                                fontSize: "18px",
                                color: "#063B32",
                                display: "block",
                                marginTop: "1px",
                              }}
                            >
                              {item.price_label || "Complimentary"}
                            </strong>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: "10.5px",
                                color: "#063B32",
                                background: "rgba(6, 59, 50, 0.1)",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                fontWeight: 700,
                                marginBottom: "3px",
                              }}
                            >
                              {tierMeta.label}
                            </span>
                            <small
                              style={{
                                display: "block",
                                fontSize: "10.5px",
                                color: "#5B6964",
                              }}
                            >
                              Max {item.max_guests || 10} guests
                            </small>
                          </div>
                        </div>

                        <p
                          style={{
                            fontSize: "12.5px",
                            color: "#5B6964",
                            lineHeight: 1.55,
                            margin: "0 0 12px 0",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.description}
                        </p>

                        {/* Operating Hours & Location */}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: "#061C2B",
                            marginBottom: "10px",
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Clock size={13} color="#C9A24B" /> {item.hours}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <MapPin size={13} color="#C9A24B" /> {item.location}
                          </span>
                        </div>

                        {/* Signature Highlight Chips */}
                        {highlightsList.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {highlightsList.slice(0, 3).map((hl, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: "10.5px",
                                  fontWeight: 600,
                                  padding: "3px 9px",
                                  borderRadius: "999px",
                                  background: "rgba(201, 162, 75, 0.16)",
                                  color: "#7A5810",
                                }}
                              >
                                ✓ {hl}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Footer (Matching Offers Admin Card Footer) */}
                    <div
                      style={{
                        padding: "13px 20px",
                        borderTop: "1px solid var(--color-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        background: "#F7F3E8",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className="table-action-btn"
                        style={{
                          background: "#FFFFFF",
                          borderColor: "var(--color-border)",
                          color: isOpen ? "#8A6414" : "#063B32",
                        }}
                      >
                        {isOpen ? <Wrench size={13} /> : <CheckCircle2 size={13} />}
                        <span>{isOpen ? "Maintenance" : "Set Open"}</span>
                      </button>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => setViewFacility(item)}
                          className="table-action-btn btn-view"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="table-action-btn btn-approve"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
                          className="table-action-btn btn-reject"
                          title="Delete facility"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <section className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "15px 22px" }}>Facility &amp; Category</th>
                      <th style={{ padding: "15px 16px" }}>Booking Tier</th>
                      <th style={{ padding: "15px 16px" }}>Pricing</th>
                      <th style={{ padding: "15px 16px" }}>Hours &amp; Location</th>
                      <th style={{ padding: "15px 16px" }}>Status</th>
                      <th style={{ padding: "15px 22px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFacilities.map((item) => {
                      const tierMeta =
                        BOOKING_TYPE_META[item.booking_type] || BOOKING_TYPE_META.COMPLIMENTARY;
                      const isOpen = item.status === "OPEN";
                      return (
                        <tr key={item.id}>
                          <td style={{ padding: "14px 22px" }}>
                            <div className="room-cell">
                              <strong>{item.title}</strong>
                              <span>{item.category}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span
                              style={{
                                background: tierMeta.bg,
                                color: tierMeta.color,
                                border: `1px solid ${tierMeta.border}`,
                                padding: "4px 10px",
                                borderRadius: "999px",
                                fontSize: "10.5px",
                                fontWeight: 700,
                              }}
                            >
                              {tierMeta.label}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 700, color: "#063B32" }}>
                            {item.price_label}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--color-muted)" }}>
                            <div>{item.hours}</div>
                            <div>{item.location}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span
                              className={
                                isOpen
                                  ? "dashboard-status dashboard-status-approved"
                                  : "dashboard-status dashboard-status-pending"
                              }
                            >
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 22px", textAlign: "right" }}>
                            <div className="dashboard-table-actions">
                              <button
                                type="button"
                                onClick={() => setViewFacility(item)}
                                className="table-action-btn btn-view"
                              >
                                <Eye size={13} /> View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="table-action-btn btn-approve"
                              >
                                <Edit2 size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(item.id)}
                                className="table-action-btn btn-reject"
                                title="Delete facility"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* =====================================================================
          TAB 2: GUEST RESERVATIONS & EVENT INQUIRIES (MATCHING EXECUTIVE TABLE STYLE)
         ===================================================================== */}
      {activeTab === "reservations" && (
        <section className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
          {filteredReservations.length === 0 ? (
            <div style={{ padding: "54px 20px", textAlign: "center", color: "var(--color-muted)" }}>
              <CalendarCheck size={34} color="#C9A24B" style={{ margin: "0 auto 10px" }} />
              <p
                style={{
                  margin: "0 0 4px",
                  fontFamily: "Playfair Display, serif",
                  fontWeight: 700,
                  color: "#063B32",
                  fontSize: "18px",
                }}
              >
                No Facility Reservations or Inquiries Found
              </p>
              <p style={{ margin: 0, fontSize: "12.5px" }}>
                Guest spa appointments, fine dining table bookings, and wedding inquiries submitted on the website appear here live.
              </p>
            </div>
          ) : (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "15px 20px" }}>Reference &amp; Type</th>
                    <th style={{ padding: "15px 14px" }}>Guest Details</th>
                    <th style={{ padding: "15px 14px" }}>Facility &amp; Experience</th>
                    <th style={{ padding: "15px 14px" }}>Schedule</th>
                    <th style={{ padding: "15px 14px" }}>Status</th>
                    <th style={{ padding: "15px 20px", textAlign: "right" }}>Concierge Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((r) => {
                    const stMeta =
                      RESERVATION_STATUS_META[r.status] || RESERVATION_STATUS_META.PENDING;
                    const busy = resUpdatingId === r.id;
                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ fontFamily: "monospace", fontWeight: 800, color: "#063B32" }}>
                            {r.reference_code}
                          </div>
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "4px",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "10px",
                              fontWeight: 800,
                              background:
                                r.request_type === "INQUIRY"
                                  ? "rgba(6,59,50,0.1)"
                                  : "rgba(201,162,75,0.2)",
                              color: r.request_type === "INQUIRY" ? "#063B32" : "#8a6a1f",
                            }}
                          >
                            {r.request_type === "INQUIRY" ? "EVENT INQUIRY" : "RESERVATION"}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 700, color: "#061C2B" }}>{r.guest_name}</div>
                          <div style={{ fontSize: "11.5px", color: "#4b5563" }}>{r.guest_email}</div>
                          <div style={{ fontSize: "11.5px", color: "#4b5563" }}>{r.guest_phone}</div>
                          {r.room_booking_ref && (
                            <div
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 700,
                                color: "#063B32",
                                marginTop: "3px",
                              }}
                            >
                              Room Ref: {r.room_booking_ref}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 700, color: "#063B32" }}>{r.facility_title}</div>
                          {r.service_option && (
                            <div style={{ fontSize: "11.5px", color: "#374151", marginTop: "2px" }}>
                              {r.service_option}
                            </div>
                          )}
                          {Number(r.estimated_price) > 0 && (
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#9a7322",
                                marginTop: "3px",
                              }}
                            >
                              Est. ${Number(r.estimated_price).toFixed(0)} (Pay at Venue)
                            </div>
                          )}
                        </td>

                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 700, color: "#061C2B" }}>
                            {String(r.reservation_date).slice(0, 10)}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#4b5563" }}>
                            {r.time_slot || "Flexible"} · {r.guests_count} Guests
                          </div>
                        </td>

                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: 800,
                              background: stMeta.bg,
                              color: stMeta.color,
                              border: `1px solid ${stMeta.border}`,
                            }}
                          >
                            {stMeta.label}
                          </span>
                        </td>

                        <td style={{ padding: "14px 16px", textAlign: "right", verticalAlign: "top" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              flexWrap: "wrap",
                              justifyContent: "flex-end",
                              gap: "6px",
                            }}
                          >
                            {r.status === "PENDING" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleUpdateReservationStatus(r.id, "CONFIRMED")}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: "none",
                                  background: "#059669",
                                  color: "#fff",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Check size={12} /> Confirm
                              </button>
                            )}
                            {r.status === "CONFIRMED" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleUpdateReservationStatus(r.id, "COMPLETED")}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: "none",
                                  background: "#1d4ed8",
                                  color: "#fff",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Complete
                              </button>
                            )}
                            {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleUpdateReservationStatus(r.id, "CANCELLED")}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid #fecaca",
                                  background: "#fff",
                                  color: "#dc2626",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReservation(r);
                                setConciergeNoteDraft(r.admin_notes || "");
                              }}
                              title="Details & Concierge Note"
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid rgba(201,162,75,0.45)",
                                background: "#FAF8F5",
                                color: "#063B32",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <MessageSquare size={12} /> Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReservationRecord(r.id)}
                              title="Delete Record"
                              style={{
                                padding: "6px",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                color: "#9ca3af",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          CREATE / EDIT FACILITY MODAL
         ===================================================================== */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(6, 28, 43, 0.72)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "660px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "26px 28px",
            }}
          >
            {/* Clean White Modal Header (Matching Offers & Rooms Forms) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid #ECEEEA",
                paddingBottom: "12px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "10px",
                    letterSpacing: "0.18em",
                    color: "#C9A24B",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  RESORT FACILITY MANAGER
                </p>
                <h3
                  style={{
                    margin: "3px 0 0",
                    fontFamily: "Playfair Display, serif",
                    fontSize: "20px",
                    color: "var(--color-emerald-dark)",
                    fontWeight: 700,
                  }}
                >
                  {modalMode === "create" ? "Add New Resort Facility" : "Edit Resort Facility"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--color-muted)",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitFacility} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                    Facility Title *
                  </label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Serenity Holistic Spa"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                  >
                    {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Booking Mode & Pricing Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                    Hospitality Booking Mode *
                  </label>
                  <select
                    value={formData.booking_type}
                    onChange={(e) => setFormData({ ...formData, booking_type: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                  >
                    <option value="COMPLIMENTARY">COMPLIMENTARY (Walk-In Only)</option>
                    <option value="RESERVABLE">RESERVABLE (Slot / Table Booking)</option>
                    <option value="INQUIRY">INQUIRY (Event Proposal Request)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                    Price Label
                  </label>
                  <input
                    value={formData.price_label}
                    onChange={(e) => setFormData({ ...formData, price_label: e.target.value })}
                    placeholder="e.g. From $95 / session"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                    Base Price (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                    Operating Hours
                  </label>
                  <input
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                    Location
                  </label>
                  <input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                    Max Guests / Slot
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                  Access Note (Card Footer)
                </label>
                <input
                  value={formData.access_note}
                  onChange={(e) => setFormData({ ...formData, access_note: e.target.value })}
                  placeholder="e.g. Advance Reservation Recommended"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                />
              </div>

              <ImageUploadField
                label="Facility Cover Image"
                folder="facilities"
                value={formData.image_url}
                onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
              />

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "13px" }}
                />
              </div>

              {/* Time Slots & Service Options (Only for RESERVABLE / INQUIRY facilities) */}
              {formData.booking_type !== "COMPLIMENTARY" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                      Available Time Slots
                    </label>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                      <input
                        value={newTimeSlot}
                        onChange={(e) => setNewTimeSlot(e.target.value)}
                        placeholder="e.g. 04:30 PM"
                        style={{ flex: 1, padding: "8px 10px", borderRadius: "9px", border: "1px solid #d1d5db", fontSize: "12px" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddChip("time_slots", newTimeSlot, setNewTimeSlot)}
                        style={{ padding: "8px 12px", borderRadius: "9px", border: "none", background: "#063B32", color: "#C9A24B", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Add
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(formData.time_slots || []).map((slot, i) => (
                        <span
                          key={i}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FAF8F5", border: "1px solid rgba(201,162,75,0.4)", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700 }}
                        >
                          {slot}
                          <button type="button" onClick={() => handleRemoveChip("time_slots", i)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                      {formData.booking_type === "INQUIRY" ? "Event Types" : "Service / Package Options"}
                    </label>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                      <input
                        value={newServiceOption}
                        onChange={(e) => setNewServiceOption(e.target.value)}
                        placeholder="e.g. Couples Ayurveda Suite"
                        style={{ flex: 1, padding: "8px 10px", borderRadius: "9px", border: "1px solid #d1d5db", fontSize: "12px" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddChip("service_options", newServiceOption, setNewServiceOption)}
                        style={{ padding: "8px 12px", borderRadius: "9px", border: "none", background: "#063B32", color: "#C9A24B", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Add
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(formData.service_options || []).map((opt, i) => (
                        <span
                          key={i}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FAF8F5", border: "1px solid rgba(6,59,50,0.25)", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700 }}
                        >
                          {opt}
                          <button type="button" onClick={() => handleRemoveChip("service_options", i)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Signature Highlights */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "5px" }}>
                  Signature Highlights
                </label>
                <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                  <input
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    placeholder="Add facility highlight..."
                    style={{ flex: 1, padding: "8px 10px", borderRadius: "9px", border: "1px solid #d1d5db", fontSize: "12px" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddChip("highlights", newHighlight, setNewHighlight)}
                    style={{ padding: "8px 14px", borderRadius: "9px", border: "none", background: "#063B32", color: "#C9A24B", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(formData.highlights || []).map((h, i) => (
                    <span
                      key={i}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FAF8F5", border: "1px solid #e5e7eb", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 600 }}
                    >
                      {h}
                      <button type="button" onClick={() => handleRemoveChip("highlights", i)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: "11px", border: "1px solid #d1d5db", background: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "10px 22px", borderRadius: "11px", border: "none", background: "linear-gradient(135deg, #C9A24B, #b48c36)", color: "#061C2B", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
                >
                  {saving ? "Saving..." : modalMode === "create" ? "Create Facility" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          FACILITY PREVIEW MODAL
         ===================================================================== */}
      {viewFacility && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(6, 28, 43, 0.72)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{ background: "#fff", borderRadius: "22px", width: "100%", maxWidth: "560px", overflow: "hidden" }}>
            <img src={viewFacility.image_url || viewFacility.image} alt={viewFacility.title} style={{ width: "100%", height: "220px", objectFit: "cover" }} />
            <div style={{ padding: "20px 24px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#C9A24B" }}>
                {viewFacility.category} · {viewFacility.booking_type}
              </span>
              <h3 style={{ margin: "6px 0 8px", fontSize: "22px", color: "#063B32" }}>{viewFacility.title}</h3>
              <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.6 }}>{viewFacility.description}</p>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setViewFacility(null)}
                  style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: "#063B32", color: "#C9A24B", fontWeight: 700, cursor: "pointer" }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DELETE FACILITY CONFIRMATION MODAL
         ===================================================================== */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(6, 28, 43, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ margin: "0 0 8px", color: "#991b1b" }}>Delete Resort Facility?</h3>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#4b5563" }}>
              This will permanently remove the facility and any linked reservation records from the database.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                style={{ padding: "9px 16px", borderRadius: "10px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{ padding: "9px 16px", borderRadius: "10px", border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 700 }}
              >
                Delete Facility
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          GUEST RESERVATION DETAILS & CONCIERGE NOTE MODAL
         ===================================================================== */}
      {selectedReservation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(6, 28, 43, 0.72)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{ background: "#fff", borderRadius: "16px", maxWidth: "560px", width: "100%", padding: "24px 26px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", marginBottom: "16px", borderBottom: "1px solid #ECEEEA" }}>
              <div>
                <span style={{ fontSize: "10px", letterSpacing: "0.18em", color: "#C9A24B", fontWeight: 700, textTransform: "uppercase" }}>
                  {selectedReservation.reference_code} · {selectedReservation.request_type}
                </span>
                <h3 style={{ margin: "3px 0 0", fontFamily: "Playfair Display, serif", fontSize: "19px", color: "var(--color-emerald-dark)" }}>
                  {selectedReservation.facility_title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                aria-label="Close reservation details"
                style={{ background: "transparent", border: "none", color: "var(--color-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#FAF8F5", padding: "14px", borderRadius: "14px" }}>
                <div>
                  <span style={{ fontSize: "10px", color: "#6b7280", display: "block" }}>GUEST</span>
                  <strong>{selectedReservation.guest_name}</strong>
                  <div style={{ fontSize: "12px", color: "#4b5563" }}>{selectedReservation.guest_email}</div>
                  <div style={{ fontSize: "12px", color: "#4b5563" }}>{selectedReservation.guest_phone}</div>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "#6b7280", display: "block" }}>SCHEDULE</span>
                  <strong>{String(selectedReservation.reservation_date).slice(0, 10)}</strong>
                  <div style={{ fontSize: "12px", color: "#4b5563" }}>
                    {selectedReservation.time_slot || "Flexible"} · {selectedReservation.guests_count} Guests
                  </div>
                  {selectedReservation.service_option && (
                    <div style={{ fontSize: "12px", color: "#063B32", fontWeight: 600 }}>
                      {selectedReservation.service_option}
                    </div>
                  )}
                </div>
              </div>

              {selectedReservation.special_requests && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px", borderRadius: "12px", fontSize: "12.5px" }}>
                  <strong>Guest Special Request:</strong> {selectedReservation.special_requests}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>
                  Concierge Note (Visible to Guest in My Bookings)
                </label>
                <textarea
                  rows={3}
                  value={conciergeNoteDraft}
                  onChange={(e) => setConciergeNoteDraft(e.target.value)}
                  placeholder="e.g. Therapist confirmed for Lotus Villa #2. Complimentary herbal tea included."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "12.5px" }}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "8px", paddingTop: "6px" }}>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateReservationStatus(
                      selectedReservation.id,
                      "CONFIRMED",
                      conciergeNoteDraft
                    )
                  }
                  style={{ padding: "9px 15px", borderRadius: "10px", border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                >
                  Confirm &amp; Save Note
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateReservationStatus(
                      selectedReservation.id,
                      "COMPLETED",
                      conciergeNoteDraft
                    )
                  }
                  style={{ padding: "9px 15px", borderRadius: "10px", border: "none", background: "#1d4ed8", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                >
                  Mark Completed
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateReservationStatus(
                      selectedReservation.id,
                      selectedReservation.status,
                      conciergeNoteDraft
                    )
                  }
                  style={{ padding: "9px 15px", borderRadius: "10px", border: "1px solid #063B32", background: "#FAF8F5", color: "#063B32", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                >
                  Save Note Only
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitiesManagement;
