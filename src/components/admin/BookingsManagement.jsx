import { useState, useEffect, useMemo } from "react";
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Clock,
  Users,
  BedDouble,
  AlertCircle,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Calendar,
  RefreshCw,
  Check,
  LayoutGrid,
  List,
  ArrowRight,
  Phone,
  Mail,
} from "lucide-react";
import {
  getAllBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} from "../../services/bookingAdminService";
import { getAllRoomsAdmin } from "../../services/roomAdminService";
import { evaluateChildPolicy } from "../../utils/childPolicy";

const DEFAULT_ROOM_OPTIONS = [
  { id: 1, name: "Deluxe Ocean Room", price: 280 },
  { id: 2, name: "Private Pool Villa", price: 520 },
  { id: 3, name: "Ocean Suite", price: 680 },
  { id: 4, name: "Garden Villa", price: 420 },
  { id: 5, name: "Family Suite", price: 760 },
  { id: 6, name: "Sunset Villa", price: 620 },
];

const PAGE_SIZE = 8;

const formatBookingCode = (id) => `#SB-${String(id || 0).padStart(4, "0")}`;

const formatDateDisplay = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const calcNights = (checkIn, checkOut) => {
  const t1 = new Date(checkIn).getTime();
  const t2 = new Date(checkOut).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 1;
  return Math.max(1, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));
};

