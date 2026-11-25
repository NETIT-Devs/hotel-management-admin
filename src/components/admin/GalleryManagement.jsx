import { useState, useEffect, useMemo } from "react";
import {
  Image as ImageIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  Upload,
  Link as LinkIcon,
  X,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  getAllGalleryAdmin,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from "../../services/galleryAdminService";

const CATEGORIES = ["ALL", "Rooms & Suites", "Facilities", "Dining", "Resort Life"];

const GalleryManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [viewPhoto, setViewPhoto] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentItem, setCurrentItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const [uploadMode, setUploadMode] = useState("file"); // 'file' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const initialForm = {
    title: "",
    category: "Rooms & Suites",
    caption: "",
    image_url: "",
    is_featured: false,
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllGalleryAdmin();
      setItems(data);
    } catch (err) {
      setError(err.message || "Failed to load gallery photos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat =
        categoryFilter === "ALL" || item.category === categoryFilter;
      const term = searchTerm.trim().toLowerCase();
      if (!term) return matchesCat;
      return (
        matchesCat &&
        (item.title?.toLowerCase().includes(term) ||
          item.caption?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term))
      );
    });
  }, [items, categoryFilter, searchTerm]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData(initialForm);
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadMode("file");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode("edit");
    setCurrentItem(item);
    setFormData({
      title: item.title || "",
      category: item.category || "Resort Life",
      caption: item.caption || "",
      image_url: item.image_url || "",
      is_featured: Boolean(item.is_featured),
      status: item.status || "ACTIVE",
    });
    setSelectedFile(null);
    setPreviewUrl(item.image_url || "");
    setUploadMode("url");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
    try {
      await updateGalleryItem(item.id, {
        title: item.title,
        category: item.category,
        caption: item.caption || "",
        image_url: item.image_url,
        is_featured: Boolean(item.is_featured),
        status: nextStatus,
      });
      await loadData();
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (modalMode === "create" && uploadMode === "file" && !selectedFile) {
      setFormError("Please choose an image file or switch to Image URL.");
      return;
    }
    if (uploadMode === "url" && !formData.image_url.trim()) {
      setFormError("Please provide an image URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        file: uploadMode === "file" ? selectedFile : null,
      };
      if (modalMode === "create") {
        await createGalleryItem(payload);
      } else {
        await updateGalleryItem(currentItem.id, payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || "Failed to save gallery photo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteGalleryItem(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const totalCount = items.length;
  const activeCount = items.filter((i) => i.status === "ACTIVE").length;
  const featuredCount = items.filter((i) => Boolean(i.is_featured)).length;
  const hiddenCount = items.filter((i) => i.status !== "ACTIVE").length;

  return (
    <div
      className="gallery-management-view"
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
            label: "Total Resort Photos",
            value: totalCount,
            sub: "Curated visual moments",
            icon: ImageIcon,
            iconBg: "rgba(6, 59, 50, 0.1)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Published (Active)",
            value: activeCount,
            sub: "Visible on public gallery",
            icon: CheckCircle2,
            iconBg: "rgba(6, 59, 50, 0.12)",
            iconColor: "#063B32",
            accent: "#063B32",
          },
          {
            label: "Featured on Home",
            value: featuredCount,
            sub: "Highlighted showcase photos",
            icon: Star,
            iconBg: "rgba(201, 162, 75, 0.2)",
            iconColor: "#8A6414",
            accent: "#C9A24B",
          },
          {
            label: "Hidden / Archived",
            value: hiddenCount,
            sub: "Unpublished items",
            icon: EyeOff,
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
            <span className="panel-eyebrow">VISUAL CURATION &amp; MEDIA</span>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "22px",
                color: "#061C2B",
                margin: "2px 0 4px",
              }}
            >
              Resort Photo Gallery
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)" }}>
              Upload high-resolution photos or paste image URLs to curate the public Gallery page.
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
                <LayoutGrid size={14} /> Photo Cards
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
              <Plus size={16} /> Add Photo
            </button>
          </div>
        </div>

        {/* Category Filter Pills & Search */}
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
              const active = categoryFilter === cat;
              const count =
                cat === "ALL"
                  ? items.length
                  : items.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
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
                  <span>{cat === "ALL" ? "All Photos" : cat}</span>
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
              placeholder="Search photos by title, caption, or category..."
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

      {/* 3. Gallery Cards Grid / Executive Table */}
      {error && (
        <div
          className="dashboard-card"
          style={{ color: "#9E3D30", padding: "16px 20px" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="dashboard-card"
          style={{ textAlign: "center", padding: "48px", color: "var(--color-muted)" }}
        >
          Loading resort gallery photos...
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="dashboard-card"
          style={{ textAlign: "center", padding: "48px", color: "var(--color-muted)" }}
        >
          <ImageIcon
            size={36}
            style={{ color: "var(--color-gold-luxury)", marginBottom: "10px" }}
          />
          <p style={{ margin: 0 }}>No gallery photos match your filter criteria.</p>
        </div>
      ) : viewMode === "cards" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredItems.map((item) => {
            const isActive = item.status === "ACTIVE";
            const isFeatured = Boolean(item.is_featured);

            return (
              <article
                key={item.id}
                className="dashboard-card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      position: "relative",
                      height: "205px",
                      background: "#E8ECE9",
                    }}
                  >
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(6,28,43,0.82) 0%, rgba(6,28,43,0.1) 55%, rgba(6,28,43,0.35) 100%)",
                      }}
                    />

                    {/* Top Left Category Pill */}
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
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "5px 12px",
                          borderRadius: "999px",
                          letterSpacing: "0.7px",
                          border: "1px solid rgba(201,162,75,0.4)",
                        }}
                      >
                        {item.category}
                      </span>
                      {isFeatured && (
                        <span
                          style={{
                            background: "linear-gradient(135deg, #C9A24B, #b58d35)",
                            color: "#061C2B",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "5px 10px",
                            borderRadius: "999px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Star size={11} /> Featured
                        </span>
                      )}
                    </div>

                    {/* Top Right Status Pill */}
                    <span
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        background: isActive ? "#063B32" : "#F9E5E2",
                        color: isActive ? "#C9A24B" : "#9E3D30",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.6px",
                        border: isActive
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
                      <h3
                        style={{
                          margin: 0,
                          fontFamily: "Playfair Display, serif",
                          fontSize: "19px",
                          color: "#FFFFFF",
                          fontWeight: 600,
                        }}
                      >
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <div style={{ padding: "16px 20px" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12.5px",
                        color: "#5B6964",
                        lineHeight: 1.55,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.caption ||
                        "Curated visual highlight from Serenity Bay Hotel & Resort."}
                    </p>
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
                    onClick={() => handleToggleStatus(item)}
                    className="table-action-btn"
                    style={{
                      background: "#FFFFFF",
                      borderColor: "var(--color-border)",
                      color: isActive ? "#8A6414" : "#063B32",
                    }}
                  >
                    {isActive ? (
                      <>
                        <EyeOff size={13} /> Hide Photo
                      </>
                    ) : (
                      <>
                        <Eye size={13} /> Publish
                      </>
                    )}
                  </button>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setViewPhoto(item)}
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
                  <th style={{ padding: "15px 22px" }}>Photo &amp; Title</th>
                  <th style={{ padding: "15px 16px" }}>Category</th>
                  <th style={{ padding: "15px 16px" }}>Caption</th>
                  <th style={{ padding: "15px 16px" }}>Placement</th>
                  <th style={{ padding: "15px 16px" }}>Status</th>
                  <th style={{ padding: "15px 22px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isActive = item.status === "ACTIVE";
                  const isFeatured = Boolean(item.is_featured);
                  return (
                    <tr key={item.id}>
                      <td style={{ padding: "14px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={item.image_url}
                            alt={item.title}
                            style={{
                              width: "68px",
                              height: "48px",
                              borderRadius: "10px",
                              objectFit: "cover",
                              border: "1px solid var(--color-border)",
                              flexShrink: 0,
                            }}
                          />
                          <strong style={{ fontSize: "14px", color: "#061C2B" }}>
                            {item.title}
                          </strong>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span className="booking-id-badge">{item.category}</span>
                      </td>

                      <td
                        style={{
                          padding: "14px 16px",
                          maxWidth: "260px",
                          fontSize: "12px",
                          color: "#5B6964",
                        }}
                      >
                        {item.caption || "—"}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {isFeatured ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#8A6414",
                              background: "rgba(201,162,75,0.2)",
                              padding: "4px 10px",
                              borderRadius: "999px",
                            }}
                          >
                            <Star size={11} /> Featured
                          </span>
                        ) : (
                          <span style={{ fontSize: "11.5px", color: "#5B6964" }}>
                            Standard
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          className={
                            isActive
                              ? "dashboard-status dashboard-status-approved"
                              : "dashboard-status dashboard-status-rejected"
                          }
                        >
                          {item.status}
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
                            onClick={() => setViewPhoto(item)}
                            className="table-action-btn btn-view"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className="table-action-btn btn-view"
                          >
                            {isActive ? "Hide" : "Publish"}
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

      {/* VIEW PHOTO DETAILS MODAL */}
      {viewPhoto && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setViewPhoto(null)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "580px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div>
                <span className="panel-eyebrow">{viewPhoto.category}</span>
                <h4>{viewPhoto.title}</h4>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewPhoto(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                margin: "14px 0",
                height: "260px",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                background: "#061C2B",
              }}
            >
              <img
                src={viewPhoto.image_url}
                alt={viewPhoto.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div className="dashboard-modal-grid">
              <div>
                <span>Status</span>
                <strong>{viewPhoto.status}</strong>
              </div>
              <div>
                <span>Home Placement</span>
                <strong>
                  {viewPhoto.is_featured ? "Featured on Home" : "Gallery Only"}
                </strong>
              </div>
            </div>

            {viewPhoto.caption && (
              <p style={{ fontSize: "12.5px", color: "#5B6964", lineHeight: 1.6 }}>
                {viewPhoto.caption}
              </p>
            )}

            <div className="dashboard-modal-footer">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setViewPhoto(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="dashboard-btn-primary"
                onClick={() => {
                  const target = viewPhoto;
                  setViewPhoto(null);
                  handleOpenEdit(target);
                }}
              >
                <Edit2 size={14} /> Edit Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div
          className="dashboard-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="dashboard-modal-card"
            style={{ maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header" style={{ marginBottom: "16px" }}>
              <div>
                <span className="panel-eyebrow">
                  {modalMode === "create" ? "UPLOAD OR LINK MEDIA" : "UPDATE MEDIA"}
                </span>
                <h4>
                  {modalMode === "create"
                    ? "Add Resort Gallery Photo"
                    : "Update Gallery Photo"}
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
              {/* Choose File vs URL Switcher */}
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#5B6964",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  IMAGE SOURCE *
                </label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid",
                      borderColor:
                        uploadMode === "file" ? "#063B32" : "var(--color-border)",
                      background: uploadMode === "file" ? "#063B32" : "#F7F3E8",
                      color: uploadMode === "file" ? "#C9A24B" : "#061C2B",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Upload size={14} /> Choose File (Upload)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("url")}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid",
                      borderColor:
                        uploadMode === "url" ? "#063B32" : "var(--color-border)",
                      background: uploadMode === "url" ? "#063B32" : "#F7F3E8",
                      color: uploadMode === "url" ? "#C9A24B" : "#061C2B",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <LinkIcon size={14} /> Paste Image URL
                  </button>
                </div>

                {uploadMode === "file" ? (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "18px",
                      borderRadius: "12px",
                      border: "2px dashed #C9A24B",
                      background: "#F7F3E8",
                      cursor: "pointer",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#063B32",
                      fontWeight: 600,
                    }}
                  >
                    <Upload
                      size={22}
                      style={{ color: "#C9A24B", marginBottom: "6px" }}
                    />
                    <span>
                      {selectedFile
                        ? `Selected: ${selectedFile.name}`
                        : "Click to choose an image file (JPG, PNG, WEBP)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((p) => ({ ...p, image_url: val }));
                      setPreviewUrl(val);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                    }}
                  />
                )}

                {previewUrl && (
                  <div
                    style={{
                      marginTop: "10px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      height: "150px",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
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
                    PHOTO TITLE *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, title: e.target.value }))
                    }
                    required
                    placeholder="e.g. Infinity Pool at Sunset"
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
                    CATEGORY *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, category: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      fontSize: "13px",
                      background: "#F7F3E8",
                    }}
                  >
                    <option value="Rooms & Suites">Rooms &amp; Suites</option>
                    <option value="Facilities">Facilities</option>
                    <option value="Dining">Dining</option>
                    <option value="Resort Life">Resort Life</option>
                  </select>
                </div>
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
                  CAPTION / SHORT STORY
                </label>
                <textarea
                  rows={2}
                  value={formData.caption}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, caption: e.target.value }))
                  }
                  placeholder="Describe this moment at Serenity Bay..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    fontSize: "12.5px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  background: "#F7F3E8",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#061C2B",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        is_featured: e.target.checked,
                      }))
                    }
                  />
                  <span>Feature on Home Page &amp; Highlight Grid</span>
                </label>

                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, status: e.target.value }))
                  }
                  style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: "#FFFFFF",
                  }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="HIDDEN">HIDDEN</option>
                </select>
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
                    ? "Uploading & Saving..."
                    : modalMode === "create"
                    ? "Publish Photo"
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
              Delete Photo?
            </h4>
            <p style={{ margin: "0 0 20px", fontSize: "12.5px", color: "#5B6964" }}>
              This photo will be permanently removed from the resort gallery.
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

export default GalleryManagement;
