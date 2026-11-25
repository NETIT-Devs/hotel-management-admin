import { useState, useEffect, useMemo } from "react";
import {
  TicketPercent,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Calendar,
  RefreshCw,
  LayoutGrid,
  List,
  X,
  AlertCircle,
  Sparkles,
  Power,
} from "lucide-react";
import {
  getAllPromoCodesAdmin,
  createPromoCode,
  updatePromoCode,
  togglePromoCodeStatus,
  deletePromoCode,
} from "../../services/promoAdminService";
import { getAllRoomsAdmin } from "../../services/roomAdminService";

const STATUS_FILTERS = [
  { key: "ALL", label: "All Codes" },
  { key: "ACTIVE", label: "Active" },
  { key: "INACTIVE", label: "Paused" },
  { key: "EXPIRED", label: "Expired" },
];

const formatDateShort = (val) => {
  if (!val) return "No Expiry";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isPromoExpired = (p) => {
  if (!p.valid_until) return false;
  const end = new Date(p.valid_until).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return today > end;
};

const PromoCodesManagement = () => {
  const [promos, setPromos] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [copiedId, setCopiedId] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentPromo, setCurrentPromo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const initialForm = {
    code: "",
    title: "",
    discount_type: "PERCENTAGE",
    discount_value: 15,
    max_discount: "",
    min_nights: 1,
    min_amount: 0,
    applicable_room_id: "",
    residency_type: "ALL",
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: "2027-12-31",
    max_uses: 100,
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [promosData, roomsData] = await Promise.all([
        getAllPromoCodesAdmin(),
        getAllRoomsAdmin().catch(() => []),
      ]);
      setPromos(promosData);
      if (Array.isArray(roomsData)) setRooms(roomsData);
    } catch (err) {
      setError(err.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const expired = isPromoExpired(p);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "EXPIRED"
          ? expired
          : statusFilter === "ACTIVE"
          ? p.status === "ACTIVE" && !expired
          : p.status === "INACTIVE");

      const term = searchTerm.trim().toLowerCase();
      if (!term) return matchesStatus;
      return (
        matchesStatus &&
        (p.code?.toLowerCase().includes(term) ||
          p.title?.toLowerCase().includes(term) ||
          p.residency_type?.toLowerCase().includes(term))
      );
    });
  }, [promos, statusFilter, searchTerm]);

  const handleCopy = (p) => {
    navigator.clipboard?.writeText(p.code);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData(initialForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setModalMode("edit");
    setCurrentPromo(p);
    setFormData({
      code: p.code || "",
      title: p.title || "",
      discount_type: p.discount_type || "PERCENTAGE",
      discount_value: Number(p.discount_value) || 10,
      max_discount: p.max_discount !== null && p.max_discount !== undefined ? p.max_discount : "",
      min_nights: Number(p.min_nights) || 1,
      min_amount: Number(p.min_amount) || 0,
      applicable_room_id: p.applicable_room_id || "",
      residency_type: p.residency_type || "ALL",
      valid_from: p.valid_from ? String(p.valid_from).slice(0, 10) : "",
      valid_until: p.valid_until ? String(p.valid_until).slice(0, 10) : "",
      max_uses: p.max_uses !== null && p.max_uses !== undefined ? p.max_uses : "",
      status: p.status || "ACTIVE",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase().replace(/\s+/g, "") : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    try {
      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        max_discount: formData.max_discount === "" ? null : Number(formData.max_discount),
        min_nights: Number(formData.min_nights) || 1,
        min_amount: Number(formData.min_amount) || 0,
        applicable_room_id: formData.applicable_room_id ? Number(formData.applicable_room_id) : null,
        max_uses: formData.max_uses === "" ? null : Number(formData.max_uses),
      };
      if (modalMode === "create") {
        await createPromoCode(payload);
      } else {
        await updatePromoCode(currentPromo.id, payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || "Failed to save promo code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (p) => {
    const next = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await togglePromoCodeStatus(p.id, next);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deletePromoCode(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalCodes = promos.length;
  const activeCount = promos.filter((p) => p.status === "ACTIVE" && !isPromoExpired(p)).length;
  const totalRedemptions = promos.reduce((sum, p) => sum + (Number(p.used_count) || 0), 0);
  const pausedOrExpired = promos.filter((p) => p.status !== "ACTIVE" || isPromoExpired(p)).length;

  const getTabCount = (key) => {
    if (key === "ALL") return promos.length;
    if (key === "EXPIRED") return promos.filter(isPromoExpired).length;
    if (key === "ACTIVE") return activeCount;
    return promos.filter((p) => p.status === "INACTIVE").length;
  };

  return (
    <div
      className="promo-management-view"
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
            label: "Total Promo Codes",
            value: totalCodes,
            sub: "Configured discount campaigns",
            icon: TicketPercent,
            iconBg: "rgba(6, 59, 50, 0.1)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Active & Valid",
            value: activeCount,
            sub: "Live for guest checkout",
            icon: CheckCircle2,
            iconBg: "rgba(6, 59, 50, 0.12)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Total Redemptions",
            value: totalRedemptions,
            sub: "Applied on bookings",
            icon: Sparkles,
            iconBg: "rgba(201, 162, 75, 0.2)",
            iconColor: "#8A6414",
            accent: "#C9A24B",
          },
          {
            label: "Paused / Expired",
            value: pausedOrExpired,
            sub: "Inactive campaigns",
            icon: XCircle,
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

      {/* 2. Top Header, View Switcher, Filter Pills & Search */}
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
            <span className="panel-eyebrow">MARKETING &amp; VOUCHER ENGINE</span>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "22px",
                color: "#061C2B",
                margin: "2px 0 4px",
              }}
            >
              Hotel Promo Codes &amp; Vouchers
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)" }}>
              Create percentage or fixed discount codes with stay rules, residency limits, and usage tracking.
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
                <LayoutGrid size={14} /> Voucher Cards
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
              <Plus size={16} /> New Promo Code
            </button>
          </div>
        </div>

        {/* Status Pills & Search */}
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
            {STATUS_FILTERS.map((tab) => {
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
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: active ? "#063B32" : "#F7F3E8",
                    color: active ? "#C9A24B" : "#061C2B",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
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
                    {getTabCount(tab.key)}
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
              placeholder="Search code, campaign name, or residency..."
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
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#5B6964" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Promo Codes Table / Cards */}
      {loading ? (
        <div className="dashboard-card" style={{ padding: "48px", textAlign: "center", color: "var(--color-muted)" }}>
          Loading promo codes...
        </div>
      ) : error ? (
        <div className="dashboard-card" style={{ padding: "36px", textAlign: "center", color: "#9E3D30" }}>
          <AlertCircle size={24} style={{ marginBottom: "8px" }} />
          <p>{error}</p>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="dashboard-card" style={{ padding: "48px", textAlign: "center", color: "var(--color-muted)" }}>
          No promo codes match your filter.
        </div>
      ) : viewMode === "table" ? (
        <section className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ padding: "15px 22px" }}>Promo Code &amp; Campaign</th>
                  <th style={{ padding: "15px 16px" }}>Discount Benefit</th>
                  <th style={{ padding: "15px 16px" }}>Eligibility Rules</th>
                  <th style={{ padding: "15px 16px" }}>Validity &amp; Usage</th>
                  <th style={{ padding: "15px 16px" }}>Status</th>
                  <th style={{ padding: "15px 22px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPromos.map((p) => {
                  const expired = isPromoExpired(p);
                  const isActive = p.status === "ACTIVE" && !expired;
                  const discountLabel =
                    p.discount_type === "PERCENTAGE"
                      ? `${Number(p.discount_value)}% OFF`
                      : `$${Number(p.discount_value).toFixed(0)} OFF`;

                  return (
                    <tr key={p.id}>
                      <td style={{ padding: "16px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "13px",
                              fontWeight: 800,
                              letterSpacing: "1px",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              background: "#063B32",
                              color: "#C9A24B",
                              border: "1px solid rgba(201,162,75,0.45)",
                            }}
                          >
                            {p.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p)}
                            title="Copy code"
                            style={{
                              border: "1px solid var(--color-border)",
                              background: "#F7F3E8",
                              borderRadius: "6px",
                              padding: "4px 6px",
                              cursor: "pointer",
                              color: "#063B32",
                            }}
                          >
                            {copiedId === p.id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <span style={{ fontSize: "12px", color: "#5B6964" }}>{p.title}</span>
                      </td>

                      <td style={{ padding: "16px" }}>
                        <strong
                          style={{
                            fontFamily: "Playfair Display, serif",
                            fontSize: "17px",
                            color: "#063B32",
                            display: "block",
                          }}
                        >
                          {discountLabel}
                        </strong>
                        {p.max_discount && (
                          <small style={{ fontSize: "11px", color: "#5B6964" }}>
                            Cap: ${Number(p.max_discount).toFixed(0)} max
                          </small>
                        )}
                      </td>

                      <td style={{ padding: "16px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#061C2B" }}>
                          Min {p.min_nights || 1} {Number(p.min_nights) === 1 ? "Night" : "Nights"}
                          {Number(p.min_amount) > 0 ? ` · Min $${Number(p.min_amount).toFixed(0)}` : ""}
                        </div>
                        <small style={{ fontSize: "11px", color: "#5B6964" }}>
                          {p.residency_type === "ALL" ? "All Guests" : `${p.residency_type} Only`} ·{" "}
                          {p.applicable_room_name || "All Suites"}
                        </small>
                      </td>

                      <td style={{ padding: "16px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#061C2B" }}>
                          Until {formatDateShort(p.valid_until)}
                        </div>
                        <small style={{ fontSize: "11px", color: "#5B6964" }}>
                          Used: <strong>{p.used_count || 0}</strong> / {p.max_uses || "∞"}
                        </small>
                      </td>

                      <td style={{ padding: "16px" }}>
                        <span
                          className={
                            isActive
                              ? "dashboard-status dashboard-status-approved"
                              : "dashboard-status dashboard-status-rejected"
                          }
                        >
                          {expired ? "EXPIRED" : p.status}
                        </span>
                      </td>

                      <td style={{ padding: "16px 22px" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            className="table-action-btn btn-view"
                          >
                            <Power size={13} />
                            <span>{p.status === "ACTIVE" ? "Pause" : "Activate"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="table-action-btn btn-approve"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(p.id)}
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
      ) : (
        /* Voucher Cards View */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredPromos.map((p) => {
            const expired = isPromoExpired(p);
            const isActive = p.status === "ACTIVE" && !expired;
            const discountLabel =
              p.discount_type === "PERCENTAGE"
                ? `${Number(p.discount_value)}% OFF`
                : `$${Number(p.discount_value).toFixed(0)} OFF`;

            return (
              <article
                key={p.id}
                className="dashboard-card"
                style={{
                  padding: "20px",
                  borderTop: `3px solid ${isActive ? "#C9A24B" : "#9E3D30"}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "14px",
                          fontWeight: 800,
                          letterSpacing: "1px",
                          padding: "5px 12px",
                          borderRadius: "8px",
                          background: "#063B32",
                          color: "#C9A24B",
                        }}
                      >
                        {p.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(p)}
                        style={{
                          border: "1px solid var(--color-border)",
                          background: "#F7F3E8",
                          borderRadius: "6px",
                          padding: "5px 7px",
                          cursor: "pointer",
                          color: "#063B32",
                        }}
                      >
                        {copiedId === p.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <h4 style={{ margin: "2px 0", fontFamily: "Playfair Display, serif", fontSize: "18px", color: "#061C2B" }}>
                      {p.title}
                    </h4>
                  </div>
                  <span
                    className={
                      isActive
                        ? "dashboard-status dashboard-status-approved"
                        : "dashboard-status dashboard-status-rejected"
                    }
                  >
                    {expired ? "EXPIRED" : p.status}
                  </span>
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
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#5B6964", display: "block" }}>
                      DISCOUNT
                    </span>
                    <strong style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", color: "#063B32" }}>
                      {discountLabel}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#5B6964", display: "block" }}>
                      REDEMPTIONS
                    </span>
                    <strong style={{ fontSize: "15px", color: "#061C2B" }}>
                      {p.used_count || 0} / {p.max_uses || "∞"}
                    </strong>
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "#5B6964", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span>• Min {p.min_nights || 1} night(s) {Number(p.min_amount) > 0 ? `· Min spend $${Number(p.min_amount).toFixed(0)}` : ""}</span>
                  <span>• {p.residency_type === "ALL" ? "All Guests" : `${p.residency_type} Guests Only`} · {p.applicable_room_name || "All Suites"}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={12} color="#C9A24B" /> Valid until {formatDateShort(p.valid_until)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "10px",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(p)}
                    className="table-action-btn btn-view"
                  >
                    <Power size={13} /> {p.status === "ACTIVE" ? "Pause" : "Activate"}
                  </button>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="table-action-btn btn-approve"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(p.id)}
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
      )}

      {/* CREATE / EDIT PROMO MODAL */}
      {isModalOpen && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header" style={{ marginBottom: "16px" }}>
              <div>
                <span className="panel-eyebrow">
                  {modalMode === "create" ? "NEW CAMPAIGN" : "EDIT CAMPAIGN"}
                </span>
                <h4>
                  {modalMode === "create" ? "Create Promo Code" : `Edit ${currentPromo?.code}`}
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
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    PROMO CODE *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. SERENITY25"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    CAMPAIGN TITLE *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Summer Luxury Escape"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    DISCOUNT TYPE
                  </label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
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
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    VALUE ({formData.discount_type === "PERCENTAGE" ? "%" : "$"}) *
                  </label>
                  <input
                    type="number"
                    name="discount_value"
                    min="1"
                    value={formData.discount_value}
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
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    MAX CAP ($)
                  </label>
                  <input
                    type="number"
                    name="max_discount"
                    value={formData.max_discount}
                    onChange={handleFormChange}
                    placeholder="Optional"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    MIN NIGHTS
                  </label>
                  <input
                    type="number"
                    name="min_nights"
                    min="1"
                    value={formData.min_nights}
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
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    MIN SPEND ($)
                  </label>
                  <input
                    type="number"
                    name="min_amount"
                    min="0"
                    value={formData.min_amount}
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
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    MAX USES
                  </label>
                  <input
                    type="number"
                    name="max_uses"
                    min="1"
                    value={formData.max_uses}
                    onChange={handleFormChange}
                    placeholder="Unlimited"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    APPLICABLE SUITE
                  </label>
                  <select
                    name="applicable_room_id"
                    value={formData.applicable_room_id}
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
                    <option value="">All Rooms &amp; Suites</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.room_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    GUEST RESIDENCY
                  </label>
                  <select
                    name="residency_type"
                    value={formData.residency_type}
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
                    <option value="ALL">All Guests</option>
                    <option value="Resident">Sri Lankan Residents Only</option>
                    <option value="Non-Resident">Non-Residents Only</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    VALID FROM
                  </label>
                  <input
                    type="date"
                    name="valid_from"
                    value={formData.valid_from}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "12.5px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    VALID UNTIL
                  </label>
                  <input
                    type="date"
                    name="valid_until"
                    value={formData.valid_until}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "12.5px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#5B6964", display: "block", marginBottom: "4px" }}>
                    STATUS
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                      background: "#F7F3E8",
                    }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
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
                    ? "Create Promo Code"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
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
            <h4 style={{ margin: "0 0 8px", fontFamily: "Playfair Display, serif", fontSize: "20px", color: "#061C2B" }}>
              Delete Promo Code?
            </h4>
            <p style={{ margin: "0 0 20px", fontSize: "12.5px", color: "#5B6964" }}>
              This promo code will no longer be redeemable by guests.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodesManagement;