const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [roomOptions, setRoomOptions] = useState(DEFAULT_ROOM_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'

  // Create / Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [currentBooking, setCurrentBooking] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // View Details Modal state
  const [viewBooking, setViewBooking] = useState(null);

  // Status Confirmation Modal state ({ booking, nextStatus, note })
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialForm = {
    roomId: 1,
    guest_first_name: "",
    guest_last_name: "",
    guest_email: "",
    guest_phone: "",
    check_in: new Date().toISOString().slice(0, 10),
    check_out: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    adults: 2,
    children: 0,
    rooms_count: 1,
    total_price: 280 * 3,
    payment_method: "PAY_AT_HOTEL",
    status: "PENDING",
    special_requests: "",
    admin_note: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [data, roomsData] = await Promise.all([
        getAllBookings(),
        getAllRoomsAdmin().catch(() => []),
      ]);
      setBookings(data);
      if (Array.isArray(roomsData) && roomsData.length > 0) {
        setRoomOptions(
          roomsData.map((r) => ({
            id: r.id,
            name: r.room_name,
            price: Number(r.price_per_night) || 280,
          }))
        );
      }
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Statistics counts from real MySQL bookings
  const statsCounts = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(
      (b) => String(b.status).toUpperCase() === "PENDING"
    ).length;
    const approved = bookings.filter(
      (b) => String(b.status).toUpperCase() === "APPROVED"
    ).length;
    const cancelled = bookings.filter((b) =>
      ["REJECTED", "CANCELLED"].includes(String(b.status).toUpperCase())
    ).length;
    return { total, pending, approved, cancelled };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const st = String(b.status || "PENDING").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "CANCELLED"
          ? st === "REJECTED" || st === "CANCELLED"
          : st === statusFilter);

      const term = searchTerm.trim().toLowerCase();
      if (!term) return matchesStatus;

      const code = formatBookingCode(b.id).toLowerCase();
      const guest = `${b.guest_first_name || ""} ${b.guest_last_name || ""} ${
        b.guest_name || ""
      }`.toLowerCase();
      const email = (b.guest_email || b.email || "").toLowerCase();
      const room = `${b.room_name || ""} ${b.room_type || ""}`.toLowerCase();

      return (
        matchesStatus &&
        (code.includes(term) ||
          String(b.id).includes(term) ||
          guest.includes(term) ||
          email.includes(term) ||
          room.includes(term))
      );
    });
  }, [bookings, statusFilter, searchTerm]);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedBookings = filteredBookings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData(initialForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setModalMode("edit");
    setCurrentBooking(b);
    setFormData({
      roomId: b.room_id || 1,
      guest_first_name:
        b.guest_first_name || b.guest_name?.split(" ")[0] || "",
      guest_last_name:
        b.guest_last_name ||
        b.guest_name?.split(" ").slice(1).join(" ") ||
        "",
      guest_email: b.guest_email || b.email || "",
      guest_phone: b.guest_phone || b.phone || "",
      check_in: b.check_in ? b.check_in.slice(0, 10) : "",
      check_out: b.check_out ? b.check_out.slice(0, 10) : "",
      adults: b.adults || 1,
      children: b.children || 0,
      rooms_count: b.rooms_count || 1,
      total_price: b.total_price || 0,
      payment_method: b.payment_method || "PAY_AT_HOTEL",
      status: b.status || "PENDING",
      special_requests: b.special_requests || "",
      admin_note: b.admin_note || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (["roomId", "check_in", "check_out", "rooms_count"].includes(name)) {
        const room =
          roomOptions.find((r) => r.id === Number(updated.roomId)) ||
          roomOptions[0] ||
          DEFAULT_ROOM_OPTIONS[0];
        const nights = calcNights(updated.check_in, updated.check_out);
        updated.total_price =
          room.price * nights * Number(updated.rooms_count || 1);
      }
      return updated;
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      if (modalMode === "create") {
        await createBooking({
          roomId: Number(formData.roomId),
          checkIn: formData.check_in,
          checkOut: formData.check_out,
          adults: Number(formData.adults),
          children: Number(formData.children),
          guests: Number(formData.adults) + Number(formData.children),
          roomsCount: Number(formData.rooms_count),
          guest_first_name: formData.guest_first_name,
          guest_last_name: formData.guest_last_name,
          guest_email: formData.guest_email,
          guest_phone: formData.guest_phone,
          special_requests: formData.special_requests,
          payment_method: formData.payment_method,
          total_price: Number(formData.total_price),
        });
      } else {
        await updateBooking(currentBooking.id, {
          room_id: Number(formData.roomId),
          check_in: formData.check_in,
          check_out: formData.check_out,
          adults: Number(formData.adults),
          children: Number(formData.children),
          guests: Number(formData.adults) + Number(formData.children),
          rooms_count: Number(formData.rooms_count),
          guest_first_name: formData.guest_first_name,
          guest_last_name: formData.guest_last_name,
          guest_email: formData.guest_email,
          guest_phone: formData.guest_phone,
          total_price: Number(formData.total_price),
          status: formData.status,
          payment_method: formData.payment_method,
          special_requests: formData.special_requests,
          admin_note: formData.admin_note,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || "Failed to save booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusConfirm) return;
    setStatusUpdating(true);
    try {
      await updateBookingStatus(
        statusConfirm.booking.id,
        statusConfirm.nextStatus,
        statusConfirm.note
      );
      setStatusConfirm(null);
      await loadData();
    } catch (err) {
      alert("Status update failed: " + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteBooking(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatusBadge = (status) => {
    const st = String(status || "PENDING").toUpperCase();
    if (st === "APPROVED") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 11px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            background: "rgba(6, 59, 50, 0.12)",
            color: "#063B32",
            border: "1px solid rgba(6, 59, 50, 0.22)",
          }}
        >
          <CheckCircle2 size={12} />
          APPROVED
        </span>
      );
    }
    if (st === "REJECTED" || st === "CANCELLED") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 11px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            background: "#F9E5E2",
            color: "#9E3D30",
            border: "1px solid #F1C8C1",
          }}
        >
          <XCircle size={12} />
          {st}
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "5px 11px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          background: "rgba(201, 162, 75, 0.22)",
          color: "#8A6414",
          border: "1px solid rgba(201, 162, 75, 0.45)",
        }}
      >
        <Clock size={12} />
        PENDING
      </span>
    );
  };

  const statCards = [
    {
      label: "Total Bookings",
      value: statsCounts.total,
      sub: "All guest reservations",
      icon: CalendarCheck,
      iconBg: "rgba(6, 59, 50, 0.1)",
      iconColor: "#063B32",
      accent: "#063B32",
    },
    {
      label: "Pending Bookings",
      value: statsCounts.pending,
      sub: "Awaiting confirmation",
      icon: Clock,
      iconBg: "rgba(201, 162, 75, 0.2)",
      iconColor: "#8A6414",
      accent: "#C9A24B",
    },
    {
      label: "Approved Bookings",
      value: statsCounts.approved,
      sub: "Confirmed guest stays",
      icon: CheckCircle2,
      iconBg: "rgba(6, 59, 50, 0.12)",
      iconColor: "#063B32",
      accent: "#063B32",
    },
    {
      label: "Cancelled Bookings",
      value: statsCounts.cancelled,
      sub: "Rejected or cancelled",
      icon: XCircle,
      iconBg: "#F9E5E2",
      iconColor: "#9E3D30",
      accent: "#9E3D30",
    },
  ];

  const filterTabs = [
    { key: "ALL", label: "All Bookings", count: statsCounts.total },
    { key: "PENDING", label: "Pending", count: statsCounts.pending },
    { key: "APPROVED", label: "Approved", count: statsCounts.approved },
    { key: "REJECTED", label: "Rejected", count: statsCounts.cancelled },
  ];

  return (
    <div
      className="bookings-management-view"
      style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* 1. Booking Statistics Cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
          gap: "16px",
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="dashboard-card"
              style={{
                padding: "18px 20px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                borderTop: `3px solid ${card.accent}`,
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
                  {card.label}
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
                  {card.value}
                </strong>
                <small style={{ fontSize: "11px", color: "var(--color-muted)" }}>
                  {card.sub}
                </small>
              </div>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "14px",
                  background: card.iconBg,
                  color: card.iconColor,
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

      {/* 2. Header, Search Bar & Status Filters */}
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
          <div>
            <span className="panel-eyebrow">RESERVATIONS MANAGEMENT</span>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "22px",
                color: "#061C2B",
                margin: "2px 0 4px",
              }}
            >
              Guest Bookings &amp; Reservations
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)" }}>
              Review, approve, edit, or manage all hotel suite reservations in real time.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* View Mode Toggle: Spacious Table vs Luxury Cards */}
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
                <LayoutGrid size={14} /> Reservation Cards
              </button>
            </div>

            <button
              type="button"
              onClick={loadData}
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
              <Plus size={16} /> New Reservation
            </button>
          </div>
        </div>

        {/* Search & Status Filter Controls */}
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
          {/* Status Filter Pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {filterTabs.map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    border: "1px solid",
                    borderColor: active ? "#063B32" : "var(--color-border)",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    fontSize: "12px",
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
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
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
              placeholder="Search ID, guest name, email, or room..."
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

      {/* 3. Bookings List / Cards Section (Spacious, Zero Cramping) */}
      <section
        className="dashboard-card"
        style={{
          padding: viewMode === "cards" ? "20px" : "0",
          overflow: "hidden",
          background: viewMode === "cards" ? "transparent" : "#FFFFFF",
          border: viewMode === "cards" ? "none" : "1px solid var(--color-border)",
          boxShadow: viewMode === "cards" ? "none" : "var(--shadow-soft)",
        }}
      >
        {loading ? (
          <div
            className="dashboard-card"
            style={{ padding: "48px", textAlign: "center", color: "var(--color-muted)" }}
          >
            Loading hotel reservations...
          </div>
        ) : error ? (
          <div
            className="dashboard-card"
            style={{ padding: "36px", color: "#9E3D30", textAlign: "center" }}
          >
            <AlertCircle size={24} style={{ marginBottom: "8px" }} />
            <div>{error}</div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div
            className="dashboard-card"
            style={{ padding: "48px", textAlign: "center", color: "var(--color-muted)" }}
          >
            No reservations found matching your current filter.
          </div>
        ) : (
          <>
            {viewMode === "table" ? (
              <div className="dashboard-table-wrapper">
                <table
                  className="dashboard-table"
                  style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0" }}
                >
                  <thead>
                    <tr>
                      <th style={{ padding: "15px 22px" }}>Guest &amp; Reservation</th>
                      <th style={{ padding: "15px 16px" }}>Suite &amp; Occupancy</th>
                      <th style={{ padding: "15px 16px" }}>Stay Schedule</th>
                      <th style={{ padding: "15px 16px" }}>Amount &amp; Payment</th>
                      <th style={{ padding: "15px 16px" }}>Status</th>
                      <th style={{ padding: "15px 22px", textAlign: "right" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBookings.map((b) => {
                      const guestName =
                        b.guest_name ||
                        `${b.guest_first_name || ""} ${b.guest_last_name || ""}`.trim() ||
                        "Valued Guest";
                      const guestEmail = b.guest_email || b.email || "—";
                      const initials = guestName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      const nights = calcNights(b.check_in, b.check_out);
                      const totalGuests =
                        b.guests || Number(b.adults || 1) + Number(b.children || 0);
                      const isOnline =
                        String(b.payment_method || "").toUpperCase() === "ONLINE";

                      return (
                        <tr key={b.id}>
                          {/* 1. Guest & Booking ID */}
                          <td style={{ padding: "16px 22px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "12px",
                                  background:
                                    "linear-gradient(135deg, #063B32, #061C2B)",
                                  color: "#C9A24B",
                                  display: "grid",
                                  placeItems: "center",
                                  fontWeight: 700,
                                  fontSize: "13px",
                                  flexShrink: 0,
                                  border: "1px solid rgba(201, 162, 75, 0.4)",
                                }}
                              >
                                {initials || "G"}
                              </div>
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "3px",
                                  }}
                                >
                                  <strong
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 700,
                                      color: "#061C2B",
                                    }}
                                  >
                                    {guestName}
                                  </strong>
                                  <span className="booking-id-badge">
                                    {formatBookingCode(b.id)}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: "11.5px",
                                    color: "#5B6964",
                                    display: "block",
                                  }}
                                >
                                  {guestEmail}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Suite & Occupancy */}
                          <td style={{ padding: "16px" }}>
                            <strong
                              style={{
                                display: "block",
                                color: "#061C2B",
                                fontSize: "13.5px",
                                marginBottom: "5px",
                              }}
                            >
                              {b.room_name || `Suite #${b.room_id}`}
                            </strong>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "999px",
                                  background: "rgba(6, 59, 50, 0.1)",
                                  color: "#063B32",
                                }}
                              >
                                {b.room_type || "SUITE"}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#5B6964",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Users size={12} color="#C9A24B" />
                                {totalGuests} Guests ·{" "}
                                {b.rooms_count > 1
                                  ? `${b.rooms_count} Rooms`
                                  : "1 Room"}
                              </span>
                            </div>
                          </td>

                          {/* 3. Stay Schedule (Check-in & Check-out cleanly separated) */}
                          <td style={{ padding: "16px" }}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "#F7F3E8",
                                padding: "6px 11px",
                                borderRadius: "10px",
                                border: "1px solid var(--color-border)",
                                marginBottom: "4px",
                              }}
                            >
                              <div style={{ fontSize: "12px", fontWeight: 700, color: "#061C2B" }}>
                                {formatDateDisplay(b.check_in)}
                              </div>
                              <ArrowRight size={12} color="#C9A24B" />
                              <div style={{ fontSize: "12px", fontWeight: 700, color: "#063B32" }}>
                                {formatDateDisplay(b.check_out)}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#5B6964",
                                paddingLeft: "2px",
                              }}
                            >
                              {nights} {nights === 1 ? "Night" : "Nights"} Stay
                            </div>
                          </td>

                          {/* 4. Amount & Payment Method */}
                          <td style={{ padding: "16px" }}>
                            <strong
                              style={{
                                display: "block",
                                fontFamily: "Playfair Display, serif",
                                color: "#063B32",
                                fontSize: "17px",
                                fontWeight: 700,
                                marginBottom: "4px",
                              }}
                            >
                              ${Number(b.total_price || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </strong>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#5B6964",
                              }}
                            >
                              <CreditCard size={12} color="#C9A24B" />
                              {isOnline ? "Online Payment" : "Pay at Hotel"}
                            </span>
                          </td>

                          {/* 5. Booking Status */}
                          <td style={{ padding: "16px" }}>
                            {renderStatusBadge(b.status)}
                          </td>

                          {/* 6. Actions */}
                          <td style={{ padding: "16px 22px" }}>
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setViewBooking(b)}
                                title="View Details"
                                className="table-action-btn btn-view"
                              >
                                <Eye size={14} />
                                <span>View</span>
                              </button>

                              {b.status === "PENDING" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setStatusConfirm({
                                        booking: b,
                                        nextStatus: "APPROVED",
                                        note: b.admin_note || "",
                                      })
                                    }
                                    title="Approve Booking"
                                    className="table-action-btn btn-approve"
                                  >
                                    <Check size={14} />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setStatusConfirm({
                                        booking: b,
                                        nextStatus: "REJECTED",
                                        note: b.admin_note || "",
                                      })
                                    }
                                    title="Reject Booking"
                                    className="table-action-btn btn-reject"
                                  >
                                    <X size={14} />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(b)}
                                title="Edit Booking"
                                className="table-action-btn btn-view"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteId(b.id)}
                                title="Delete Booking"
                                className="table-action-btn btn-reject"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Luxury Reservation Cards Grid View */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                {paginatedBookings.map((b) => {
                  const guestName =
                    b.guest_name ||
                    `${b.guest_first_name || ""} ${b.guest_last_name || ""}`.trim() ||
                    "Valued Guest";
                  const guestEmail = b.guest_email || b.email || "—";
                  const nights = calcNights(b.check_in, b.check_out);
                  const totalGuests =
                    b.guests || Number(b.adults || 1) + Number(b.children || 0);
                  const isOnline =
                    String(b.payment_method || "").toUpperCase() === "ONLINE";

                  return (
                    <article
                      key={b.id}
                      className="dashboard-card"
                      style={{
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "14px",
                        borderTop: "3px solid #C9A24B",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "4px",
                            }}
                          >
                            <span className="booking-id-badge">
                              {formatBookingCode(b.id)}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "999px",
                                background: "rgba(6, 59, 50, 0.1)",
                                color: "#063B32",
                              }}
                            >
                              {b.room_type || "SUITE"}
                            </span>
                          </div>
                          <h4
                            style={{
                              margin: "4px 0 2px",
                              fontFamily: "Playfair Display, serif",
                              fontSize: "18px",
                              color: "#061C2B",
                            }}
                          >
                            {guestName}
                          </h4>
                          <span style={{ fontSize: "12px", color: "#5B6964" }}>
                            {guestEmail}
                          </span>
                        </div>
                        {renderStatusBadge(b.status)}
                      </div>

                      <div
                        style={{
                          background: "#F7F3E8",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          border: "1px solid var(--color-border)",
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
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
                            Suite &amp; Guests
                          </span>
                          <strong style={{ fontSize: "12.5px", color: "#061C2B" }}>
                            {b.room_name || `Suite #${b.room_id}`}
                          </strong>
                          <small
                            style={{
                              display: "block",
                              fontSize: "11px",
                              color: "#5B6964",
                            }}
                          >
                            {b.rooms_count || 1} Room · {totalGuests} Guests
                          </small>
                        </div>
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
                            Check-In → Check-Out
                          </span>
                          <strong style={{ fontSize: "12px", color: "#061C2B" }}>
                            {formatDateDisplay(b.check_in)} –{" "}
                            {formatDateDisplay(b.check_out)}
                          </strong>
                          <small
                            style={{
                              display: "block",
                              fontSize: "11px",
                              color: "#063B32",
                              fontWeight: 600,
                            }}
                          >
                            {nights} {nights === 1 ? "Night" : "Nights"} ·{" "}
                            {isOnline ? "Online" : "Pay at Hotel"}
                          </small>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: "10px",
                          borderTop: "1px solid var(--color-border)",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "10px",
                              color: "#5B6964",
                              textTransform: "uppercase",
                              fontWeight: 700,
                            }}
                          >
                            Total Amount
                          </span>
                          <strong
                            style={{
                              fontFamily: "Playfair Display, serif",
                              fontSize: "20px",
                              color: "#063B32",
                            }}
                          >
                            ${Number(b.total_price || 0).toFixed(2)}
                          </strong>
                        </div>

                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setViewBooking(b)}
                            className="table-action-btn btn-view"
                          >
                            <Eye size={14} /> View
                          </button>
                          {b.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setStatusConfirm({
                                    booking: b,
                                    nextStatus: "APPROVED",
                                    note: b.admin_note || "",
                                  })
                                }
                                className="table-action-btn btn-approve"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setStatusConfirm({
                                    booking: b,
                                    nextStatus: "REJECTED",
                                    note: b.admin_note || "",
                                  })
                                }
                                className="table-action-btn btn-reject"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            className="table-action-btn btn-view"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(b.id)}
                            className="table-action-btn btn-reject"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 22px",
                background: "#F7F3E8",
                borderTop: "1px solid var(--color-border)",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#5B6964", fontWeight: 500 }}>
                Showing{" "}
                <strong style={{ color: "#061C2B" }}>
                  {(safePage - 1) * PAGE_SIZE + 1}
                </strong>{" "}
                to{" "}
                <strong style={{ color: "#061C2B" }}>
                  {Math.min(safePage * PAGE_SIZE, filteredBookings.length)}
                </strong>{" "}
                of{" "}
                <strong style={{ color: "#061C2B" }}>
                  {filteredBookings.length}
                </strong>{" "}
                reservations
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "#FFFFFF",
                    color: "#061C2B",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: safePage <= 1 ? "not-allowed" : "pointer",
                    opacity: safePage <= 1 ? 0.5 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor:
                          safePage === pageNum ? "#063B32" : "var(--color-border)",
                        background:
                          safePage === pageNum ? "#063B32" : "#FFFFFF",
                        color: safePage === pageNum ? "#C9A24B" : "#061C2B",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "#FFFFFF",
                    color: "#061C2B",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                    opacity: safePage >= totalPages ? 0.5 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* VIEW BOOKING DETAILS MODAL */}
      {viewBooking && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setViewBooking(null)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div>
                <span className="panel-eyebrow">
                  RESERVATION DETAILS · {formatBookingCode(viewBooking.id)}
                </span>
                <h4>{viewBooking.room_name || `Room #${viewBooking.room_id}`}</h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dashboard-modal-grid">
              <div>
                <span>Guest Name</span>
                <strong>
                  {viewBooking.guest_name ||
                    `${viewBooking.guest_first_name || ""} ${
                      viewBooking.guest_last_name || ""
                    }`.trim() ||
                    "Valued Guest"}
                </strong>
              </div>
              <div>
                <span>Booking Status</span>
                <div>{renderStatusBadge(viewBooking.status)}</div>
              </div>
              <div>
                <span>Email Address</span>
                <strong>{viewBooking.guest_email || viewBooking.email || "—"}</strong>
              </div>
              <div>
                <span>Phone Number</span>
                <strong>{viewBooking.guest_phone || viewBooking.phone || "—"}</strong>
              </div>
              <div>
                <span>Check-In Date</span>
                <strong>{formatDateDisplay(viewBooking.check_in)}</strong>
              </div>
              <div>
                <span>Check-Out Date</span>
                <strong>{formatDateDisplay(viewBooking.check_out)}</strong>
              </div>
              <div>
                <span>Rooms &amp; Guests</span>
                <strong>
                  {viewBooking.rooms_count || 1} Room(s) ·{" "}
                  {viewBooking.guests || 2} Guest(s)
                </strong>
              </div>
              <div>
                <span>Total Amount</span>
                <strong className="gold-price">
                  ${Number(viewBooking.total_price || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Front Desk & Housekeeping Child Bedding Brief (Shown when Child Ages exist) */}
            {viewBooking.child_ages && (() => {
              const cp = evaluateChildPolicy({
                childAges: viewBooking.child_ages,
                nights: Math.max(
                  1,
                  Math.round(
                    (new Date(viewBooking.check_out) - new Date(viewBooking.check_in)) /
                      (1000 * 60 * 60 * 24)
                  ) || 1
                ),
                residency: viewBooking.residency,
              });
              if (!cp.agesDisplay) return null;
              return (
                <div
                  style={{
                    background: "rgba(6, 59, 50, 0.06)",
                    padding: "11px 14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(6, 59, 50, 0.18)",
                    marginBottom: "12px",
                    fontSize: "12px",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "4px", color: "#063B32" }}>
                    Housekeeping Child Bedding Brief (Ages: {cp.agesDisplay})
                  </strong>
                  <span style={{ color: "#374151", display: "block" }}>
                    Prepare: {cp.housekeepingSummary || "Standard bedding"}
                    {Number(viewBooking.child_supplement) > 0
                      ? ` · Extra Bed Supplement: $${Number(viewBooking.child_supplement).toFixed(2)}`
                      : " · Complimentary"}
                  </span>
                </div>
              );
            })()}

            {viewBooking.special_requests && (
              <div
                style={{
                  background: "#F7F3E8",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  marginBottom: "14px",
                  fontSize: "12px",
                }}
              >
                <strong style={{ display: "block", marginBottom: "4px", color: "#061C2B" }}>
                  Special Requests:
                </strong>
                <span style={{ color: "#5B6964" }}>{viewBooking.special_requests}</span>
              </div>
            )}

            <div className="dashboard-modal-footer">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setViewBooking(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="dashboard-btn-primary"
                onClick={() => {
                  const target = viewBooking;
                  setViewBooking(null);
                  handleOpenEdit(target);
                }}
              >
                <Edit2 size={14} /> Edit Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE / REJECT CONFIRMATION MODAL */}
      {statusConfirm && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setStatusConfirm(null)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "440px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div>
                <span className="panel-eyebrow">CONFIRM STATUS UPDATE</span>
                <h4>
                  {statusConfirm.nextStatus === "APPROVED"
                    ? "Approve Reservation?"
                    : "Reject Reservation?"}
                </h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setStatusConfirm(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#5B6964", margin: "14px 0" }}>
              You are about to mark booking{" "}
              <strong style={{ color: "#061C2B" }}>
                {formatBookingCode(statusConfirm.booking.id)}
              </strong>{" "}
              for{" "}
              <strong style={{ color: "#061C2B" }}>
                {statusConfirm.booking.guest_name || "Guest"}
              </strong>{" "}
              as{" "}
              <strong
                style={{
                  color:
                    statusConfirm.nextStatus === "APPROVED"
                      ? "#063B32"
                      : "#9E3D30",
                }}
              >
                {statusConfirm.nextStatus}
              </strong>
              .
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#5B6964",
                  marginBottom: "6px",
                }}
              >
                ADMIN NOTE (OPTIONAL)
              </label>
              <input
                type="text"
                value={statusConfirm.note}
                onChange={(e) =>
                  setStatusConfirm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Add an optional note for this status change..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  fontSize: "12px",
                }}
              />
            </div>

            <div className="dashboard-modal-footer">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setStatusConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusUpdating}
                onClick={handleConfirmStatusChange}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    statusConfirm.nextStatus === "APPROVED"
                      ? "#063B32"
                      : "#9E3D30",
                  color:
                    statusConfirm.nextStatus === "APPROVED"
                      ? "#C9A24B"
                      : "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {statusUpdating
                  ? "Updating..."
                  : `Confirm ${statusConfirm.nextStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="dashboard-modal-card"
            style={{
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header" style={{ marginBottom: "16px" }}>
              <div>
                <span className="panel-eyebrow">
                  {modalMode === "create" ? "NEW RESERVATION" : "EDIT RESERVATION"}
                </span>
                <h4>
                  {modalMode === "create"
                    ? "Create Guest Reservation"
                    : `Update Booking ${formatBookingCode(currentBooking?.id)}`}
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
                  marginBottom: "14px",
                  fontSize: "12px",
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
              {/* Room Selection */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#5B6964",
                    marginBottom: "4px",
                  }}
                >
                  ROOM TYPE *
                </label>
                <select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    fontSize: "13px",
                    background: "#F7F3E8",
                  }}
                >
                  {roomOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (${r.price}/night)
                    </option>
                  ))}
                </select>
              </div>

              {/* Guest Names */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    FIRST NAME *
                  </label>
                  <input
                    type="text"
                    name="guest_first_name"
                    value={formData.guest_first_name}
                    onChange={handleFormChange}
                    required
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
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    LAST NAME
                  </label>
                  <input
                    type="text"
                    name="guest_last_name"
                    value={formData.guest_last_name}
                    onChange={handleFormChange}
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

              {/* Contact Email & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    name="guest_email"
                    value={formData.guest_email}
                    onChange={handleFormChange}
                    required
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
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    name="guest_phone"
                    value={formData.guest_phone}
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

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    CHECK-IN DATE *
                  </label>
                  <input
                    type="date"
                    name="check_in"
                    value={formData.check_in}
                    onChange={handleFormChange}
                    required
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
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    CHECK-OUT DATE *
                  </label>
                  <input
                    type="date"
                    name="check_out"
                    min={formData.check_in}
                    value={formData.check_out}
                    onChange={handleFormChange}
                    required
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

              {/* Guests, Rooms, Total Price */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1.2fr",
                  gap: "10px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    ADULTS
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="adults"
                    value={formData.adults}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    CHILDREN
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="children"
                    value={formData.children}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    ROOMS
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="rooms_count"
                    value={formData.rooms_count}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    TOTAL ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="total_price"
                    value={formData.total_price}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#063B32",
                    }}
                  />
                </div>
              </div>

              {/* Status and Payment */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    STATUS
                  </label>
                  <select
                    name="status"
                    value={formData.status}
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
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#5B6964",
                      marginBottom: "4px",
                    }}
                  >
                    PAYMENT METHOD
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
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
                    <option value="PAY_AT_HOTEL">Pay at Hotel</option>
                    <option value="ONLINE">Online Payment</option>
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#5B6964",
                    marginBottom: "4px",
                  }}
                >
                  SPECIAL REQUESTS / NOTES
                </label>
                <textarea
                  name="special_requests"
                  rows="2"
                  value={formData.special_requests}
                  onChange={handleFormChange}
                  placeholder="e.g. Late check-in, honeymoon setup, extra towels"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    fontSize: "12px",
                    resize: "vertical",
                  }}
                />
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
                    ? "Create Booking"
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
            style={{ maxWidth: "400px", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#F9E5E2",
                color: "#9E3D30",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 14px",
              }}
            >
              <Trash2 size={24} />
            </div>
            <h4
              style={{
                margin: "0 0 8px",
                fontFamily: "Playfair Display, serif",
                fontSize: "20px",
                color: "#061C2B",
              }}
            >
              Delete Reservation?
            </h4>
            <p style={{ margin: "0 0 20px", fontSize: "12.5px", color: "#5B6964" }}>
              Are you sure you want to permanently delete booking{" "}
              <strong style={{ color: "#061C2B" }}>
                {formatBookingCode(deleteId)}
              </strong>
              ? This action cannot be undone.
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
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#9E3D30",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsManagement;
