import { useState, useEffect } from "react";
import {
  BedDouble,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Maximize2,
  DollarSign,
  CheckCircle2,
  Wrench,
  X,
  AlertCircle,
  Eye,
  LayoutGrid,
  List,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  getAllRoomsAdmin,
  createRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
} from "../../services/roomAdminService";
import ImageUploadField from "./ImageUploadField";

const ROOM_TYPES = ["ALL", "DELUXE", "SUITE", "FAMILY", "STANDARD"];

const DEFAULT_IMAGES = {
  1: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800",
  2: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=800",
  3: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800",
  4: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800",
  5: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800",
  6: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800",
};

const RoomsManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [viewRoom, setViewRoom] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [modalTab, setModalTab] = useState("basic"); // 'basic' | 'luxury' | 'media'
  const [newAmenity, setNewAmenity] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  const PRESET_AMENITIES = [
    "Balcony",
    "Private Pool",
    "Free Wi-Fi",
    "Air Conditioning",
    "In-room Dining",
    "Breakfast Included",
    "Living Area",
    "Terrace",
  ];

  const initialForm = {
    room_name: "",
    room_type: "DELUXE",
    category: "Deluxe Rooms",
    allowed_package: "All Rooms & Suites",
    guests_label: "2 Adults",
    view_type: "Ocean View",
    description: "",
    long_description: "",
    room_overview: "",
    special_features: [],
    amenities: ["Free Wi-Fi", "Air Conditioning"],
    price_per_night: 280,
    resident_price_per_night: 210,
    child_extra_bed_price: 25,
    resident_child_extra_bed_price: 15,
    capacity: 2,
    bed_type: "King Bed",
    size_sqm: 45,
    total_units: 8,
    image_url:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800",
    video_url: "",
    images: [],
    gallery_images: [],
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllRoomsAdmin();
      setRooms(data);
    } catch (err) {
      setError(err.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRooms = rooms.filter((r) => {
    const matchesType =
      typeFilter === "ALL" || r.room_type?.toUpperCase() === typeFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      r.room_name?.toLowerCase().includes(term) ||
      r.room_type?.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term);
    return matchesType && matchesSearch;
  });

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData(initialForm);
    setModalTab("basic");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setModalMode("edit");
    setCurrentRoom(room);
    const defaultImg = room.image_url || DEFAULT_IMAGES[room.id] || DEFAULT_IMAGES[1];
    setFormData({
      room_name: room.room_name || "",
      room_type: room.room_type || "DELUXE",
      category: room.category || "Deluxe Rooms",
      allowed_package: room.allowed_package || "All Rooms & Suites",
      guests_label: room.guests_label || `${room.capacity || 2} Adults`,
      view_type: room.view_type || "Ocean View",
      description: room.description || "",
      long_description: room.long_description || "",
      room_overview: room.room_overview || "",
      special_features: Array.isArray(room.special_features) ? room.special_features : [],
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
      price_per_night: Number(room.price_per_night) || 280,
      resident_price_per_night:
        Number(room.resident_price_per_night) || Math.round((Number(room.price_per_night) || 280) * 0.75),
      child_extra_bed_price:
        room.child_extra_bed_price !== null && room.child_extra_bed_price !== undefined
          ? Number(room.child_extra_bed_price)
          : 25,
      resident_child_extra_bed_price:
        room.resident_child_extra_bed_price !== null && room.resident_child_extra_bed_price !== undefined
          ? Number(room.resident_child_extra_bed_price)
          : 15,
      capacity: Number(room.capacity) || 2,
      bed_type: room.bed_type || "King Bed",
      size_sqm: Number(room.size_sqm) || 45,
      total_units: Number(room.total_units) || 8,
      image_url: defaultImg,
      video_url: room.video_url || "",
      images: Array.isArray(room.images) ? room.images : [defaultImg],
      gallery_images: Array.isArray(room.gallery_images) ? room.gallery_images : [],
      status: room.status || "ACTIVE",
    });
    setModalTab("basic");
    setFormError("");
    setIsModalOpen(true);
  };

  const toggleAmenity = (item) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter((a) => a !== item)
        : [...prev.amenities, item],
    }));
  };

  const addListItem = (field, value, resetFn) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), trimmed],
    }));
    resetFn("");
  };

  const removeListItem = (field, idx) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== idx),
    }));
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
        await createRoom(formData);
      } else {
        await updateRoom(currentRoom.id, formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || "Failed to save room");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (room) => {
    const nextStatus = room.status === "ACTIVE" ? "MAINTENANCE" : "ACTIVE";
    try {
      await updateRoomStatus(room.id, nextStatus);
      await loadData();
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteRoom(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // Summary counts
  const totalRoomTypes = rooms.length;
  const totalUnits = rooms.reduce((s, r) => s + (Number(r.total_units) || 0), 0);
  const activeCount = rooms.filter((r) => r.status === "ACTIVE").length;
  const maintenanceCount = rooms.filter((r) => r.status === "MAINTENANCE").length;

  return (
    <div
      className="rooms-management-view"
      style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* 1. Executive Summary Strip */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
          gap: "16px",
        }}
      >
        {[
          {
            label: "Total Suite Categories",
            value: totalRoomTypes,
            sub: "Configured room types",
            icon: BedDouble,
            iconBg: "rgba(6, 59, 50, 0.1)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Total Inventory Units",
            value: totalUnits,
            sub: "Physical rooms across resort",
            icon: Sparkles,
            iconBg: "rgba(201, 162, 75, 0.2)",
            iconColor: "#8A6414",
            accent: "#C9A24B",
          },
          {
            label: "Active & Bookable",
            value: activeCount,
            sub: "Open for online reservations",
            icon: CheckCircle2,
            iconBg: "rgba(6, 59, 50, 0.12)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Under Maintenance",
            value: maintenanceCount,
            sub: "Temporarily paused",
            icon: Wrench,
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

      {/* 2. Header, View Switcher, Filter Pills & Search */}
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
            <span className="panel-eyebrow">ACCOMMODATION INVENTORY</span>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "22px",
                color: "#061C2B",
                margin: "2px 0 4px",
              }}
            >
              Rooms, Suites &amp; Private Villas
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)" }}>
              Manage suite categories, residency rates, and inventory units.
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
                <LayoutGrid size={14} /> Suite Cards
              </button>
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
              <Plus size={16} /> Add New Suite
            </button>
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
            {ROOM_TYPES.map((type) => {
              const active = typeFilter === type;
              const count =
                type === "ALL"
                  ? rooms.length
                  : rooms.filter((r) => r.room_type?.toUpperCase() === type).length;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
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
                  <span>{type === "ALL" ? "All Suites" : type}</span>
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
              placeholder="Search rooms by name, type, or view..."
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

      {/* 3. Rooms Cards / Executive Table */}
      {loading ? (
        <div
          className="dashboard-card"
          style={{
            padding: "48px",
            textAlign: "center",
            color: "var(--color-muted)",
          }}
        >
          Loading hotel rooms &amp; suites...
        </div>
      ) : error ? (
        <div
          className="dashboard-card"
          style={{ padding: "36px", textAlign: "center", color: "#9E3D30" }}
        >
          <AlertCircle size={24} style={{ marginBottom: "8px" }} />
          <p>{error}</p>
          <button className="dashboard-btn-primary" onClick={loadData}>
            Retry
          </button>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div
          className="dashboard-card"
          style={{
            padding: "48px",
            textAlign: "center",
            color: "var(--color-muted)",
          }}
        >
          <BedDouble size={32} style={{ marginBottom: "10px", opacity: 0.5 }} />
          <p>No rooms match your filter criteria.</p>
        </div>
      ) : viewMode === "cards" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredRooms.map((room) => {
            const imgSrc =
              room.image_url ||
              DEFAULT_IMAGES[room.id] ||
              DEFAULT_IMAGES[1];
            const isMaintenance = room.status === "MAINTENANCE";
            const nonResPrice = Number(room.price_per_night) || 280;
            const resPrice =
              Number(room.resident_price_per_night) ||
              Math.round(nonResPrice * 0.75);
            const childBedIntl =
              room.child_extra_bed_price !== null && room.child_extra_bed_price !== undefined
                ? Number(room.child_extra_bed_price)
                : 25;
            const childBedRes =
              room.resident_child_extra_bed_price !== null && room.resident_child_extra_bed_price !== undefined
                ? Number(room.resident_child_extra_bed_price)
                : 15;
            const isKidsStayFree = childBedIntl === 0 && childBedRes === 0;
            const amenitiesList = Array.isArray(room.amenities)
              ? room.amenities
              : [];

            return (
              <article
                key={room.id}
                className="dashboard-card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div>
                  {/* Cover Image Header */}
                  <div
                    style={{
                      position: "relative",
                      height: "210px",
                      background: "#E8ECE9",
                    }}
                  >
                    <img
                      src={imgSrc}
                      alt={room.room_name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(6,28,43,0.75) 0%, rgba(6,28,43,0.1) 55%, rgba(6,28,43,0.35) 100%)",
                      }}
                    />

                    {/* Top Left Badges */}
                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        left: "14px",
                        display: "flex",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          background: "rgba(6, 28, 43, 0.88)",
                          color: "#C9A24B",
                          padding: "5px 11px",
                          borderRadius: "999px",
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "1px",
                          border: "1px solid rgba(201,162,75,0.4)",
                        }}
                      >
                        {room.room_type}
                      </span>
                      {room.view_type && (
                        <span
                          style={{
                            background: "rgba(255, 255, 255, 0.9)",
                            color: "#061C2B",
                            padding: "5px 10px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {room.view_type}
                        </span>
                      )}
                    </div>

                    {/* Top Right Status Badge */}
                    <span
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        background: isMaintenance ? "#F9E5E2" : "#063B32",
                        color: isMaintenance ? "#9E3D30" : "#C9A24B",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.6px",
                        border: isMaintenance
                          ? "1px solid #F1C8C1"
                          : "1px solid rgba(201,162,75,0.45)",
                      }}
                    >
                      {room.status}
                    </span>

                    {/* Bottom Image Overlay: Title & Category */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "16px",
                        right: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#C9A24B",
                            fontWeight: 700,
                            letterSpacing: "1.4px",
                            textTransform: "uppercase",
                            display: "block",
                          }}
                        >
                          {room.category || "Luxury Collection"}
                        </span>
                        <h3
                          style={{
                            margin: "2px 0 0",
                            fontFamily: "Playfair Display, serif",
                            fontSize: "21px",
                            color: "#FFFFFF",
                            fontWeight: 600,
                          }}
                        >
                          {room.room_name}
                        </h3>
                      </div>
                      <span
                        style={{
                          background: "rgba(255,255,255,0.16)",
                          backdropFilter: "blur(6px)",
                          color: "#FFFFFF",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.25)",
                        }}
                      >
                        {room.total_units || 5} Units
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "18px 20px" }}>
                    {/* Dual Rate Strip: Non-Resident vs Sri Lankan Resident */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
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
                          Non-Resident Rate
                        </span>
                        <strong
                          style={{
                            fontFamily: "Playfair Display, serif",
                            fontSize: "19px",
                            color: "#061C2B",
                          }}
                        >
                          ${nonResPrice.toFixed(0)}
                        </strong>
                        <small style={{ fontSize: "10px", color: "#5B6964" }}>
                          {" "}
                          / night
                        </small>
                      </div>
                      <div
                        style={{
                          borderLeft: "1px solid var(--color-border)",
                          paddingLeft: "12px",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#063B32",
                            textTransform: "uppercase",
                          }}
                        >
                          Resident Rate (NIC)
                        </span>
                        <strong
                          style={{
                            fontFamily: "Playfair Display, serif",
                            fontSize: "19px",
                            color: "#063B32",
                          }}
                        >
                          ${resPrice.toFixed(0)}
                        </strong>
                        <small style={{ fontSize: "10px", color: "#5B6964" }}>
                          {" "}
                          / night
                        </small>
                      </div>
                    </div>

                    {/* Per-Room Child Extra Bed Rate (Ages 6–11) Indicator */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        marginBottom: "14px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: isKidsStayFree ? "rgba(6, 59, 50, 0.08)" : "#FAF8F4",
                        border: isKidsStayFree
                          ? "1px solid rgba(6, 59, 50, 0.25)"
                          : "1px solid rgba(201, 162, 75, 0.35)",
                        color: isKidsStayFree ? "#063B32" : "#5B6964",
                      }}
                    >
                      <span>Child Extra Bed (6–11 yrs)</span>
                      <span style={{ color: isKidsStayFree ? "#063B32" : "#061C2B" }}>
                        {isKidsStayFree
                          ? "Kids Stay Free ($0)"
                          : `+$${childBedIntl.toFixed(0)} Intl · +$${childBedRes.toFixed(0)} NIC / night`}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "12.5px",
                        color: "#5B6964",
                        lineHeight: 1.55,
                        margin: "0 0 14px 0",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {room.description ||
                        "Luxury coastal suite with bespoke furnishings and panoramic views."}
                    </p>

                    {/* Specs Row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "8px",
                        padding: "10px 12px",
                        background: "#FFFFFF",
                        border: "1px solid var(--color-border)",
                        borderRadius: "10px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        color: "#061C2B",
                        marginBottom: "12px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Users size={13} color="#C9A24B" />
                        {room.capacity || 2} Guests
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <BedDouble size={13} color="#C9A24B" />
                        {room.bed_type || "King Bed"}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Maximize2 size={13} color="#C9A24B" />
                        {room.size_sqm ? `${Number(room.size_sqm)} m²` : "45 m²"}
                      </span>
                    </div>

                    {/* Amenities Pills */}
                    {amenitiesList.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {amenitiesList.slice(0, 4).map((am, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 600,
                              padding: "3px 9px",
                              borderRadius: "999px",
                              background: "rgba(6, 59, 50, 0.08)",
                              color: "#063B32",
                            }}
                          >
                            {am}
                          </span>
                        ))}
                        {amenitiesList.length > 4 && (
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "999px",
                              background: "#F7F3E8",
                              color: "#5B6964",
                            }}
                          >
                            +{amenitiesList.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
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
                    onClick={() => handleToggleStatus(room)}
                    className="table-action-btn"
                    style={{
                      background: "#FFFFFF",
                      borderColor: "var(--color-border)",
                      color: isMaintenance ? "#063B32" : "#8A6414",
                    }}
                  >
                    {isMaintenance ? (
                      <>
                        <CheckCircle2 size={13} /> Set Active
                      </>
                    ) : (
                      <>
                        <Wrench size={13} /> Maintenance
                      </>
                    )}
                  </button>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setViewRoom(room)}
                      className="table-action-btn btn-view"
                      title="View Suite Details"
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(room)}
                      className="table-action-btn btn-approve"
                      title="Edit Suite"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(room.id)}
                      className="table-action-btn btn-reject"
                      title="Delete Suite"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Spacious Executive List View */
        <section className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ padding: "15px 22px" }}>Suite &amp; Category</th>
                  <th style={{ padding: "15px 16px" }}>Specifications</th>
                  <th style={{ padding: "15px 16px" }}>Inventory</th>
                  <th style={{ padding: "15px 16px" }}>Nightly Rates</th>
                  <th style={{ padding: "15px 16px" }}>Status</th>
                  <th style={{ padding: "15px 22px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => {
                  const imgSrc =
                    room.image_url ||
                    DEFAULT_IMAGES[room.id] ||
                    DEFAULT_IMAGES[1];
                  const isMaintenance = room.status === "MAINTENANCE";
                  const nonResPrice = Number(room.price_per_night) || 280;
                  const resPrice =
                    Number(room.resident_price_per_night) ||
                    Math.round(nonResPrice * 0.75);

                  return (
                    <tr key={room.id}>
                      <td style={{ padding: "14px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={imgSrc}
                            alt={room.room_name}
                            style={{
                              width: "64px",
                              height: "46px",
                              borderRadius: "10px",
                              objectFit: "cover",
                              border: "1px solid var(--color-border)",
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <strong
                              style={{
                                display: "block",
                                fontSize: "14px",
                                color: "#061C2B",
                              }}
                            >
                              {room.room_name}
                            </strong>
                            <span style={{ fontSize: "11px", color: "#5B6964" }}>
                              {room.category || room.room_type} ·{" "}
                              {room.view_type || "Ocean View"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#061C2B" }}>
                          {room.bed_type || "King Bed"} ·{" "}
                          {room.size_sqm ? `${Number(room.size_sqm)} m²` : "45 m²"}
                        </div>
                        <small style={{ fontSize: "11px", color: "#5B6964" }}>
                          Up to {room.capacity || 2} Guests
                        </small>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span className="booking-id-badge">
                          {room.total_units || 5} Units
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <strong
                          style={{
                            display: "block",
                            fontFamily: "Playfair Display, serif",
                            fontSize: "16px",
                            color: "#061C2B",
                          }}
                        >
                          ${nonResPrice.toFixed(0)}{" "}
                          <small
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "10px",
                              color: "#5B6964",
                            }}
                          >
                            Non-Res
                          </small>
                        </strong>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: "#063B32",
                          }}
                        >
                          ${resPrice.toFixed(0)} Resident (NIC)
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          className={
                            isMaintenance
                              ? "dashboard-status dashboard-status-rejected"
                              : "dashboard-status dashboard-status-approved"
                          }
                        >
                          {room.status}
                        </span>
                      </td>

                      <td style={{ padding: "14px 22px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "6px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setViewRoom(room)}
                            className="table-action-btn btn-view"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(room)}
                            className="table-action-btn btn-view"
                          >
                            {isMaintenance ? "Set Active" : "Maintenance"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(room)}
                            className="table-action-btn btn-approve"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(room.id)}
                            className="table-action-btn btn-reject"
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

      {/* VIEW ROOM DETAILS MODAL */}
      {viewRoom && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setViewRoom(null)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div>
                <span className="panel-eyebrow">
                  {viewRoom.category || viewRoom.room_type} ·{" "}
                  {viewRoom.view_type || "Ocean View"}
                </span>
                <h4>{viewRoom.room_name}</h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewRoom(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                margin: "14px 0",
                height: "200px",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
              }}
            >
              <img
                src={
                  viewRoom.image_url ||
                  DEFAULT_IMAGES[viewRoom.id] ||
                  DEFAULT_IMAGES[1]
                }
                alt={viewRoom.room_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div className="dashboard-modal-grid">
              <div>
                <span>Non-Resident Rate</span>
                <strong className="gold-price">
                  ${Number(viewRoom.price_per_night || 280).toFixed(0)} / night
                </strong>
              </div>
              <div>
                <span>Sri Lankan Resident Rate</span>
                <strong className="gold-price">
                  $
                  {(
                    Number(viewRoom.resident_price_per_night) ||
                    Math.round(Number(viewRoom.price_per_night || 280) * 0.75)
                  ).toFixed(0)}{" "}
                  / night
                </strong>
              </div>
              <div>
                <span>Bed &amp; Size</span>
                <strong>
                  {viewRoom.bed_type || "King Bed"} ·{" "}
                  {viewRoom.size_sqm ? `${Number(viewRoom.size_sqm)} m²` : "45 m²"}
                </strong>
              </div>
              <div>
                <span>Inventory &amp; Capacity</span>
                <strong>
                  {viewRoom.total_units || 5} Units · Up to{" "}
                  {viewRoom.capacity || 2} Guests
                </strong>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "#5B6964", lineHeight: 1.6 }}>
              {viewRoom.room_overview ||
                viewRoom.long_description ||
                viewRoom.description}
            </p>

            <div className="dashboard-modal-footer">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setViewRoom(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="dashboard-btn-primary"
                onClick={() => {
                  const target = viewRoom;
                  setViewRoom(null);
                  handleOpenEdit(target);
                }}
              >
                <Edit2 size={14} /> Edit Suite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Room Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 28, 43, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "26px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                paddingBottom: "12px",
                borderBottom: "1px solid #EDF0EC",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily: "Playfair Display, serif",
                  fontSize: "21px",
                  color: "var(--color-emerald-dark)",
                }}
              >
                {modalMode === "create" ? "Add New Room / Suite" : "Update Room Details"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--color-muted)",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: "#F8E9E6",
                  color: "#A14F42",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  marginBottom: "14px",
                }}
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmitForm}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* Modal Section Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  borderBottom: "1px solid #EDF0EC",
                  paddingBottom: "10px",
                }}
              >
                {[
                  { id: "basic", label: "Basic & Pricing" },
                  { id: "luxury", label: "Luxury Details & Amenities" },
                  { id: "media", label: "Media & Gallery" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalTab(tab.id)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: modalTab === tab.id ? "var(--color-emerald-dark)" : "#DCE2DC",
                      background: modalTab === tab.id ? "var(--color-emerald-dark)" : "#F8F9F8",
                      color: modalTab === tab.id ? "var(--color-gold-luxury)" : "#5A6560",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {modalTab === "basic" && (
                <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Room Name *
                  </label>
                  <input
                    type="text"
                    name="room_name"
                    value={formData.room_name}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Royal Ocean Villa"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Website Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  >
                    <option value="Deluxe Rooms">Deluxe Rooms</option>
                    <option value="Pool Villas">Pool Villas</option>
                    <option value="Suites">Suites</option>
                    <option value="Villas">Villas</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Room Type Code *
                  </label>
                  <select
                    name="room_type"
                    value={formData.room_type}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  >
                    <option value="DELUXE">DELUXE</option>
                    <option value="SUITE">SUITE</option>
                    <option value="VILLA">VILLA</option>
                    <option value="FAMILY">FAMILY</option>
                    <option value="STANDARD">STANDARD</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    View Type
                  </label>
                  <select
                    name="view_type"
                    value={formData.view_type}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  >
                    <option value="Ocean View">Ocean View</option>
                    <option value="Pool View">Pool View</option>
                    <option value="Garden View">Garden View</option>
                    <option value="Lagoon View">Lagoon View</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Allowed Package
                  </label>
                  <select
                    name="allowed_package"
                    value={formData.allowed_package}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  >
                    <option value="All Rooms & Suites">All Rooms &amp; Suites</option>
                    <option value="Honeymoon & Romantic Getaway">Honeymoon &amp; Romantic Getaway</option>
                    <option value="Luxury Private Pool Villa">Luxury Private Pool Villa</option>
                    <option value="Wellness & Ayurveda Retreat">Wellness &amp; Ayurveda Retreat</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                  Short Description (Card Summary)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe the luxury room experience and views..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #DCE2DC",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "10px",
                }}
              >
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Non-Resident ($) *
                  </label>
                  <input
                    type="number"
                    name="price_per_night"
                    min="1"
                    value={formData.price_per_night}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Resident Rate ($) *
                  </label>
                  <input
                    type="number"
                    name="resident_price_per_night"
                    min="1"
                    value={formData.resident_price_per_night}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Max Guests *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    max="12"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Guests Label
                  </label>
                  <input
                    type="text"
                    name="guests_label"
                    value={formData.guests_label}
                    onChange={handleFormChange}
                    placeholder="2 Adults"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Total Units *
                  </label>
                  <input
                    type="number"
                    name="total_units"
                    min="1"
                    max="100"
                    value={formData.total_units}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              {/* Per-Room Child Extra Bed Pricing (Ages 6–11 · Supports $0 for Family Suites) */}
              <div
                style={{
                  background: "#FAF8F4",
                  border: "1px solid rgba(201, 162, 75, 0.4)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#063B32", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    Child Extra Rollaway Bed Rates (Ages 6–11)
                  </span>
                  <span style={{ fontSize: "10.5px", color: "#5B6964", fontWeight: 600 }}>
                    0–5 yrs always free · Set $0 for Family Suites (Kids Stay Free)
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px", color: "#061C2B" }}>
                      Non-Resident Extra Bed ($ / night) *
                    </label>
                    <input
                      type="number"
                      name="child_extra_bed_price"
                      min="0"
                      step="1"
                      value={formData.child_extra_bed_price}
                      onChange={handleFormChange}
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #DCE2DC",
                        background: "#FFFFFF",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px", color: "#063B32" }}>
                      Resident Extra Bed — NIC ($ / night) *
                    </label>
                    <input
                      type="number"
                      name="resident_child_extra_bed_price"
                      min="0"
                      step="1"
                      value={formData.resident_child_extra_bed_price}
                      onChange={handleFormChange}
                      required
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #DCE2DC",
                        background: "#FFFFFF",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Bed Configuration
                  </label>
                  <input
                    type="text"
                    name="bed_type"
                    value={formData.bed_type}
                    onChange={handleFormChange}
                    placeholder="King Bed"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Room Size (m²)
                  </label>
                  <input
                    type="number"
                    name="size_sqm"
                    value={formData.size_sqm}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #DCE2DC",
                      fontSize: "13px",
                    }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
              </div>
                </>
              )}

              {modalTab === "luxury" && (
                <>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                      Long Description (Room Details Hero)
                    </label>
                    <textarea
                      name="long_description"
                      rows={3}
                      value={formData.long_description}
                      onChange={handleFormChange}
                      placeholder="Step into a world of elegance..."
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #DCE2DC",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                      Room Overview (Overview Tab Content)
                    </label>
                    <textarea
                      name="room_overview"
                      rows={3}
                      value={formData.room_overview}
                      onChange={handleFormChange}
                      placeholder="Immerse yourself in absolute coastal elegance..."
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #DCE2DC",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                      Amenities (Click to Toggle or Add Custom)
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                      {Array.from(new Set([...PRESET_AMENITIES, ...(formData.amenities || [])])).map((am) => {
                        const active = (formData.amenities || []).includes(am);
                        return (
                          <button
                            key={am}
                            type="button"
                            onClick={() => toggleAmenity(am)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              border: "1px solid",
                              borderColor: active ? "var(--color-emerald-dark)" : "#DCE2DC",
                              background: active ? "var(--color-emerald-dark)" : "#F8F9F8",
                              color: active ? "white" : "#5A6560",
                            }}
                          >
                            {active ? "✓ " : "+ "}
                            {am}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        placeholder="Add custom amenity (e.g. Butler Service)"
                        style={{
                          flex: 1,
                          padding: "7px 10px",
                          borderRadius: "8px",
                          border: "1px solid #DCE2DC",
                          fontSize: "12px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addListItem("amenities", newAmenity, setNewAmenity)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: "8px",
                          border: "none",
                          background: "var(--color-gold-luxury)",
                          color: "var(--color-navy-deep)",
                          fontWeight: 700,
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                      Special Features (Highlights List)
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                      {(formData.special_features || []).map((feat, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#F8F9F8",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        >
                          <span>• {feat}</span>
                          <button
                            type="button"
                            onClick={() => removeListItem("special_features", idx)}
                            style={{ border: "none", background: "transparent", color: "#A14F42", cursor: "pointer" }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="e.g. Private balcony with ocean view"
                        style={{
                          flex: 1,
                          padding: "7px 10px",
                          borderRadius: "8px",
                          border: "1px solid #DCE2DC",
                          fontSize: "12px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addListItem("special_features", newFeature, setNewFeature)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: "8px",
                          border: "none",
                          background: "var(--color-gold-luxury)",
                          color: "var(--color-navy-deep)",
                          fontWeight: 700,
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </>
              )}

              {modalTab === "media" && (
                <>
                  <ImageUploadField
                    label="Primary Cover Image *"
                    folder="rooms"
                    value={formData.image_url}
                    onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
                  />

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "5px" }}>
                      Video Walkthrough URL (MP4)
                    </label>
                    <input
                      type="text"
                      name="video_url"
                      value={formData.video_url}
                      onChange={handleFormChange}
                      placeholder="https://assets.mixkit.co/videos/..."
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid #DCE2DC",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                      Room Slider Images ({(formData.images || []).length})
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px", maxHeight: "110px", overflowY: "auto" }}>
                      {(formData.images || []).map((url, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#F8F9F8",
                            padding: "5px 10px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            gap: "8px",
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
                          <button
                            type="button"
                            onClick={() => removeListItem("images", idx)}
                            style={{ border: "none", background: "transparent", color: "#A14F42", cursor: "pointer" }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <ImageUploadField
                      mode="append"
                      label="Add Slider Image"
                      folder="rooms"
                      placeholder="Paste slider image URL..."
                      onAddImage={(url) =>
                        setFormData((prev) => ({
                          ...prev,
                          images: [...(prev.images || []), url],
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                      Gallery Showcase Images ({(formData.gallery_images || []).length})
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px", maxHeight: "100px", overflowY: "auto" }}>
                      {(formData.gallery_images || []).map((url, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#F8F9F8",
                            padding: "5px 10px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            gap: "8px",
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
                          <button
                            type="button"
                            onClick={() => removeListItem("gallery_images", idx)}
                            style={{ border: "none", background: "transparent", color: "#A14F42", cursor: "pointer" }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <ImageUploadField
                      mode="append"
                      label="Add Gallery Showcase Photo"
                      folder="rooms"
                      placeholder="Paste gallery showcase image URL..."
                      onAddImage={(url) =>
                        setFormData((prev) => ({
                          ...prev,
                          gallery_images: [...(prev.gallery_images || []), url],
                        }))
                      }
                    />
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #DCE2DC",
                    background: "white",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--color-emerald-dark)",
                    color: "var(--color-gold-luxury)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create Room"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 28, 43, 0.65)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", color: "var(--color-emerald-dark)" }}>
              Delete Room?
            </h3>
            <p style={{ fontSize: "12px", color: "var(--color-muted)", marginBottom: "20px" }}>
              Are you sure you want to permanently remove this room category?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid #DCE2DC",
                  background: "white",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#A14F42",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsManagement;
