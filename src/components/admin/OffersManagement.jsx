import { useState, useEffect } from "react";
import {
  Tags,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Eye,
  LayoutGrid,
  List,
  RefreshCw,
  BedDouble,
} from "lucide-react";
import {
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../../services/offerAdminService";
import { getAllRoomsAdmin } from "../../services/roomAdminService";
import ImageUploadField from "./ImageUploadField";

const ROOM_OPTIONS = [
  { id: 1, name: "Deluxe Ocean Room" },
  { id: 2, name: "Private Pool Villa" },
  { id: 3, name: "Ocean Suite" },
  { id: 4, name: "Garden Villa" },
  { id: 5, name: "Family Suite" },
  { id: 6, name: "Sunset Villa" },
];

const CATEGORIES = [
  "ALL",
  "ROMANTIC ESCAPE",
  "LONG STAY",
  "EARLY BOOKING",
  "FAMILY SPECIAL",
  "WEEKEND SPECIAL",
  "WELLNESS",
];

const OffersManagement = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [viewOffer, setViewOffer] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [currentOffer, setCurrentOffer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [roomOptions, setRoomOptions] = useState(ROOM_OPTIONS);
  const [modalTab, setModalTab] = useState("details"); // 'details' | 'inclusions'
  const [newFeature, setNewFeature] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newOfferImage, setNewOfferImage] = useState("");

  // Form State
  const initialForm = {
    title: "",
    category: "ROMANTIC ESCAPE",
    subtitle: "",
    description: "",
    long_description: "",
    discount: "20% OFF",
    original_price: 250,
    discounted_price: 200,
    save_amount: "Save $50",
    valid_until: "2026-12-31",
    image_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85",
    images: [],
    features: ["Luxury room stay", "Breakfast for two", "Late checkout"],
    terms: ["Offer is subject to room availability.", "Advance reservation is required."],
    room_id: 1,
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [data, roomsList] = await Promise.all([
        getAllOffers(),
        getAllRoomsAdmin().catch(() => []),
      ]);
      setOffers(data);
      if (Array.isArray(roomsList) && roomsList.length > 0) {
        setRoomOptions(roomsList.map((r) => ({ id: r.id, name: r.room_name })));
      }
    } catch (err) {
      setError(err.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOffers = offers.filter((o) => {
    const matchesCat =
      selectedCategory === "ALL" || o.category?.toUpperCase() === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      o.title?.toLowerCase().includes(term) ||
      o.description?.toLowerCase().includes(term) ||
      o.category?.toLowerCase().includes(term);
    return matchesCat && matchesSearch;
  });

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData(initialForm);
    setModalTab("details");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setModalMode("edit");
    setCurrentOffer(offer);
    const defaultImg = offer.image_url || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85";
    setFormData({
      title: offer.title || "",
      category: offer.category || "ROMANTIC ESCAPE",
      subtitle: offer.subtitle || "",
      description: offer.description || "",
      long_description: offer.long_description || "",
      discount: offer.discount || "20% OFF",
      original_price: offer.original_price || 0,
      discounted_price: offer.discounted_price || 0,
      save_amount: offer.save_amount || "",
      valid_until: offer.valid_until ? offer.valid_until.slice(0, 10) : "",
      image_url: defaultImg,
      images: Array.isArray(offer.images) ? offer.images : [defaultImg],
      features: Array.isArray(offer.features) ? offer.features : ["Luxury room stay", "Breakfast for two"],
      terms: Array.isArray(offer.terms) ? offer.terms : ["Offer is subject to room availability."],
      room_id: offer.room_id || (roomOptions[0]?.id ?? 1),
      status: offer.status || "ACTIVE",
    });
    setModalTab("details");
    setFormError("");
    setIsModalOpen(true);
  };

  const addOfferListItem = (field, value, resetFn) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), trimmed],
    }));
    resetFn("");
  };

  const removeOfferListItem = (field, idx) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== idx),
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "original_price" || name === "discounted_price") {
        const orig = Number(name === "original_price" ? value : updated.original_price);
        const disc = Number(name === "discounted_price" ? value : updated.discounted_price);
        if (orig > disc && orig > 0) {
          updated.discount = `${Math.round(((orig - disc) / orig) * 100)}% OFF`;
          updated.save_amount = `Save $${(orig - disc).toFixed(0)}`;
        }
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
        await createOffer(formData);
      } else {
        await updateOffer(currentOffer.id, formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || "Failed to save offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteOffer(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleToggleOfferStatus = async (offer) => {
    const nextStatus = offer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateOffer(offer.id, {
        ...offer,
        status: nextStatus,
      });
      await loadData();
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  const totalOffers = offers.length;
  const activeOffers = offers.filter((o) => o.status === "ACTIVE").length;
  const inactiveOffers = offers.filter((o) => o.status !== "ACTIVE").length;
  const uniqueCategories = new Set(offers.map((o) => o.category).filter(Boolean)).size;

  const formatValidDate = (val) => {
    if (!val) return "Ongoing";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className="offers-management-view"
      style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* 1. Executive KPI Summary Strip */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
          gap: "16px",
        }}
      >
        {[
          {
            label: "Total Special Offers",
            value: totalOffers,
            sub: "Curated hotel packages",
            icon: Tags,
            iconBg: "rgba(6, 59, 50, 0.1)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Active Promotions",
            value: activeOffers,
            sub: "Live on public website",
            icon: CheckCircle2,
            iconBg: "rgba(6, 59, 50, 0.12)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Offer Categories",
            value: uniqueCategories,
            sub: "Seasonal & member themes",
            icon: Sparkles,
            iconBg: "rgba(201, 162, 75, 0.2)",
            iconColor: "#8A6414",
            accent: "#C9A24B",
          },
          {
            label: "Paused / Inactive",
            value: inactiveOffers,
            sub: "Hidden from guests",
            icon: Calendar,
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

      {/* 2. Top Header, View Switcher, Category Filters & Search */}
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
            <span className="panel-eyebrow">PROMOTIONS &amp; PACKAGES</span>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "22px",
                color: "#061C2B",
                margin: "2px 0 4px",
              }}
            >
              Special Offers &amp; Exclusive Packages
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)" }}>
              Create, update, and manage promotional hotel packages and discounts.
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
                <LayoutGrid size={14} /> Offer Cards
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
              <Plus size={16} /> New Offer
            </button>
          </div>
        </div>

        {/* Category Filter Pills & Search Bar */}
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
                  ? offers.length
                  : offers.filter((o) => o.category?.toUpperCase() === cat).length;
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
                  <span>{cat === "ALL" ? "All Offers" : cat}</span>
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
              placeholder="Search offers by title, category, or perks..."
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

      {/* 3. Offers Cards Grid / Executive Table */}
      {loading ? (
        <div
          className="dashboard-card"
          style={{ padding: "48px", textAlign: "center", color: "var(--color-muted)" }}
        >
          Loading promotional offers...
        </div>
      ) : error ? (
        <div
          className="dashboard-card"
          style={{ padding: "36px", color: "#9E3D30", textAlign: "center" }}
        >
          <AlertCircle size={24} style={{ marginBottom: "8px" }} />
          <div>{error}</div>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div
          className="dashboard-card"
          style={{ padding: "48px", textAlign: "center", color: "var(--color-muted)" }}
        >
          No promotional offers found matching your criteria.
        </div>
      ) : viewMode === "cards" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredOffers.map((offer) => {
            const isActive = offer.status === "ACTIVE";
            const featuresList = Array.isArray(offer.features) ? offer.features : [];
            const linkedRoomName =
              offer.room_name ||
              roomOptions.find((r) => Number(r.id) === Number(offer.room_id))?.name ||
              "Selected Suites";

            return (
              <article
                key={offer.id}
                className="dashboard-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  overflow: "hidden",
                  padding: 0,
                }}
              >
                <div>
                  {/* Card Image Banner */}
                  <div
                    style={{
                      height: "205px",
                      position: "relative",
                      overflow: "hidden",
                      background: "#E8ECE9",
                    }}
                  >
                    <img
                      src={
                        offer.image_url ||
                        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
                      }
                      alt={offer.title}
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

                    {/* Top Left Discount Tag */}
                    <span
                      style={{
                        position: "absolute",
                        top: "14px",
                        left: "14px",
                        background: "linear-gradient(135deg, #C9A24B, #b58d35)",
                        color: "#061C2B",
                        fontWeight: 800,
                        fontSize: "11px",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        letterSpacing: "0.6px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
                      }}
                    >
                      {offer.discount}
                    </span>

                    {/* Top Right Status Badge */}
                    <span
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        background: isActive ? "#063B32" : "#F9E5E2",
                        color: isActive ? "#C9A24B" : "#9E3D30",
                        fontWeight: 800,
                        fontSize: "10px",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        letterSpacing: "0.6px",
                        border: isActive
                          ? "1px solid rgba(201,162,75,0.45)"
                          : "1px solid #F1C8C1",
                      }}
                    >
                      {offer.status}
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
                        {offer.category}
                      </span>
                      <h3
                        style={{
                          margin: "2px 0 0",
                          fontFamily: "Playfair Display, serif",
                          fontSize: "20px",
                          color: "#FFFFFF",
                          fontWeight: 600,
                        }}
                      >
                        {offer.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "18px 20px" }}>
                    {/* Price & Savings Strip */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
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
                          Package Rate
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          {Number(offer.original_price) > 0 && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#8C9690",
                                textDecoration: "line-through",
                              }}
                            >
                              ${Number(offer.original_price).toFixed(0)}
                            </span>
                          )}
                          <strong
                            style={{
                              fontFamily: "Playfair Display, serif",
                              fontSize: "21px",
                              color: "#063B32",
                            }}
                          >
                            ${Number(offer.discounted_price || 0).toFixed(0)}
                          </strong>
                          <small style={{ fontSize: "10.5px", color: "#5B6964" }}>
                            / night
                          </small>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "11px",
                            color: "#063B32",
                            background: "rgba(6, 59, 50, 0.1)",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontWeight: 700,
                            marginBottom: "3px",
                          }}
                        >
                          {offer.save_amount || "Member Privilege"}
                        </span>
                        <small
                          style={{
                            display: "block",
                            fontSize: "10.5px",
                            color: "#5B6964",
                          }}
                        >
                          Until {formatValidDate(offer.valid_until)}
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
                      {offer.description}
                    </p>

                    {/* Linked Room & Inclusions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        color: "#061C2B",
                        marginBottom: "10px",
                      }}
                    >
                      <BedDouble size={14} color="#C9A24B" />
                      <span>Linked Suite: {linkedRoomName}</span>
                    </div>

                    {featuresList.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {featuresList.slice(0, 3).map((feat, i) => (
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
                            ✓ {feat}
                          </span>
                        ))}
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
                    onClick={() => handleToggleOfferStatus(offer)}
                    className="table-action-btn"
                    style={{
                      background: "#FFFFFF",
                      borderColor: "var(--color-border)",
                      color: isActive ? "#8A6414" : "#063B32",
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{isActive ? "Pause Offer" : "Set Active"}</span>
                  </button>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setViewOffer(offer)}
                      className="table-action-btn btn-view"
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(offer)}
                      className="table-action-btn btn-approve"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(offer.id)}
                      className="table-action-btn btn-reject"
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
                  <th style={{ padding: "15px 22px" }}>Offer &amp; Category</th>
                  <th style={{ padding: "15px 16px" }}>Linked Suite</th>
                  <th style={{ padding: "15px 16px" }}>Valid Until</th>
                  <th style={{ padding: "15px 16px" }}>Pricing &amp; Discount</th>
                  <th style={{ padding: "15px 16px" }}>Status</th>
                  <th style={{ padding: "15px 22px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => {
                  const isActive = offer.status === "ACTIVE";
                  const linkedRoomName =
                    offer.room_name ||
                    roomOptions.find((r) => Number(r.id) === Number(offer.room_id))
                      ?.name ||
                    "Selected Suites";

                  return (
                    <tr key={offer.id}>
                      <td style={{ padding: "14px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={
                              offer.image_url ||
                              "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
                            }
                            alt={offer.title}
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
                              {offer.title}
                            </strong>
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 700,
                                color: "#C9A24B",
                                letterSpacing: "0.8px",
                              }}
                            >
                              {offer.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ fontSize: "12.5px", color: "#061C2B" }}>
                          {linkedRoomName}
                        </strong>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#061C2B" }}>
                          {formatValidDate(offer.valid_until)}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "11.5px",
                              color: "#8C9690",
                              textDecoration: "line-through",
                            }}
                          >
                            ${Number(offer.original_price || 0).toFixed(0)}
                          </span>
                          <strong
                            style={{
                              fontFamily: "Playfair Display, serif",
                              fontSize: "16px",
                              color: "#063B32",
                            }}
                          >
                            ${Number(offer.discounted_price || 0).toFixed(0)}
                          </strong>
                        </div>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            color: "#8A6414",
                          }}
                        >
                          {offer.discount} · {offer.save_amount || "Special"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          className={
                            isActive
                              ? "dashboard-status dashboard-status-approved"
                              : "dashboard-status dashboard-status-rejected"
                          }
                        >
                          {offer.status}
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
                            onClick={() => setViewOffer(offer)}
                            className="table-action-btn btn-view"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(offer)}
                            className="table-action-btn btn-approve"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(offer.id)}
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

      {/* VIEW OFFER DETAILS MODAL */}
      {viewOffer && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setViewOffer(null)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div>
                <span className="panel-eyebrow">
                  {viewOffer.category} · {viewOffer.discount}
                </span>
                <h4>{viewOffer.title}</h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewOffer(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                margin: "14px 0",
                height: "195px",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
              }}
            >
              <img
                src={
                  viewOffer.image_url ||
                  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
                }
                alt={viewOffer.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div className="dashboard-modal-grid">
              <div>
                <span>Offer Price</span>
                <strong className="gold-price">
                  ${Number(viewOffer.discounted_price || 0).toFixed(0)} / night
                </strong>
              </div>
              <div>
                <span>Regular Rate &amp; Savings</span>
                <strong>
                  ${Number(viewOffer.original_price || 0).toFixed(0)} ·{" "}
                  {viewOffer.save_amount || viewOffer.discount}
                </strong>
              </div>
              <div>
                <span>Valid Until</span>
                <strong>{formatValidDate(viewOffer.valid_until)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{viewOffer.status}</strong>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "#5B6964", lineHeight: 1.6 }}>
              {viewOffer.long_description || viewOffer.description}
            </p>

            {Array.isArray(viewOffer.features) && viewOffer.features.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <strong
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    color: "#061C2B",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Package Inclusions:
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {viewOffer.features.map((f, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "#F7F3E8",
                        border: "1px solid var(--color-border)",
                        color: "#063B32",
                      }}
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="dashboard-modal-footer">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setViewOffer(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="dashboard-btn-primary"
                onClick={() => {
                  const target = viewOffer;
                  setViewOffer(null);
                  handleOpenEdit(target);
                }}
              >
                <Edit2 size={14} /> Edit Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 28, 43, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "28px",
            }}
          >
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
              <h3
                style={{
                  margin: 0,
                  fontFamily: "Playfair Display, serif",
                  fontSize: "20px",
                  color: "var(--color-emerald-dark)",
                }}
              >
                {modalMode === "create" ? "Add Promotional Offer" : "Update Promotional Offer"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--color-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: "#f8e9e6",
                  color: "#a14f42",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "12px",
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Modal Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  borderBottom: "1px solid #EDF0EC",
                  paddingBottom: "10px",
                }}
              >
                {[
                  { id: "details", label: "Offer Details & Pricing" },
                  { id: "inclusions", label: "Inclusions, Terms & Gallery" },
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

              {modalTab === "details" && (
                <>
              {/* Title & Subtitle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                    OFFER TITLE *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g. A Romantic Getaway"
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D6D2",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                    LUXURY SUBTITLE
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleFormChange}
                    placeholder="e.g. Create unforgettable moments together."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D6D2",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              {/* Category and Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                    CATEGORY
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D6D2",
                      fontSize: "13px",
                      background: "#FAFAFA",
                    }}
                  >
                    <option value="ROMANTIC ESCAPE">ROMANTIC ESCAPE</option>
                    <option value="LONG STAY">LONG STAY</option>
                    <option value="EARLY BOOKING">EARLY BOOKING</option>
                    <option value="FAMILY SPECIAL">FAMILY SPECIAL</option>
                    <option value="WEEKEND SPECIAL">WEEKEND SPECIAL</option>
                    <option value="WELLNESS">WELLNESS</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                    STATUS
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D6D2",
                      fontSize: "13px",
                      background: "#FAFAFA",
                    }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Prices and Discount */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                    REGULAR PRICE ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D6D2",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                    OFFER PRICE ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="discounted_price"
                    value={formData.discounted_price}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D6D2",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--color-emerald-dark)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                    DISCOUNT TAG
                  </label>
                  <input
                    type="text"
                    name="discount"
                    value={formData.discount}
                    onChange={handleFormChange}
                    placeholder="20% OFF"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D6D2",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              {/* Linked Room and Valid Until Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                    LINKED ROOM TYPE
                  </label>
                  <select
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D6D2",
                      fontSize: "13px",
                      background: "#FAFAFA",
                    }}
                  >
                    {roomOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                    VALID UNTIL DATE
                  </label>
                  <input
                    type="date"
                    name="valid_until"
                    value={formData.valid_until}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D6D2",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              {/* Cover Image (Direct File Upload or Image URL) */}
              <ImageUploadField
                label="Offer Cover Image"
                folder="offers"
                value={formData.image_url}
                onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
              />

              {/* Short Description (Shown on Offer Cards & Previews) */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                  SHORT DESCRIPTION (OFFER CARDS &amp; PREVIEWS)
                </label>
                <textarea
                  name="description"
                  rows="2"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Concise 1-2 sentence summary displayed on offer cards..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D0D6D2",
                    fontSize: "12px",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Long Detailed Description (Shown on Offer Details Page) */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "4px" }}>
                  DETAILED DESCRIPTION (OFFER DETAILS PAGE)
                </label>
                <textarea
                  name="long_description"
                  rows="4"
                  value={formData.long_description}
                  onChange={handleFormChange}
                  placeholder="Full editorial description displayed on the Offer Details page (perks, dining, spa & exclusive experience)..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D0D6D2",
                    fontSize: "12px",
                    resize: "vertical",
                  }}
                />
              </div>
                </>
              )}

              {modalTab === "inclusions" && (
                <>
                  {/* Package Features / Inclusions */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "6px" }}>
                      PACKAGE INCLUSIONS / FEATURES ({(formData.features || []).length})
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px", maxHeight: "110px", overflowY: "auto" }}>
                      {(formData.features || []).map((feat, idx) => (
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
                          <span>✓ {feat}</span>
                          <button
                            type="button"
                            onClick={() => removeOfferListItem("features", idx)}
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
                        placeholder="e.g. Complimentary Spa Voucher"
                        style={{
                          flex: 1,
                          padding: "7px 10px",
                          borderRadius: "8px",
                          border: "1px solid #D0D6D2",
                          fontSize: "12px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addOfferListItem("features", newFeature, setNewFeature)}
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

                  {/* Terms & Conditions */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "6px" }}>
                      TERMS &amp; CONDITIONS ({(formData.terms || []).length})
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px", maxHeight: "110px", overflowY: "auto" }}>
                      {(formData.terms || []).map((term, idx) => (
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
                          <span>• {term}</span>
                          <button
                            type="button"
                            onClick={() => removeOfferListItem("terms", idx)}
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
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        placeholder="e.g. Advance reservation is required."
                        style={{
                          flex: 1,
                          padding: "7px 10px",
                          borderRadius: "8px",
                          border: "1px solid #D0D6D2",
                          fontSize: "12px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addOfferListItem("terms", newTerm, setNewTerm)}
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

                  {/* Offer Gallery Images */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "var(--color-muted)", marginBottom: "6px" }}>
                      OFFER GALLERY IMAGES ({(formData.images || []).length})
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px", maxHeight: "95px", overflowY: "auto" }}>
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
                            onClick={() => removeOfferListItem("images", idx)}
                            style={{ border: "none", background: "transparent", color: "#A14F42", cursor: "pointer" }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <ImageUploadField
                      mode="append"
                      label="Add Offer Gallery Photo"
                      folder="offers"
                      placeholder="Paste gallery image URL..."
                      onAddImage={(url) =>
                        setFormData((prev) => ({
                          ...prev,
                          images: [...(prev.images || []), url],
                        }))
                      }
                    />
                  </div>
                </>
              )}

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "8px",
                    border: "1px solid #D0D6D2",
                    background: "white",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: "11px",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--color-emerald-dark)",
                    color: "white",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(6, 59, 50, 0.25)",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create Offer"
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
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 28, 43, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#f8e9e6",
                color: "#a14f42",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <Trash2 size={24} />
            </div>
            <h4 style={{ margin: "0 0 8px", fontSize: "16px", color: "var(--color-text)" }}>
              Delete Offer?
            </h4>
            <p style={{ margin: "0 0 20px", fontSize: "12px", color: "var(--color-muted)" }}>
              Are you sure you want to delete this promotional package? It will no longer appear on the website.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "8px",
                  border: "1px solid #D0D6D2",
                  background: "white",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#a14f42",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersManagement;
